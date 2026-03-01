// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {EcoForgeToken} from "../src/contracts/EcoForgeToken.sol";
import {CarbonCredit} from "../src/contracts/CarbonCredit.sol";
import {EcoForgeGovernance} from "../src/contracts/EcoForgeGovernance.sol";

contract GovernanceTest is Test {
    EcoForgeToken public token;
    CarbonCredit public carbonCredit;
    EcoForgeGovernance public governance;

    address public deployer = address(0xDEAD);
    address public alice = address(0xA11CE); // credit issuer
    address public bob = address(0xB0B); // dispute challenger
    address public charlie = address(0xC4A3); // voter
    address public dave = address(0xDA7E); // additional voter
    address public eve = address(0xE7E); // additional voter
    address public unauthorized = address(0xBAD);

    uint256 public constant DAILY_CAP = 10;
    uint256 public constant ONE_TOKEN = 1e18;
    uint256 public constant VOTING_PERIOD = 7 days;

    // Mirror events from EcoForgeGovernance
    event ProposalCreated(
        uint256 indexed id,
        address indexed proposer,
        EcoForgeGovernance.ProposalType pType
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

    // ═══════════════════════════════════════════════════════════════════════
    //  SETUP
    // ═══════════════════════════════════════════════════════════════════════

    function setUp() public {
        vm.startPrank(deployer);

        // 1. Deploy EcoForgeToken with dailyActionCap = 10
        token = new EcoForgeToken(DAILY_CAP);

        // 2. Deploy CarbonCredit
        carbonCredit = new CarbonCredit();

        // 3. Deploy EcoForgeGovernance: minProposal=1, stakeAmount=1, bonusAmount=1
        governance = new EcoForgeGovernance(
            address(token),
            address(carbonCredit),
            1, // minProposalTokens
            1, // disputeStakeAmount
            1  // disputeBonusAmount
        );

        // 4. Grant MINTER_ROLE on EcoForgeToken to governance contract
        //    (governance needs to call burn, burnAll, mint, recordAction)
        token.grantRole(token.MINTER_ROLE(), address(governance));

        // 5. Grant ADMIN_ROLE on CarbonCredit to governance contract
        //    (governance needs suspendCredit + blacklist)
        carbonCredit.grantRole(carbonCredit.ADMIN_ROLE(), address(governance));

        // 6. Grant VERIFIER_ROLE on CarbonCredit to governance contract
        carbonCredit.grantRole(carbonCredit.VERIFIER_ROLE(), address(governance));

        vm.stopPrank();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════════════════════

    /// @dev Record enough actions for a user to reach the desired number of milestone tiers.
    ///      Tier 1 = 5 actions -> 1 token. Tier 2 = 15 actions -> 2 more tokens. etc.
    ///      Uses vm.warp to handle daily action caps (cap = 10 per day).
    function _giveTokens(address user, uint256 milestones) internal {
        // Milestone thresholds: [5, 15, 30, 50, 100, 200, 500]
        uint256[7] memory thresholds = [uint256(5), 15, 30, 50, 100, 200, 500];
        require(milestones <= 7, "max 7 milestones");
        if (milestones == 0) return;

        uint256 target = thresholds[milestones - 1];
        uint256 done = 0;

        while (done < target) {
            uint256 batchSize = target - done;
            if (batchSize > DAILY_CAP) {
                batchSize = DAILY_CAP;
            }

            for (uint256 i = 0; i < batchSize; i++) {
                vm.prank(deployer);
                token.recordAction(user);
                done++;
            }

            // If we still need more, warp to next day
            if (done < target) {
                vm.warp(block.timestamp + 1 days);
            }
        }
    }

    /// @dev Create a community credit as the given issuer. Returns the creditId.
    function _createCommunityCredit(address issuer) internal returns (uint256) {
        CarbonCredit.CreditParams memory params = CarbonCredit.CreditParams({
            projectName: "Test Reforestation",
            projectType: "reforestation",
            region: "Amazon",
            vintageYear: 2024,
            tonnesCO2e: 100,
            initialSupply: 1000,
            metadataURI: "ipfs://QmTest"
        });

        vm.prank(issuer);
        uint256 creditId = carbonCredit.createCommunityCredit(params);
        return creditId;
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  1. PROPOSE
    // ═══════════════════════════════════════════════════════════════════════

    function test_propose_creates_proposal_with_correct_fields() public {
        // Give alice tokens (milestone tier 1 = 1 token, need >= 1 * 10^18)
        _giveTokens(alice, 1);
        assertGe(token.balanceOf(alice), 1 * ONE_TOKEN);

        vm.prank(alice);
        uint256 proposalId = governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "Approve credit #42",
            ""
        );

        assertEq(proposalId, 1);

        EcoForgeGovernance.Proposal memory p = governance.getProposal(proposalId);
        assertEq(p.id, 1);
        assertEq(p.proposer, alice);
        assertEq(uint256(p.pType), uint256(EcoForgeGovernance.ProposalType.CreditEligibility));
        assertEq(p.description, "Approve credit #42");
        assertEq(p.forVotes, 0);
        assertEq(p.againstVotes, 0);
        assertEq(p.deadline, block.timestamp + VOTING_PERIOD);
        assertFalse(p.executed);
    }

    function test_propose_returns_proposalId() public {
        _giveTokens(alice, 1);

        vm.prank(alice);
        uint256 id1 = governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "First proposal",
            ""
        );
        assertEq(id1, 1);

        vm.prank(alice);
        uint256 id2 = governance.propose(
            EcoForgeGovernance.ProposalType.DisputeResolution,
            "Second proposal",
            ""
        );
        assertEq(id2, 2);
    }

    function test_propose_emits_ProposalCreated() public {
        _giveTokens(alice, 1);

        vm.prank(alice);
        vm.expectEmit(true, true, false, true, address(governance));
        emit ProposalCreated(1, alice, EcoForgeGovernance.ProposalType.CreditEligibility);
        governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "Approve credit",
            ""
        );
    }

    function test_propose_reverts_if_insufficient_tokens() public {
        // alice has 0 tokens
        assertEq(token.balanceOf(alice), 0);

        vm.prank(alice);
        vm.expectRevert("Governance: insufficient tokens to propose");
        governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "I have no tokens",
            ""
        );
    }

    function test_propose_reverts_if_balance_below_minimum() public {
        // Give alice 1 token, then burn most of it (leave less than 1 * 10^18)
        _giveTokens(alice, 1);
        assertEq(token.balanceOf(alice), 1 * ONE_TOKEN);

        // Burn the token so alice has 0
        vm.prank(deployer);
        token.burn(alice, 1 * ONE_TOKEN);
        assertEq(token.balanceOf(alice), 0);

        vm.prank(alice);
        vm.expectRevert("Governance: insufficient tokens to propose");
        governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "Not enough anymore",
            ""
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  2. VOTE
    // ═══════════════════════════════════════════════════════════════════════

    function test_vote_weight_equals_token_balance() public {
        // Give alice 1 token (tier 1), charlie 3 tokens (tier 2: 1+2=3)
        _giveTokens(alice, 1);
        _giveTokens(charlie, 2);

        // Alice creates proposal
        vm.prank(alice);
        uint256 proposalId = governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "Test vote weight",
            ""
        );

        // Alice votes FOR with weight = 1 token
        vm.prank(alice);
        governance.vote(proposalId, true);

        // Charlie votes AGAINST with weight = 3 tokens
        vm.prank(charlie);
        governance.vote(proposalId, false);

        EcoForgeGovernance.Proposal memory p = governance.getProposal(proposalId);
        assertEq(p.forVotes, 1 * ONE_TOKEN);
        assertEq(p.againstVotes, 3 * ONE_TOKEN);
    }

    function test_vote_cannot_vote_twice() public {
        _giveTokens(alice, 1);

        vm.prank(alice);
        uint256 proposalId = governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "Double vote test",
            ""
        );

        vm.prank(alice);
        governance.vote(proposalId, true);

        vm.prank(alice);
        vm.expectRevert("Governance: already voted");
        governance.vote(proposalId, true);
    }

    function test_vote_cannot_vote_after_deadline() public {
        _giveTokens(alice, 1);
        _giveTokens(charlie, 1);

        vm.prank(alice);
        uint256 proposalId = governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "Deadline test",
            ""
        );

        // Warp past the voting period
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        vm.prank(charlie);
        vm.expectRevert("Governance: voting period ended");
        governance.vote(proposalId, true);
    }

    function test_vote_emits_Voted() public {
        _giveTokens(alice, 1);

        vm.prank(alice);
        uint256 proposalId = governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "Emit test",
            ""
        );

        uint256 aliceBalance = token.balanceOf(alice);

        vm.prank(alice);
        vm.expectEmit(true, true, false, true, address(governance));
        emit Voted(proposalId, alice, true, aliceBalance);
        governance.vote(proposalId, true);
    }

    function test_vote_reverts_if_no_voting_power() public {
        _giveTokens(alice, 1);

        vm.prank(alice);
        uint256 proposalId = governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "No power test",
            ""
        );

        // unauthorized has 0 tokens
        assertEq(token.balanceOf(unauthorized), 0);

        vm.prank(unauthorized);
        vm.expectRevert("Governance: no voting power");
        governance.vote(proposalId, true);
    }

    function test_vote_reverts_if_proposal_does_not_exist() public {
        _giveTokens(alice, 1);

        vm.prank(alice);
        vm.expectRevert("Governance: proposal does not exist");
        governance.vote(999, true);
    }

    function test_vote_for_and_against_separate() public {
        _giveTokens(alice, 1);
        _giveTokens(bob, 1);
        _giveTokens(charlie, 1);

        vm.prank(alice);
        uint256 proposalId = governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "Mixed votes",
            ""
        );

        // alice votes FOR
        vm.prank(alice);
        governance.vote(proposalId, true);

        // bob votes AGAINST
        vm.prank(bob);
        governance.vote(proposalId, false);

        // charlie votes FOR
        vm.prank(charlie);
        governance.vote(proposalId, true);

        EcoForgeGovernance.Proposal memory p = governance.getProposal(proposalId);
        assertEq(p.forVotes, 2 * ONE_TOKEN); // alice + charlie
        assertEq(p.againstVotes, 1 * ONE_TOKEN); // bob
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  3. EXECUTE
    // ═══════════════════════════════════════════════════════════════════════

    function test_execute_succeeds_with_quorum_and_majority() public {
        // We need enough total supply to satisfy quorum.
        // Quorum = 10% of total supply. If we give 1 token each to alice+charlie+bob,
        // total supply = 3 tokens. Quorum = 0.3 tokens.
        // forVotes (2 tokens from alice+charlie) > quorum and > againstVotes.
        _giveTokens(alice, 1);
        _giveTokens(charlie, 1);

        vm.prank(alice);
        uint256 proposalId = governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "Execute test",
            ""
        );

        // Both vote FOR
        vm.prank(alice);
        governance.vote(proposalId, true);
        vm.prank(charlie);
        governance.vote(proposalId, true);

        // Warp past deadline
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        governance.execute(proposalId);

        EcoForgeGovernance.Proposal memory p = governance.getProposal(proposalId);
        assertTrue(p.executed);
    }

    function test_execute_emits_ProposalExecuted() public {
        _giveTokens(alice, 1);
        _giveTokens(charlie, 1);

        vm.prank(alice);
        uint256 proposalId = governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "Emit execute test",
            ""
        );

        vm.prank(alice);
        governance.vote(proposalId, true);
        vm.prank(charlie);
        governance.vote(proposalId, true);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        vm.expectEmit(true, false, false, true, address(governance));
        emit ProposalExecuted(proposalId);
        governance.execute(proposalId);
    }

    function test_execute_reverts_if_voting_period_not_ended() public {
        _giveTokens(alice, 1);

        vm.prank(alice);
        uint256 proposalId = governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "Too early",
            ""
        );

        vm.prank(alice);
        governance.vote(proposalId, true);

        // Do NOT warp past deadline
        vm.expectRevert("Governance: voting period not ended");
        governance.execute(proposalId);
    }

    function test_execute_reverts_if_quorum_not_reached() public {
        // Create a scenario where total supply is large but votes are tiny.
        // Give alice 1 token, and give dave many tokens (so total supply is large).
        _giveTokens(alice, 1); // 1 token
        _giveTokens(dave, 3); // 6 tokens (1+2+3) => total supply = 7 tokens
        // quorum = 7 * 10% = 0.7 tokens

        vm.prank(alice);
        uint256 proposalId = governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "No quorum",
            ""
        );

        // Note: voting triggers recordAction which may mint more tokens (if dave votes).
        // Only alice votes (1 token). But total supply might change due to recordAction.
        // Let's check: alice votes with weight = 1 token. recordAction gives alice action #6.
        // alice was at 5 actions from _giveTokens(alice, 1). voting adds action #6.
        // No new milestone yet (next is 15). So alice balance stays 1 token.
        // dave at 30 actions. No voting from dave. Total supply still = 7 tokens.
        // quorum = 7e18 * 10 / 100 = 0.7e18. Alice's 1e18 > 0.7e18. Actually quorum IS reached.

        // To truly not reach quorum, we need NO votes at all or very few.
        // Let's not vote at all and just try to execute.

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        vm.expectRevert("Governance: quorum not reached");
        governance.execute(proposalId);
    }

    function test_execute_reverts_if_majority_not_FOR() public {
        _giveTokens(alice, 1); // 1 token
        _giveTokens(charlie, 2); // 3 tokens (1+2)

        vm.prank(alice);
        uint256 proposalId = governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "Majority against",
            ""
        );

        // alice votes FOR (1 token), charlie votes AGAINST (3 tokens)
        vm.prank(alice);
        governance.vote(proposalId, true);
        vm.prank(charlie);
        governance.vote(proposalId, false);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        vm.expectRevert("Governance: majority not FOR");
        governance.execute(proposalId);
    }

    function test_execute_reverts_if_already_executed() public {
        _giveTokens(alice, 1);
        _giveTokens(charlie, 1);

        vm.prank(alice);
        uint256 proposalId = governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "Double execute",
            ""
        );

        vm.prank(alice);
        governance.vote(proposalId, true);
        vm.prank(charlie);
        governance.vote(proposalId, true);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        governance.execute(proposalId);

        vm.expectRevert("Governance: already executed");
        governance.execute(proposalId);
    }

    function test_execute_reverts_if_proposal_does_not_exist() public {
        vm.expectRevert("Governance: proposal does not exist");
        governance.execute(999);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  4. DISPUTE CREDIT
    // ═══════════════════════════════════════════════════════════════════════

    function test_disputeCredit_burns_stake_tokens() public {
        uint256 creditId = _createCommunityCredit(alice);

        // Give bob 1 token to stake (tier 1 = 1 token)
        _giveTokens(bob, 1);
        uint256 bobBalanceBefore = token.balanceOf(bob);
        assertEq(bobBalanceBefore, 1 * ONE_TOKEN);

        vm.prank(bob);
        governance.disputeCredit(creditId, "Fake project");

        // Bob's balance should be reduced by the stake (1 token)
        uint256 bobBalanceAfter = token.balanceOf(bob);
        assertEq(bobBalanceAfter, 0);
    }

    function test_disputeCredit_creates_dispute_and_proposal() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(bob, 1);

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "Suspicious satellite data");

        assertEq(disputeId, 1);

        // Check dispute
        EcoForgeGovernance.Dispute memory d = governance.getDispute(disputeId);
        assertEq(d.creditId, creditId);
        assertEq(d.challenger, bob);
        assertEq(d.reason, "Suspicious satellite data");
        assertEq(uint256(d.status), uint256(EcoForgeGovernance.DisputeStatus.Open));

        // Check auto-created proposal
        uint256 proposalId = governance.getDisputeProposalId(disputeId);
        assertTrue(proposalId > 0);

        EcoForgeGovernance.Proposal memory p = governance.getProposal(proposalId);
        assertEq(p.proposer, bob);
        assertEq(uint256(p.pType), uint256(EcoForgeGovernance.ProposalType.DisputeResolution));
        assertEq(p.description, "Suspicious satellite data");
        assertEq(p.deadline, block.timestamp + VOTING_PERIOD);
    }

    function test_disputeCredit_emits_events() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(bob, 1);

        vm.prank(bob);

        // Expect DisputeStaked event (disputeId=1, challenger=bob, amount=1e18)
        vm.expectEmit(true, true, false, true, address(governance));
        emit DisputeStaked(1, bob, 1 * ONE_TOKEN);

        // Expect ProposalCreated event (proposalId=1, proposer=bob, type=DisputeResolution)
        vm.expectEmit(true, true, false, true, address(governance));
        emit ProposalCreated(1, bob, EcoForgeGovernance.ProposalType.DisputeResolution);

        // Expect DisputeRaised event (creditId, challenger=bob, autoProposalId=1)
        vm.expectEmit(true, true, true, true, address(governance));
        emit DisputeRaised(creditId, bob, 1);

        governance.disputeCredit(creditId, "Fake project");
    }

    function test_disputeCredit_reverts_if_insufficient_tokens() public {
        uint256 creditId = _createCommunityCredit(alice);

        // bob has 0 tokens
        assertEq(token.balanceOf(bob), 0);

        vm.prank(bob);
        vm.expectRevert("Governance: insufficient tokens to stake");
        governance.disputeCredit(creditId, "Fake project");
    }

    function test_disputeCredit_records_stake() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(bob, 1);

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "Fake");

        EcoForgeGovernance.DisputeStake memory stake = governance.getDisputeStake(disputeId);
        assertEq(stake.challenger, bob);
        assertEq(stake.amount, 1 * ONE_TOKEN);
        assertFalse(stake.returned);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  5. DISPUTE FOR WINS (execute on dispute proposal)
    // ═══════════════════════════════════════════════════════════════════════

    function test_dispute_for_wins_credit_suspended() public {
        // Alice creates a community credit
        uint256 creditId = _createCommunityCredit(alice);

        // Give alice tokens so she has something to burn (and to make totalSupply > 0)
        _giveTokens(alice, 1);

        // Give bob tokens to dispute (tier 1 = 1 token)
        _giveTokens(bob, 1);

        // Give charlie and dave tokens to vote
        _giveTokens(charlie, 1);
        _giveTokens(dave, 1);

        // Bob disputes
        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "Fraudulent credit");
        uint256 proposalId = governance.getDisputeProposalId(disputeId);

        // Charlie and dave vote FOR (fraud confirmed)
        vm.prank(charlie);
        governance.vote(proposalId, true);
        vm.prank(dave);
        governance.vote(proposalId, true);

        // Warp past deadline
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        // Execute
        governance.execute(proposalId);

        // Check credit is suspended
        CarbonCredit.CreditType memory credit = carbonCredit.getCreditType(creditId);
        assertEq(uint256(credit.status), uint256(CarbonCredit.CreditStatus.Suspended));
    }

    function test_dispute_for_wins_stake_returned_and_bonus_minted() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(alice, 1);
        _giveTokens(bob, 1);
        _giveTokens(charlie, 1);
        _giveTokens(dave, 1);

        // Bob's balance before dispute = 1 token
        assertEq(token.balanceOf(bob), 1 * ONE_TOKEN);

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "Fraud");
        uint256 proposalId = governance.getDisputeProposalId(disputeId);

        // Bob's balance after staking = 0
        assertEq(token.balanceOf(bob), 0);

        // Vote FOR (fraud confirmed)
        vm.prank(charlie);
        governance.vote(proposalId, true);
        vm.prank(dave);
        governance.vote(proposalId, true);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        governance.execute(proposalId);

        // Bob should get stake back (1 token) + bonus (1 token) = 2 tokens
        // Note: voting recordAction might have given bob extra actions, but he had only 5 actions
        // before (from _giveTokens(bob,1)). He didn't vote, so no recordAction for bob.
        assertEq(token.balanceOf(bob), 2 * ONE_TOKEN);

        // Check stake marked as returned
        EcoForgeGovernance.DisputeStake memory stake = governance.getDisputeStake(disputeId);
        assertTrue(stake.returned);
    }

    function test_dispute_for_wins_issuer_tokens_burned() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(alice, 1);
        _giveTokens(bob, 1);
        _giveTokens(charlie, 1);
        _giveTokens(dave, 1);

        uint256 aliceBalanceBefore = token.balanceOf(alice);
        assertEq(aliceBalanceBefore, 1 * ONE_TOKEN);

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "Fraud");
        uint256 proposalId = governance.getDisputeProposalId(disputeId);

        vm.prank(charlie);
        governance.vote(proposalId, true);
        vm.prank(dave);
        governance.vote(proposalId, true);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        governance.execute(proposalId);

        // Alice (issuer) should have all tokens burned
        assertEq(token.balanceOf(alice), 0);
    }

    function test_dispute_for_wins_issuer_blacklisted() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(alice, 1);
        _giveTokens(bob, 1);
        _giveTokens(charlie, 1);
        _giveTokens(dave, 1);

        assertFalse(carbonCredit.isBlacklisted(alice));

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "Fraud");
        uint256 proposalId = governance.getDisputeProposalId(disputeId);

        vm.prank(charlie);
        governance.vote(proposalId, true);
        vm.prank(dave);
        governance.vote(proposalId, true);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        governance.execute(proposalId);

        // Alice should be blacklisted
        assertTrue(carbonCredit.isBlacklisted(alice));
    }

    function test_dispute_for_wins_dispute_status_resolved() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(alice, 1);
        _giveTokens(bob, 1);
        _giveTokens(charlie, 1);
        _giveTokens(dave, 1);

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "Fraud");
        uint256 proposalId = governance.getDisputeProposalId(disputeId);

        vm.prank(charlie);
        governance.vote(proposalId, true);
        vm.prank(dave);
        governance.vote(proposalId, true);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);
        governance.execute(proposalId);

        EcoForgeGovernance.Dispute memory dispute = governance.getDispute(disputeId);
        assertEq(uint256(dispute.status), uint256(EcoForgeGovernance.DisputeStatus.Resolved));
    }

    function test_dispute_for_wins_emits_stake_returned() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(alice, 1);
        _giveTokens(bob, 1);
        _giveTokens(charlie, 1);
        _giveTokens(dave, 1);

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "Fraud");
        uint256 proposalId = governance.getDisputeProposalId(disputeId);

        vm.prank(charlie);
        governance.vote(proposalId, true);
        vm.prank(dave);
        governance.vote(proposalId, true);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        vm.expectEmit(true, true, false, true, address(governance));
        emit DisputeStakeReturned(disputeId, bob, 1 * ONE_TOKEN);
        governance.execute(proposalId);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  6. DISPUTE AGAINST WINS (resolveDisputeAgainst)
    // ═══════════════════════════════════════════════════════════════════════

    function test_dispute_against_wins_status_rejected() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(bob, 1);
        _giveTokens(charlie, 1);
        _giveTokens(dave, 1);

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "False accusation");
        uint256 proposalId = governance.getDisputeProposalId(disputeId);

        // Charlie and dave vote AGAINST (dispute rejected)
        vm.prank(charlie);
        governance.vote(proposalId, false);
        vm.prank(dave);
        governance.vote(proposalId, false);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        governance.resolveDisputeAgainst(disputeId);

        EcoForgeGovernance.Dispute memory dispute = governance.getDispute(disputeId);
        assertEq(uint256(dispute.status), uint256(EcoForgeGovernance.DisputeStatus.Rejected));
    }

    function test_dispute_against_wins_emits_stake_burned() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(bob, 1);
        _giveTokens(charlie, 1);
        _giveTokens(dave, 1);

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "False accusation");
        uint256 proposalId = governance.getDisputeProposalId(disputeId);

        vm.prank(charlie);
        governance.vote(proposalId, false);
        vm.prank(dave);
        governance.vote(proposalId, false);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        vm.expectEmit(true, true, false, true, address(governance));
        emit DisputeStakeBurned(disputeId, bob, 1 * ONE_TOKEN);
        governance.resolveDisputeAgainst(disputeId);
    }

    function test_dispute_against_wins_proposal_marked_executed() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(bob, 1);
        _giveTokens(charlie, 1);
        _giveTokens(dave, 1);

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "False accusation");
        uint256 proposalId = governance.getDisputeProposalId(disputeId);

        vm.prank(charlie);
        governance.vote(proposalId, false);
        vm.prank(dave);
        governance.vote(proposalId, false);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        governance.resolveDisputeAgainst(disputeId);

        EcoForgeGovernance.Proposal memory p = governance.getProposal(proposalId);
        assertTrue(p.executed);
    }

    function test_dispute_against_wins_stake_not_returned() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(bob, 1);
        _giveTokens(charlie, 1);
        _giveTokens(dave, 1);

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "False accusation");
        uint256 proposalId = governance.getDisputeProposalId(disputeId);

        vm.prank(charlie);
        governance.vote(proposalId, false);
        vm.prank(dave);
        governance.vote(proposalId, false);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        governance.resolveDisputeAgainst(disputeId);

        // Bob should still have 0 tokens (stake was burned at dispute creation, not returned)
        assertEq(token.balanceOf(bob), 0);

        // Stake marked as not returned
        EcoForgeGovernance.DisputeStake memory stake = governance.getDisputeStake(disputeId);
        assertFalse(stake.returned);
    }

    function test_dispute_against_wins_when_quorum_not_reached() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(bob, 1);
        // Give many tokens to dave (to inflate total supply) but dave does not vote
        _giveTokens(dave, 3); // 6 tokens => total supply large

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "False accusation");
        uint256 proposalId = governance.getDisputeProposalId(disputeId);

        // No one votes. Total votes = 0. Quorum = 10% of totalSupply won't be reached.
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        governance.resolveDisputeAgainst(disputeId);

        EcoForgeGovernance.Dispute memory dispute = governance.getDispute(disputeId);
        assertEq(uint256(dispute.status), uint256(EcoForgeGovernance.DisputeStatus.Rejected));
    }

    function test_resolveDisputeAgainst_reverts_if_FOR_won() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(alice, 1);
        _giveTokens(bob, 1);
        _giveTokens(charlie, 1);
        _giveTokens(dave, 1);

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "Legit dispute");
        uint256 proposalId = governance.getDisputeProposalId(disputeId);

        // Both vote FOR (dispute wins)
        vm.prank(charlie);
        governance.vote(proposalId, true);
        vm.prank(dave);
        governance.vote(proposalId, true);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        vm.expectRevert("Governance: FOR won - use execute() instead");
        governance.resolveDisputeAgainst(disputeId);
    }

    function test_resolveDisputeAgainst_reverts_if_voting_not_ended() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(bob, 1);

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "Too early");

        // Do NOT warp past deadline
        vm.expectRevert("Governance: voting period not ended");
        governance.resolveDisputeAgainst(disputeId);
    }

    function test_resolveDisputeAgainst_reverts_if_dispute_not_open() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(bob, 1);
        _giveTokens(charlie, 1);
        _giveTokens(dave, 1);

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "Dup test");
        uint256 proposalId = governance.getDisputeProposalId(disputeId);

        vm.prank(charlie);
        governance.vote(proposalId, false);
        vm.prank(dave);
        governance.vote(proposalId, false);

        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        governance.resolveDisputeAgainst(disputeId);

        // Try again — should fail because dispute is no longer Open
        vm.expectRevert("Governance: dispute not open");
        governance.resolveDisputeAgainst(disputeId);
    }

    function test_resolveDisputeAgainst_reverts_if_dispute_does_not_exist() public {
        vm.expectRevert("Governance: dispute does not exist");
        governance.resolveDisputeAgainst(999);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  7. VIEWS
    // ═══════════════════════════════════════════════════════════════════════

    function test_getProposal_returns_correct_data() public {
        _giveTokens(alice, 1);

        vm.prank(alice);
        uint256 proposalId = governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "View test",
            abi.encode(42)
        );

        EcoForgeGovernance.Proposal memory p = governance.getProposal(proposalId);
        assertEq(p.id, proposalId);
        assertEq(p.proposer, alice);
        assertEq(p.description, "View test");
        assertEq(keccak256(p.actionCalldata), keccak256(abi.encode(42)));
    }

    function test_getProposal_reverts_if_nonexistent() public {
        vm.expectRevert("Governance: proposal does not exist");
        governance.getProposal(999);
    }

    function test_getDispute_returns_correct_data() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(bob, 1);

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "Test reason");

        EcoForgeGovernance.Dispute memory d = governance.getDispute(disputeId);
        assertEq(d.creditId, creditId);
        assertEq(d.challenger, bob);
        assertEq(d.reason, "Test reason");
        assertEq(uint256(d.status), uint256(EcoForgeGovernance.DisputeStatus.Open));
    }

    function test_getDispute_reverts_if_nonexistent() public {
        vm.expectRevert("Governance: dispute does not exist");
        governance.getDispute(999);
    }

    function test_getDisputeStake_returns_correct_data() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(bob, 1);

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "Stake view");

        EcoForgeGovernance.DisputeStake memory s = governance.getDisputeStake(disputeId);
        assertEq(s.challenger, bob);
        assertEq(s.amount, 1 * ONE_TOKEN);
        assertFalse(s.returned);
    }

    function test_getDisputeStake_returns_empty_for_nonexistent() public view {
        EcoForgeGovernance.DisputeStake memory s = governance.getDisputeStake(999);
        assertEq(s.challenger, address(0));
        assertEq(s.amount, 0);
        assertFalse(s.returned);
    }

    function test_hasVoted_returns_false_before_voting() public {
        _giveTokens(alice, 1);

        vm.prank(alice);
        uint256 proposalId = governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "Has voted test",
            ""
        );

        assertFalse(governance.hasVoted(proposalId, alice));
        assertFalse(governance.hasVoted(proposalId, bob));
    }

    function test_hasVoted_returns_true_after_voting() public {
        _giveTokens(alice, 1);

        vm.prank(alice);
        uint256 proposalId = governance.propose(
            EcoForgeGovernance.ProposalType.CreditEligibility,
            "Has voted test",
            ""
        );

        vm.prank(alice);
        governance.vote(proposalId, true);

        assertTrue(governance.hasVoted(proposalId, alice));
        assertFalse(governance.hasVoted(proposalId, bob)); // bob hasn't voted
    }

    function test_getDisputeProposalId_returns_correct_mapping() public {
        uint256 creditId = _createCommunityCredit(alice);
        _giveTokens(bob, 1);

        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "Mapping test");

        uint256 proposalId = governance.getDisputeProposalId(disputeId);
        assertTrue(proposalId > 0);

        // Verify the proposal exists and is a DisputeResolution
        EcoForgeGovernance.Proposal memory p = governance.getProposal(proposalId);
        assertEq(uint256(p.pType), uint256(EcoForgeGovernance.ProposalType.DisputeResolution));
    }

    function test_getDisputeProposalId_returns_zero_for_nonexistent() public view {
        assertEq(governance.getDisputeProposalId(999), 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  IMMUTABLE GETTERS
    // ═══════════════════════════════════════════════════════════════════════

    function test_immutable_values() public view {
        assertEq(address(governance.governanceToken()), address(token));
        assertEq(address(governance.carbonCredit()), address(carbonCredit));
        assertEq(governance.minProposalTokens(), 1);
        assertEq(governance.disputeStakeAmount(), 1);
        assertEq(governance.disputeBonusAmount(), 1);
        assertEq(governance.VOTING_PERIOD(), 7 days);
        assertEq(governance.QUORUM_PERCENTAGE(), 10);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  CONSTRUCTOR EDGE CASES
    // ═══════════════════════════════════════════════════════════════════════

    function test_constructor_reverts_zero_token_address() public {
        vm.expectRevert("Governance: zero token address");
        new EcoForgeGovernance(
            address(0),
            address(carbonCredit),
            1, 1, 1
        );
    }

    function test_constructor_reverts_zero_credit_address() public {
        vm.expectRevert("Governance: zero credit address");
        new EcoForgeGovernance(
            address(token),
            address(0),
            1, 1, 1
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  FULL DISPUTE LIFECYCLE — INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════

    function test_full_dispute_lifecycle_for_wins() public {
        // 1. Alice creates a community credit
        uint256 creditId = _createCommunityCredit(alice);

        // 2. Give tokens to all participants
        _giveTokens(alice, 1); // 1 token (issuer)
        _giveTokens(bob, 1); // 1 token (challenger)
        _giveTokens(charlie, 1); // 1 token (voter)
        _giveTokens(dave, 1); // 1 token (voter)

        // 3. Bob disputes the credit
        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "Evidence of fraud");
        uint256 proposalId = governance.getDisputeProposalId(disputeId);

        // Verify initial state
        assertEq(token.balanceOf(bob), 0); // stake burned
        assertEq(uint256(governance.getDispute(disputeId).status), uint256(EcoForgeGovernance.DisputeStatus.Open));

        // 4. Voters vote FOR (confirm fraud)
        vm.prank(charlie);
        governance.vote(proposalId, true);
        vm.prank(dave);
        governance.vote(proposalId, true);

        // 5. Wait for deadline
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        // 6. Execute — fraud confirmed
        governance.execute(proposalId);

        // 7. Verify all outcomes
        // Credit suspended
        assertEq(uint256(carbonCredit.getCreditType(creditId).status), uint256(CarbonCredit.CreditStatus.Suspended));
        // Issuer blacklisted
        assertTrue(carbonCredit.isBlacklisted(alice));
        // Issuer tokens burned
        assertEq(token.balanceOf(alice), 0);
        // Challenger rewarded (stake + bonus = 2 tokens)
        assertEq(token.balanceOf(bob), 2 * ONE_TOKEN);
        // Dispute resolved
        assertEq(uint256(governance.getDispute(disputeId).status), uint256(EcoForgeGovernance.DisputeStatus.Resolved));
        // Proposal executed
        assertTrue(governance.getProposal(proposalId).executed);
        // Stake marked returned
        assertTrue(governance.getDisputeStake(disputeId).returned);
    }

    function test_full_dispute_lifecycle_against_wins() public {
        // 1. Alice creates a community credit
        uint256 creditId = _createCommunityCredit(alice);

        // 2. Give tokens to participants
        _giveTokens(bob, 1); // challenger
        _giveTokens(charlie, 1); // voter
        _giveTokens(dave, 1); // voter

        // 3. Bob disputes
        vm.prank(bob);
        uint256 disputeId = governance.disputeCredit(creditId, "False accusation");
        uint256 proposalId = governance.getDisputeProposalId(disputeId);

        // 4. Voters vote AGAINST (dispute rejected)
        vm.prank(charlie);
        governance.vote(proposalId, false);
        vm.prank(dave);
        governance.vote(proposalId, false);

        // 5. Wait for deadline
        vm.warp(block.timestamp + VOTING_PERIOD + 1);

        // 6. Resolve against
        governance.resolveDisputeAgainst(disputeId);

        // 7. Verify outcomes
        // Credit NOT suspended (still Pending from community creation)
        assertEq(uint256(carbonCredit.getCreditType(creditId).status), uint256(CarbonCredit.CreditStatus.Pending));
        // Issuer NOT blacklisted
        assertFalse(carbonCredit.isBlacklisted(alice));
        // Challenger lost stake (balance = 0)
        assertEq(token.balanceOf(bob), 0);
        // Dispute rejected
        assertEq(uint256(governance.getDispute(disputeId).status), uint256(EcoForgeGovernance.DisputeStatus.Rejected));
        // Proposal executed
        assertTrue(governance.getProposal(proposalId).executed);
        // Stake NOT returned
        assertFalse(governance.getDisputeStake(disputeId).returned);
    }
}
