// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IMarketplace — Interface for cross-contract interactions
/// @notice Used by Governance and frontend hooks.
interface IMarketplace {
    // ── Structs ──
    struct Listing {
        uint256 listingId;
        uint256 creditId;
        address seller;
        uint256 amount;
        uint256 pricePerUnit; // in AVAX (wei)
        bool active;
    }

    // ── Write functions ──

    function listCredits(uint256 creditId, uint256 amount, uint256 pricePerUnit) external;

    function buyCredits(uint256 listingId, uint256 amount) external payable;

    function cancelListing(uint256 listingId) external;

    function updatePrice(uint256 listingId, uint256 newPrice) external;

    function withdrawFees() external;

    // ── View functions ──

    function getLastSoldPrice(uint256 creditId) external view returns (uint256);

    function getListing(uint256 listingId) external view returns (Listing memory);
}
