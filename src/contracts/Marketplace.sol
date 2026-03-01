// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {CarbonCredit} from "./CarbonCredit.sol";

/// @title Marketplace — Trading engine for carbon credits
/// @notice List, buy, sell ERC-1155 carbon credits. Tracks lastSoldPrice per credit.
contract Marketplace is ReentrancyGuard {
    // ──────────────────────────────── Structs ──────────────────────────────
    struct Listing {
        uint256 listingId;
        uint256 creditId;
        address seller;
        uint256 amount;
        uint256 pricePerUnit; // in AVAX (wei)
        bool active;
    }

    // ──────────────────────────────── State ────────────────────────────────
    CarbonCredit public immutable carbonCredit;

    mapping(uint256 => Listing) private _listings;
    mapping(uint256 => uint256) private _lastSoldPrice; // creditId => price per unit
    uint256 public platformFee; // basis points (e.g., 250 = 2.5%)
    address public feeRecipient; // DAO treasury
    uint256 public accumulatedFees;

    uint256 private _nextListingId = 1;

    // ──────────────────────────────── Events ───────────────────────────────
    event Listed(
        uint256 indexed listingId,
        uint256 indexed creditId,
        address indexed seller,
        uint256 amount,
        uint256 price
    );

    event Sold(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 indexed creditId,
        uint256 amount,
        uint256 totalPrice
    );

    event ListingCancelled(uint256 indexed listingId);

    event PriceUpdated(uint256 indexed listingId, uint256 newPrice);

    // ──────────────────────────────── Constructor ──────────────────────────
    constructor(
        address _carbonCredit,
        uint256 _platformFee,
        address _feeRecipient
    ) {
        require(_carbonCredit != address(0), "Marketplace: zero address");
        require(_feeRecipient != address(0), "Marketplace: zero fee recipient");
        require(_platformFee <= 1000, "Marketplace: fee too high"); // max 10%

        carbonCredit = CarbonCredit(_carbonCredit);
        platformFee = _platformFee;
        feeRecipient = _feeRecipient;
    }

    // ──────────────────────────────── List ──────────────────────────────────

    /// @notice List carbon credits for sale.
    function listCredits(
        uint256 creditId,
        uint256 amount,
        uint256 pricePerUnit
    ) external {
        require(amount > 0, "Marketplace: amount must be > 0");
        require(pricePerUnit > 0, "Marketplace: price must be > 0");

        // Only Verified credits can be listed
        CarbonCredit.CreditType memory credit = carbonCredit.getCreditType(creditId);
        require(
            credit.status == CarbonCredit.CreditStatus.Verified,
            "Marketplace: credit not verified"
        );

        require(
            carbonCredit.balanceOf(msg.sender, creditId) >= amount,
            "Marketplace: insufficient credit balance"
        );
        require(
            carbonCredit.isApprovedForAll(msg.sender, address(this)),
            "Marketplace: not approved"
        );

        uint256 listingId = _nextListingId++;

        _listings[listingId] = Listing({
            listingId: listingId,
            creditId: creditId,
            seller: msg.sender,
            amount: amount,
            pricePerUnit: pricePerUnit,
            active: true
        });

        emit Listed(listingId, creditId, msg.sender, amount, pricePerUnit);
    }

    // ──────────────────────────────── Buy ───────────────────────────────────

    /// @notice Buy credits from a listing. Updates lastSoldPrice.
    function buyCredits(
        uint256 listingId,
        uint256 amount
    ) external payable nonReentrant {
        Listing storage listing = _listings[listingId];
        require(listing.active, "Marketplace: listing not active");
        require(amount > 0, "Marketplace: amount must be > 0");
        require(amount <= listing.amount, "Marketplace: amount exceeds listing");

        uint256 totalPrice = amount * listing.pricePerUnit;
        require(msg.value >= totalPrice, "Marketplace: insufficient payment");

        // Update listing
        listing.amount -= amount;
        if (listing.amount == 0) {
            listing.active = false;
        }

        // Calculate fee
        uint256 fee = (totalPrice * platformFee) / 10000;
        uint256 sellerProceeds = totalPrice - fee;
        accumulatedFees += fee;

        // Update last sold price
        _lastSoldPrice[listing.creditId] = listing.pricePerUnit;

        // Transfer credits from seller to buyer
        carbonCredit.safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.creditId,
            amount,
            ""
        );

        // Pay seller
        (bool success, ) = payable(listing.seller).call{value: sellerProceeds}("");
        require(success, "Marketplace: payment to seller failed");

        // Refund excess payment
        if (msg.value > totalPrice) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - totalPrice}("");
            require(refundSuccess, "Marketplace: refund failed");
        }

        emit Sold(listingId, msg.sender, listing.creditId, amount, totalPrice);
    }

    // ──────────────────────────────── Cancel ────────────────────────────────

    /// @notice Cancel an active listing. Only the seller can cancel.
    function cancelListing(uint256 listingId) external {
        Listing storage listing = _listings[listingId];
        require(listing.active, "Marketplace: listing not active");
        require(listing.seller == msg.sender, "Marketplace: not the seller");

        listing.active = false;

        emit ListingCancelled(listingId);
    }

    // ──────────────────────────────── Update Price ──────────────────────────

    /// @notice Update the price of an active listing. Only the seller can update.
    function updatePrice(uint256 listingId, uint256 newPrice) external {
        Listing storage listing = _listings[listingId];
        require(listing.active, "Marketplace: listing not active");
        require(listing.seller == msg.sender, "Marketplace: not the seller");
        require(newPrice > 0, "Marketplace: price must be > 0");

        listing.pricePerUnit = newPrice;

        emit PriceUpdated(listingId, newPrice);
    }

    // ──────────────────────────────── Withdraw Fees ─────────────────────────

    /// @notice Withdraw accumulated platform fees. Only feeRecipient (DAO treasury).
    function withdrawFees() external nonReentrant {
        require(msg.sender == feeRecipient, "Marketplace: not fee recipient");
        require(accumulatedFees > 0, "Marketplace: no fees to withdraw");

        uint256 amount = accumulatedFees;
        accumulatedFees = 0;

        (bool success, ) = payable(feeRecipient).call{value: amount}("");
        require(success, "Marketplace: fee withdrawal failed");
    }

    // ──────────────────────────────── Views ─────────────────────────────────

    /// @notice Get the last sold price for a credit (used for portfolio valuation).
    function getLastSoldPrice(uint256 creditId) external view returns (uint256) {
        return _lastSoldPrice[creditId];
    }

    /// @notice Get a listing by ID.
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return _listings[listingId];
    }
}
