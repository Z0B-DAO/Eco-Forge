// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title CarbonCredit — ERC-1155 tokenized carbon credits
/// @notice Hybrid model: Certified (bridged from Verra/Gold Standard) + Community Verified (native, AI + DAO validated)
contract CarbonCredit is ERC1155, AccessControl, Pausable {
    // ──────────────────────────────── Roles ────────────────────────────────
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ──────────────────────────────── Enums ────────────────────────────────
    enum CreditOrigin {
        Certified,
        CommunityVerified
    }

    enum CreditStatus {
        Pending,
        Verified,
        Suspended,
        Retired
    }

    // ──────────────────────────────── Structs ──────────────────────────────
    struct CreditType {
        uint256 id;
        string projectName;
        string projectType; // "reforestation", "renewable", "methane_capture"
        string region;
        uint256 vintageYear;
        uint256 tonnesCO2e;
        uint256 totalSupply;
        uint256 impactScore; // 0-100, set by AI via oracle
        string metadataURI; // IPFS link
        CreditOrigin origin;
        CreditStatus status;
        address issuer;
        string registrySource; // "Verra", "Gold Standard", "" if community
        string retirementProof; // serial number / IPFS link, "" if community
    }

    /// @dev Input struct to avoid stack-too-deep on create functions.
    struct CreditParams {
        string projectName;
        string projectType;
        string region;
        uint256 vintageYear;
        uint256 tonnesCO2e;
        uint256 initialSupply;
        string metadataURI;
    }

    // ──────────────────────────────── State ────────────────────────────────
    uint256 private _nextCreditId = 1;

    mapping(uint256 => CreditType) private _creditTypes;
    mapping(address => mapping(uint256 => uint256)) public retiredCredits;
    mapping(bytes32 => bool) private _usedRetirementProofs;
    mapping(address => bool) private _blacklisted;
    mapping(uint256 => bool) private _disputed; // flagged during challenge period

    // ──────────────────────────────── Events ───────────────────────────────
    event CertifiedCreditCreated(
        uint256 indexed id,
        string projectName,
        string registrySource,
        bytes32 proofHash
    );

    event CommunityCreditSubmitted(
        uint256 indexed id,
        string projectName,
        address indexed issuer
    );

    event CommunityCreditVerified(uint256 indexed id);

    event ImpactScoreUpdated(
        uint256 indexed id,
        uint256 oldScore,
        uint256 newScore
    );

    event CreditsRetired(
        address indexed owner,
        uint256 indexed creditId,
        uint256 amount
    );

    event IssuerBlacklisted(address indexed issuer, uint256 creditId);

    // ──────────────────────────────── Modifiers ────────────────────────────
    modifier notBlacklisted() {
        require(!_blacklisted[msg.sender], "CarbonCredit: sender is blacklisted");
        _;
    }

    // ──────────────────────────────── Constructor ──────────────────────────
    constructor() ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    // ──────────────────────────────── Create ───────────────────────────────

    /// @notice Create a Certified credit bridged from a registry (Verra, Gold Standard).
    /// @dev Caller must have MINTER_ROLE. Anti-double-bridge: reverts if proofHash already used.
    /// @param params Common project parameters.
    /// @param registrySource Registry name ("Verra", "Gold Standard").
    /// @param retirementProof Serial number or IPFS link to proof.
    /// @param issuer Address to receive the minted tokens.
    /// @param verified True if AI confidence is high → status Verified, else Pending.
    function createCertifiedCredit(
        CreditParams calldata params,
        string calldata registrySource,
        string calldata retirementProof,
        address issuer,
        bool verified
    ) external onlyRole(MINTER_ROLE) notBlacklisted whenNotPaused returns (uint256) {
        require(!_blacklisted[issuer], "CarbonCredit: issuer is blacklisted");

        // Anti-double-bridge
        bytes32 proofHash = keccak256(abi.encodePacked(registrySource, retirementProof));
        require(!_usedRetirementProofs[proofHash], "CarbonCredit: retirement proof already used");
        _usedRetirementProofs[proofHash] = true;

        uint256 creditId = _nextCreditId++;

        _creditTypes[creditId] = CreditType({
            id: creditId,
            projectName: params.projectName,
            projectType: params.projectType,
            region: params.region,
            vintageYear: params.vintageYear,
            tonnesCO2e: params.tonnesCO2e,
            totalSupply: params.initialSupply,
            impactScore: 0,
            metadataURI: params.metadataURI,
            origin: CreditOrigin.Certified,
            status: verified ? CreditStatus.Verified : CreditStatus.Pending,
            issuer: issuer,
            registrySource: registrySource,
            retirementProof: retirementProof
        });

        _mint(issuer, creditId, params.initialSupply, "");

        emit CertifiedCreditCreated(creditId, params.projectName, registrySource, proofHash);

        return creditId;
    }

    /// @notice Create a Community Verified credit (native to EcoForge).
    /// @dev Public — anyone who is not blacklisted can submit. Always minted as Pending.
    function createCommunityCredit(
        CreditParams calldata params
    ) external notBlacklisted whenNotPaused returns (uint256) {
        uint256 creditId = _nextCreditId++;

        _creditTypes[creditId] = CreditType({
            id: creditId,
            projectName: params.projectName,
            projectType: params.projectType,
            region: params.region,
            vintageYear: params.vintageYear,
            tonnesCO2e: params.tonnesCO2e,
            totalSupply: params.initialSupply,
            impactScore: 0,
            metadataURI: params.metadataURI,
            origin: CreditOrigin.CommunityVerified,
            status: CreditStatus.Pending,
            issuer: msg.sender,
            registrySource: "",
            retirementProof: ""
        });

        _mint(msg.sender, creditId, params.initialSupply, "");

        emit CommunityCreditSubmitted(creditId, params.projectName, msg.sender);

        return creditId;
    }

    // ──────────────────────────────── Verification ─────────────────────────

    /// @notice Verify a community credit after the DAO challenge period.
    function verifyCommunityCredit(uint256 id) external onlyRole(VERIFIER_ROLE) {
        CreditType storage credit = _creditTypes[id];
        require(credit.id != 0, "CarbonCredit: credit does not exist");
        require(credit.origin == CreditOrigin.CommunityVerified, "CarbonCredit: not a community credit");
        require(credit.status == CreditStatus.Pending, "CarbonCredit: not pending");

        credit.status = CreditStatus.Verified;

        emit CommunityCreditVerified(id);
    }

    // ──────────────────────────────── Minting ──────────────────────────────

    /// @notice Mint additional supply of an existing credit type.
    function mintCredits(uint256 id, address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(_creditTypes[id].id != 0, "CarbonCredit: credit does not exist");

        _creditTypes[id].totalSupply += amount;
        _mint(to, id, amount, "");
    }

    // ──────────────────────────────── Impact Score ─────────────────────────

    /// @notice Update the impact score of a credit (called by oracle or verifier).
    function updateImpactScore(uint256 id, uint256 score) external onlyRole(VERIFIER_ROLE) {
        require(_creditTypes[id].id != 0, "CarbonCredit: credit does not exist");
        require(score <= 100, "CarbonCredit: score must be 0-100");

        uint256 oldScore = _creditTypes[id].impactScore;
        _creditTypes[id].impactScore = score;

        emit ImpactScoreUpdated(id, oldScore, score);
    }

    // ──────────────────────────────── Retirement (burn) ────────────────────

    /// @notice Retire (burn) credits for permanent carbon offset.
    function retireCredits(uint256 id, uint256 amount) external {
        require(_creditTypes[id].id != 0, "CarbonCredit: credit does not exist");
        require(balanceOf(msg.sender, id) >= amount, "CarbonCredit: insufficient balance");

        _burn(msg.sender, id, amount);
        retiredCredits[msg.sender][id] += amount;

        emit CreditsRetired(msg.sender, id, amount);
    }

    // ──────────────────────────────── Punishment ───────────────────────────

    /// @notice Suspend a credit (no longer tradeable). Called by governance on fraud.
    function suspendCredit(uint256 id) external onlyRole(ADMIN_ROLE) {
        require(_creditTypes[id].id != 0, "CarbonCredit: credit does not exist");
        _creditTypes[id].status = CreditStatus.Suspended;
    }

    /// @notice Flag/unflag a credit as disputed during the challenge period.
    function setDisputed(uint256 id, bool disputed) external onlyRole(ADMIN_ROLE) {
        require(_creditTypes[id].id != 0, "CarbonCredit: credit does not exist");
        _disputed[id] = disputed;
    }

    /// @notice Blacklist an issuer permanently. Called by governance on fraud.
    function blacklist(address issuer, uint256 creditId) external onlyRole(ADMIN_ROLE) {
        require(!_blacklisted[issuer], "CarbonCredit: already blacklisted");
        _blacklisted[issuer] = true;

        emit IssuerBlacklisted(issuer, creditId);
    }

    // ──────────────────────────────── Views ────────────────────────────────

    function isBlacklisted(address account) external view returns (bool) {
        return _blacklisted[account];
    }

    function isRetirementProofUsed(bytes32 proofHash) external view returns (bool) {
        return _usedRetirementProofs[proofHash];
    }

    function isDisputed(uint256 id) external view returns (bool) {
        return _disputed[id];
    }

    function getCreditType(uint256 id) external view returns (CreditType memory) {
        require(_creditTypes[id].id != 0, "CarbonCredit: credit does not exist");
        return _creditTypes[id];
    }

    /// @notice Returns the IPFS metadata URI for a given credit id.
    function uri(uint256 id) public view override returns (string memory) {
        return _creditTypes[id].metadataURI;
    }

    // ──────────────────────────────── Pausable ─────────────────────────────

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ──────────────────────────────── Overrides ────────────────────────────

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
