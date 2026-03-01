// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {EcoForgeToken} from "./EcoForgeToken.sol";
import {CarbonCredit} from "./CarbonCredit.sol";

/// @title EcoForgeGovernance — DAO for credit eligibility & dispute resolution
/// @notice 2 scopes only: CreditEligibility + DisputeResolution.
///         Stake-to-dispute mechanism. Auto-creates proposals from disputes.
contract EcoForgeGovernance {
    // ──────────────────────────────── Enums ────────────────────────────────
    enum ProposalType {
        CreditEligibility,
        DisputeResolution
    }

    enum DisputeStatus {
        Open,
        Resolved,
        Rejected
    }

    // ──────────────────────────────── Structs ──────────────────────────────
    struct Proposal {
        uint256 id;
        address proposer;
        ProposalType pType;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 deadline;
        bool executed;
        bytes actionCalldata; // action to execute (named to avoid reserved word)
    }

    struct Dispute {
        uint256 creditId;
        address challenger;
        string reason;
        DisputeStatus status;
    }

    struct DisputeStake {
        address challenger;
        uint256 amount;
        bool returned;
    }

    // ──────────────────────────────── State ────────────────────────────────
    EcoForgeToken public immutable governanceToken;
    CarbonCredit public immutable carbonCredit;

    mapping(uint256 => Proposal) private _proposals;
    mapping(uint256 => Dispute) private _disputes;
    mapping(uint256 => DisputeStake) private _disputeStakes; // disputeId => stake info
    mapping(uint256 => mapping(address => bool)) private _hasVoted; // proposalId => voter => voted
    mapping(uint256 => uint256) private _disputeToProposal; // disputeId => proposalId
    mapping(uint256 => uint256) private _proposalToDispute; // proposalId => disputeId (0 if not dispute)

    uint256 private _nextProposalId = 1;
    uint256 private _nextDisputeId = 1;

    // ──────────────────────────────── Constants ────────────────────────────
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant QUORUM_PERCENTAGE = 10; // 10% of total supply
    uint256 public immutable minProposalTokens; // MIN_PROPOSAL_TOKENS
    uint256 public immutable disputeStakeAmount; // DISPUTE_STAKE_AMOUNT
    uint256 public immutable disputeBonusAmount; // bonus tokens for successful challenger

    // ──────────────────────────────── Events ───────────────────────────────
    event ProposalCreated(
        uint256 indexed id,
        address indexed proposer,
        ProposalType pType
    );

    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed id);

    event DisputeRaised(
        uint256 indexed creditId,
        address indexed challenger,
        uint256 indexed autoProposalId
    );

    event DisputeStaked(
        uint256 indexed disputeId,
        address indexed challenger,
        uint256 amount
    );

    event DisputeStakeReturned(
        uint256 indexed disputeId,
        address indexed challenger,
        uint256 amount
    );

    event DisputeStakeBurned(
        uint256 indexed disputeId,
        address indexed challenger,
        uint256 amount
    );

    // ──────────────────────────────── Constructor ──────────────────────────
    constructor(
        address _governanceToken,
        address _carbonCredit,
        uint256 _minProposalTokens,
        uint256 _disputeStakeAmount,
        uint256 _disputeBonusAmount
    ) {
        require(_governanceToken != address(0), "Governance: zero token address");
        require(_carbonCredit != address(0), "Governance: zero credit address");

        governanceToken = EcoForgeToken(_governanceToken);
        carbonCredit = CarbonCredit(_carbonCredit);
        minProposalTokens = _minProposalTokens;
        disputeStakeAmount = _disputeStakeAmount;
        disputeBonusAmount = _disputeBonusAmount;
    }

    // ──────────────────────────────── Propose ──────────────────────────────

    /// @notice Create a proposal. Requires minimum token balance.
    function propose(
        ProposalType pType,
        string calldata description,
        bytes calldata actionCalldata
    ) external returns (uint256) {
        require(
            governanceToken.balanceOf(msg.sender) >= minProposalTokens * 10 ** governanceToken.decimals(),
            "Governance: insufficient tokens to propose"
        );

        uint256 proposalId = _nextProposalId++;

        _proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            pType: pType,
            description: description,
            forVotes: 0,
            againstVotes: 0,
            deadline: block.timestamp + VOTING_PERIOD,
            executed: false,
            actionCalldata: actionCalldata
        });

        emit ProposalCreated(proposalId, msg.sender, pType);

        return proposalId;
    }

    // ──────────────────────────────── Vote ──────────────────────────────────

    /// @notice Vote on a proposal. Weight = governance token balance.
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = _proposals[proposalId];
        require(proposal.id != 0, "Governance: proposal does not exist");
        require(block.timestamp <= proposal.deadline, "Governance: voting period ended");
        require(!_hasVoted[proposalId][msg.sender], "Governance: already voted");

        uint256 weight = governanceToken.balanceOf(msg.sender);
        require(weight > 0, "Governance: no voting power");

        _hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        emit Voted(proposalId, msg.sender, support, weight);

        // Record qualifying action for milestone progression (best-effort: don't block vote if daily cap hit)
        try governanceToken.recordAction(msg.sender) {} catch {}
    }

    // ──────────────────────────────── Execute ───────────────────────────────

    /// @notice Execute a proposal after deadline + quorum + majority FOR.
    function execute(uint256 proposalId) external {
        Proposal storage proposal = _proposals[proposalId];
        require(proposal.id != 0, "Governance: proposal does not exist");
        require(block.timestamp > proposal.deadline, "Governance: voting period not ended");
        require(!proposal.executed, "Governance: already executed");

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        uint256 quorum = (governanceToken.totalSupply() * QUORUM_PERCENTAGE) / 100;
        require(totalVotes >= quorum, "Governance: quorum not reached");
        require(proposal.forVotes > proposal.againstVotes, "Governance: majority not FOR");

        proposal.executed = true;

        // If this is a dispute resolution proposal, resolve the dispute
        uint256 disputeId = _proposalToDispute[proposalId];
        if (disputeId != 0) {
            _resolveDisputeForWin(disputeId);
        } else if (proposal.actionCalldata.length > 0) {
            // CreditEligibility proposals: execute the stored calldata on this contract
            (bool success, ) = address(this).call(proposal.actionCalldata);
            require(success, "Governance: calldata execution failed");
        }

        emit ProposalExecuted(proposalId);
    }

    // ──────────────────────────────── Dispute ───────────────────────────────

    /// @notice Challenge a credit. Stakes governance tokens. Auto-creates a DisputeResolution proposal.
    function disputeCredit(uint256 creditId, string calldata reason) external returns (uint256) {
        uint256 stakeAmount = disputeStakeAmount * 10 ** governanceToken.decimals();
        require(
            governanceToken.balanceOf(msg.sender) >= stakeAmount,
            "Governance: insufficient tokens to stake"
        );

        uint256 disputeId = _nextDisputeId++;

        _disputes[disputeId] = Dispute({
            creditId: creditId,
            challenger: msg.sender,
            reason: reason,
            status: DisputeStatus.Open
        });

        // Lock staked tokens by burning them (they'll be re-minted if dispute succeeds)
        governanceToken.burn(msg.sender, stakeAmount);

        _disputeStakes[disputeId] = DisputeStake({
            challenger: msg.sender,
            amount: stakeAmount,
            returned: false
        });

        emit DisputeStaked(disputeId, msg.sender, stakeAmount);

        // Auto-create a DisputeResolution proposal
        uint256 proposalId = _nextProposalId++;

        _proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            pType: ProposalType.DisputeResolution,
            description: reason,
            forVotes: 0,
            againstVotes: 0,
            deadline: block.timestamp + VOTING_PERIOD,
            executed: false,
            actionCalldata: ""
        });

        _disputeToProposal[disputeId] = proposalId;
        _proposalToDispute[proposalId] = disputeId;

        // Mark credit as disputed on-chain
        carbonCredit.setDisputed(creditId, true);

        emit ProposalCreated(proposalId, msg.sender, ProposalType.DisputeResolution);
        emit DisputeRaised(creditId, msg.sender, proposalId);

        return disputeId;
    }

    /// @notice Resolve a dispute when AGAINST wins (called externally when vote fails).
    function resolveDisputeAgainst(uint256 disputeId) external {
        Dispute storage dispute = _disputes[disputeId];
        require(dispute.challenger != address(0), "Governance: dispute does not exist");
        require(dispute.status == DisputeStatus.Open, "Governance: dispute not open");

        uint256 proposalId = _disputeToProposal[disputeId];
        Proposal storage proposal = _proposals[proposalId];
        require(block.timestamp > proposal.deadline, "Governance: voting period not ended");
        require(!proposal.executed, "Governance: already executed");

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        uint256 quorum = (governanceToken.totalSupply() * QUORUM_PERCENTAGE) / 100;

        // AGAINST wins: either quorum not reached, or AGAINST >= FOR
        require(
            totalVotes < quorum || proposal.againstVotes >= proposal.forVotes,
            "Governance: FOR won - use execute() instead"
        );

        proposal.executed = true;
        dispute.status = DisputeStatus.Rejected;

        // Unflag credit as disputed (credit returns to normal)
        carbonCredit.setDisputed(dispute.creditId, false);

        // Burn the staked tokens (punishment for false dispute)
        DisputeStake storage stake = _disputeStakes[disputeId];
        stake.returned = false; // explicitly mark as not returned (burned)

        emit DisputeStakeBurned(disputeId, stake.challenger, stake.amount);
        emit ProposalExecuted(proposalId);
    }

    // ──────────────────────────────── Internal ──────────────────────────────

    /// @dev Called internally when FOR wins on a dispute — fraud confirmed.
    function _resolveDisputeForWin(uint256 disputeId) internal {
        Dispute storage dispute = _disputes[disputeId];
        require(dispute.status == DisputeStatus.Open, "Governance: dispute not open");

        dispute.status = DisputeStatus.Resolved;

        DisputeStake storage stake = _disputeStakes[disputeId];

        // 1. Return staked tokens + bonus to challenger (re-mint — Governance needs MINTER_ROLE on EcoForgeToken)
        stake.returned = true;
        governanceToken.mint(stake.challenger, stake.amount);

        uint256 bonus = disputeBonusAmount * 10 ** governanceToken.decimals();
        if (bonus > 0) {
            governanceToken.mint(stake.challenger, bonus);
        }

        emit DisputeStakeReturned(disputeId, stake.challenger, stake.amount);

        // 2. Get credit issuer for punishment
        CarbonCredit.CreditType memory credit = carbonCredit.getCreditType(dispute.creditId);

        // 3. Suspend the credit
        carbonCredit.suspendCredit(dispute.creditId);

        // 4. Burn all issuer tokens
        if (governanceToken.balanceOf(credit.issuer) > 0) {
            governanceToken.burnAll(credit.issuer);
        }

        // 5. Blacklist issuer
        if (!carbonCredit.isBlacklisted(credit.issuer)) {
            carbonCredit.blacklist(credit.issuer, dispute.creditId);
        }
    }

    // ──────────────────────────────── Views ─────────────────────────────────

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        require(_proposals[proposalId].id != 0, "Governance: proposal does not exist");
        return _proposals[proposalId];
    }

    function getDispute(uint256 disputeId) external view returns (Dispute memory) {
        require(_disputes[disputeId].challenger != address(0), "Governance: dispute does not exist");
        return _disputes[disputeId];
    }

    function getDisputeStake(uint256 disputeId) external view returns (DisputeStake memory) {
        return _disputeStakes[disputeId];
    }

    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return _hasVoted[proposalId][voter];
    }

    function getDisputeProposalId(uint256 disputeId) external view returns (uint256) {
        return _disputeToProposal[disputeId];
    }
}
