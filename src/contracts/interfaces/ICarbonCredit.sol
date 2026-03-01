// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {CarbonCredit} from "../CarbonCredit.sol";

/// @title ICarbonCredit — Interface for cross-contract interactions
/// @notice Used by Marketplace, Governance, and Oracle contracts.
interface ICarbonCredit {
    // ── Enums (re-declared for interface consumers) ──
    // Consumers should use CarbonCredit.CreditOrigin and CarbonCredit.CreditStatus directly.

    // ── Structs ──
    // Consumers should use CarbonCredit.CreditType and CarbonCredit.CreditParams directly.

    // ── Write functions (called by other contracts) ──

    function createCertifiedCredit(
        CarbonCredit.CreditParams calldata params,
        string calldata registrySource,
        string calldata retirementProof,
        address issuer,
        bool verified
    ) external returns (uint256);

    function createCommunityCredit(
        CarbonCredit.CreditParams calldata params
    ) external returns (uint256);

    function verifyCommunityCredit(uint256 id) external;

    function mintCredits(uint256 id, address to, uint256 amount) external;

    function updateImpactScore(uint256 id, uint256 score) external;

    function retireCredits(uint256 id, uint256 amount) external;

    function suspendCredit(uint256 id) external;

    function blacklist(address issuer, uint256 creditId) external;

    // ── View functions ──

    function isBlacklisted(address account) external view returns (bool);

    function isRetirementProofUsed(bytes32 proofHash) external view returns (bool);

    function getCreditType(uint256 id) external view returns (CarbonCredit.CreditType memory);

    function uri(uint256 id) external view returns (string memory);

    function balanceOf(address account, uint256 id) external view returns (uint256);

    function balanceOfBatch(
        address[] calldata accounts,
        uint256[] calldata ids
    ) external view returns (uint256[] memory);

    function retiredCredits(address owner, uint256 id) external view returns (uint256);

    function isApprovedForAll(address account, address operator) external view returns (bool);

    function setApprovalForAll(address operator, bool approved) external;

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external;
}
