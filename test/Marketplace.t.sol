// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {CarbonCredit} from "../src/contracts/CarbonCredit.sol";
import {Marketplace} from "../src/contracts/Marketplace.sol";

contract MarketplaceTest is Test {
    CarbonCredit public cc;
    Marketplace public marketplace;

    address public deployer = address(0xDEAD);
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public carol = address(0xCA401);
    address public feeRecipient = address(0xFEE);
    address public unauthorized = address(0xBAD);

    uint256 public creditId;
    uint256 public constant INITIAL_SUPPLY = 100;
    uint256 public constant PLATFORM_FEE_BPS = 250; // 2.5%

    // Mirror events from Marketplace for vm.expectEmit
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

    // ──────────────────────────────── Helpers ──────────────────────────────────

    /// @dev Returns a CreditParams struct with sensible defaults.
    function _defaultParams() internal pure returns (CarbonCredit.CreditParams memory) {
        return CarbonCredit.CreditParams({
            projectName: "Amazon Reforestation",
            projectType: "reforestation",
            region: "Brazil",
            vintageYear: 2024,
            tonnesCO2e: 1000,
            initialSupply: INITIAL_SUPPLY,
            metadataURI: "ipfs://QmDefault"
        });
    }

    /// @dev Creates a community credit from the given sender and returns the creditId.
    function _createDefaultCommunity(address sender) internal returns (uint256) {
        vm.prank(sender);
        return cc.createCommunityCredit(_defaultParams());
    }

    /// @dev Alice lists credits on the marketplace with sensible defaults.
    function _aliceListCredits(uint256 amount, uint256 pricePerUnit) internal returns (uint256) {
        vm.prank(alice);
        marketplace.listCredits(creditId, amount, pricePerUnit);
        // listing IDs start at 1
        return marketplace.getListing(1).listingId == 0 ? 1 : _findLatestListingId();
    }

    /// @dev Find the latest listing ID by scanning (simple helper).
    function _findLatestListingId() internal view returns (uint256) {
        // We know listings start at 1 and increment
        for (uint256 i = 100; i >= 1; i--) {
            Marketplace.Listing memory l = marketplace.getListing(i);
            if (l.seller != address(0)) return i;
        }
        return 0;
    }

    // ──────────────────────────────── Setup ────────────────────────────────────

    function setUp() public {
        // Deploy CarbonCredit as deployer
        vm.startPrank(deployer);
        cc = new CarbonCredit();
        vm.stopPrank();

        // Deploy Marketplace with 2.5% fee
        marketplace = new Marketplace(address(cc), PLATFORM_FEE_BPS, feeRecipient);

        // Create a community credit as alice (mints INITIAL_SUPPLY to alice)
        creditId = _createDefaultCommunity(alice);

        // Verify the credit so it can be listed (only Verified credits are tradeable)
        vm.prank(deployer);
        cc.verifyCommunityCredit(creditId);

        // Alice approves the marketplace for all token transfers
        vm.prank(alice);
        cc.setApprovalForAll(address(marketplace), true);

        // Fund buyers with AVAX
        vm.deal(bob, 100 ether);
        vm.deal(carol, 100 ether);
        vm.deal(alice, 10 ether);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 1. listCredits
    // ══════════════════════════════════════════════════════════════════════════

    function test_listCredits_createsListing() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 50, 1 ether);

        Marketplace.Listing memory l = marketplace.getListing(1);
        assertEq(l.listingId, 1);
        assertEq(l.creditId, creditId);
        assertEq(l.seller, alice);
        assertEq(l.amount, 50);
        assertEq(l.pricePerUnit, 1 ether);
        assertTrue(l.active);
    }

    function test_listCredits_emitsListed() public {
        vm.expectEmit(true, true, true, true);
        emit Listed(1, creditId, alice, 50, 1 ether);

        vm.prank(alice);
        marketplace.listCredits(creditId, 50, 1 ether);
    }

    function test_listCredits_incrementsListingId() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(alice);
        marketplace.listCredits(creditId, 20, 2 ether);

        Marketplace.Listing memory l1 = marketplace.getListing(1);
        Marketplace.Listing memory l2 = marketplace.getListing(2);
        assertEq(l1.listingId, 1);
        assertEq(l2.listingId, 2);
        assertEq(l1.amount, 10);
        assertEq(l2.amount, 20);
    }

    function test_listCredits_revertsIfAmountZero() public {
        vm.prank(alice);
        vm.expectRevert("Marketplace: amount must be > 0");
        marketplace.listCredits(creditId, 0, 1 ether);
    }

    function test_listCredits_revertsIfPriceZero() public {
        vm.prank(alice);
        vm.expectRevert("Marketplace: price must be > 0");
        marketplace.listCredits(creditId, 50, 0);
    }

    function test_listCredits_revertsIfInsufficientBalance() public {
        vm.prank(alice);
        vm.expectRevert("Marketplace: insufficient credit balance");
        marketplace.listCredits(creditId, INITIAL_SUPPLY + 1, 1 ether);
    }

    function test_listCredits_revertsIfNotApproved() public {
        // Bob has no credits but also no approval
        vm.prank(bob);
        vm.expectRevert("Marketplace: insufficient credit balance");
        marketplace.listCredits(creditId, 50, 1 ether);
    }

    function test_listCredits_revertsIfNotApproved_withBalance() public {
        // Transfer some credits to bob but don't approve marketplace
        vm.prank(alice);
        cc.safeTransferFrom(alice, bob, creditId, 50, "");

        vm.prank(bob);
        vm.expectRevert("Marketplace: not approved");
        marketplace.listCredits(creditId, 50, 1 ether);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 2. buyCredits
    // ══════════════════════════════════════════════════════════════════════════

    function test_buyCredits_transfersCreditsAndPays() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        uint256 aliceBalanceBefore = alice.balance;
        uint256 bobCreditsBefore = cc.balanceOf(bob, creditId);

        uint256 totalPrice = 10 * 1 ether;
        uint256 fee = (totalPrice * PLATFORM_FEE_BPS) / 10000;
        uint256 sellerProceeds = totalPrice - fee;

        vm.prank(bob);
        marketplace.buyCredits{value: totalPrice}(1, 10);

        assertEq(cc.balanceOf(bob, creditId), bobCreditsBefore + 10);
        assertEq(cc.balanceOf(alice, creditId), INITIAL_SUPPLY - 10);
        assertEq(alice.balance, aliceBalanceBefore + sellerProceeds);
    }

    function test_buyCredits_updatesLastSoldPrice() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 2 ether);

        vm.prank(bob);
        marketplace.buyCredits{value: 20 ether}(1, 10);

        assertEq(marketplace.getLastSoldPrice(creditId), 2 ether);
    }

    function test_buyCredits_emitsSold() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 5, 1 ether);

        vm.expectEmit(true, true, true, true);
        emit Sold(1, bob, creditId, 5, 5 ether);

        vm.prank(bob);
        marketplace.buyCredits{value: 5 ether}(1, 5);
    }

    function test_buyCredits_refundsExcessPayment() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 5, 1 ether);

        uint256 bobBalanceBefore = bob.balance;
        uint256 totalPrice = 5 * 1 ether;
        uint256 overpayment = 3 ether;

        vm.prank(bob);
        marketplace.buyCredits{value: totalPrice + overpayment}(1, 5);

        // Bob should have paid exactly totalPrice (the overpayment is refunded)
        assertEq(bob.balance, bobBalanceBefore - totalPrice);
    }

    function test_buyCredits_deactivatesListingWhenFullyBought() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(bob);
        marketplace.buyCredits{value: 10 ether}(1, 10);

        Marketplace.Listing memory l = marketplace.getListing(1);
        assertFalse(l.active);
        assertEq(l.amount, 0);
    }

    function test_buyCredits_revertsIfListingNotActive() public {
        // Listing ID 999 does not exist => listing.active is false (default)
        vm.prank(bob);
        vm.expectRevert("Marketplace: listing not active");
        marketplace.buyCredits{value: 1 ether}(999, 1);
    }

    function test_buyCredits_revertsIfAmountExceedsListing() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 5, 1 ether);

        vm.prank(bob);
        vm.expectRevert("Marketplace: amount exceeds listing");
        marketplace.buyCredits{value: 10 ether}(1, 10);
    }

    function test_buyCredits_revertsIfInsufficientPayment() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(bob);
        vm.expectRevert("Marketplace: insufficient payment");
        marketplace.buyCredits{value: 5 ether}(1, 10);
    }

    function test_buyCredits_revertsIfAmountZero() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(bob);
        vm.expectRevert("Marketplace: amount must be > 0");
        marketplace.buyCredits{value: 1 ether}(1, 0);
    }

    function test_buyCredits_revertsOnCancelledListing() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(alice);
        marketplace.cancelListing(1);

        vm.prank(bob);
        vm.expectRevert("Marketplace: listing not active");
        marketplace.buyCredits{value: 10 ether}(1, 10);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 3. cancelListing
    // ══════════════════════════════════════════════════════════════════════════

    function test_cancelListing_deactivatesListing() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(alice);
        marketplace.cancelListing(1);

        Marketplace.Listing memory l = marketplace.getListing(1);
        assertFalse(l.active);
    }

    function test_cancelListing_emitsListingCancelled() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.expectEmit(true, false, false, false);
        emit ListingCancelled(1);

        vm.prank(alice);
        marketplace.cancelListing(1);
    }

    function test_cancelListing_revertsIfNotSeller() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(bob);
        vm.expectRevert("Marketplace: not the seller");
        marketplace.cancelListing(1);
    }

    function test_cancelListing_revertsIfNotActive() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(alice);
        marketplace.cancelListing(1);

        // Try to cancel again
        vm.prank(alice);
        vm.expectRevert("Marketplace: listing not active");
        marketplace.cancelListing(1);
    }

    function test_cancelListing_revertsIfListingDoesNotExist() public {
        vm.prank(alice);
        vm.expectRevert("Marketplace: listing not active");
        marketplace.cancelListing(999);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 4. updatePrice
    // ══════════════════════════════════════════════════════════════════════════

    function test_updatePrice_updatesListingPrice() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(alice);
        marketplace.updatePrice(1, 2 ether);

        Marketplace.Listing memory l = marketplace.getListing(1);
        assertEq(l.pricePerUnit, 2 ether);
    }

    function test_updatePrice_revertsIfNotSeller() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(bob);
        vm.expectRevert("Marketplace: not the seller");
        marketplace.updatePrice(1, 2 ether);
    }

    function test_updatePrice_revertsIfNotActive() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(alice);
        marketplace.cancelListing(1);

        vm.prank(alice);
        vm.expectRevert("Marketplace: listing not active");
        marketplace.updatePrice(1, 2 ether);
    }

    function test_updatePrice_revertsIfPriceZero() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(alice);
        vm.expectRevert("Marketplace: price must be > 0");
        marketplace.updatePrice(1, 0);
    }

    function test_updatePrice_affectsSubsequentBuy() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(alice);
        marketplace.updatePrice(1, 3 ether);

        // Bob buys at the updated price
        uint256 totalPrice = 5 * 3 ether;
        uint256 fee = (totalPrice * PLATFORM_FEE_BPS) / 10000;
        uint256 sellerProceeds = totalPrice - fee;
        uint256 aliceBalanceBefore = alice.balance;

        vm.prank(bob);
        marketplace.buyCredits{value: totalPrice}(1, 5);

        assertEq(alice.balance, aliceBalanceBefore + sellerProceeds);
        assertEq(marketplace.getLastSoldPrice(creditId), 3 ether);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 5. getLastSoldPrice
    // ══════════════════════════════════════════════════════════════════════════

    function test_getLastSoldPrice_returnsZeroInitially() public view {
        assertEq(marketplace.getLastSoldPrice(creditId), 0);
    }

    function test_getLastSoldPrice_returnsZeroForNonexistentCredit() public view {
        assertEq(marketplace.getLastSoldPrice(999), 0);
    }

    function test_getLastSoldPrice_returnsCorrectPriceAfterSale() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 5 ether);

        vm.prank(bob);
        marketplace.buyCredits{value: 50 ether}(1, 10);

        assertEq(marketplace.getLastSoldPrice(creditId), 5 ether);
    }

    function test_getLastSoldPrice_updatesAfterMultipleSales() public {
        // First sale at 1 ether
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(bob);
        marketplace.buyCredits{value: 5 ether}(1, 5);

        assertEq(marketplace.getLastSoldPrice(creditId), 1 ether);

        // Second listing at 3 ether (alice still has remaining credits)
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 3 ether);

        vm.prank(carol);
        marketplace.buyCredits{value: 15 ether}(2, 5);

        assertEq(marketplace.getLastSoldPrice(creditId), 3 ether);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 6. withdrawFees
    // ══════════════════════════════════════════════════════════════════════════

    function test_withdrawFees_sendsFees() public {
        // Create a sale to accumulate fees
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(bob);
        marketplace.buyCredits{value: 10 ether}(1, 10);

        uint256 expectedFee = (10 ether * PLATFORM_FEE_BPS) / 10000; // 0.25 ether
        assertEq(marketplace.accumulatedFees(), expectedFee);

        uint256 recipientBalanceBefore = feeRecipient.balance;

        vm.prank(feeRecipient);
        marketplace.withdrawFees();

        assertEq(feeRecipient.balance, recipientBalanceBefore + expectedFee);
        assertEq(marketplace.accumulatedFees(), 0);
    }

    function test_withdrawFees_revertsIfNotFeeRecipient() public {
        // Create a sale to accumulate fees
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(bob);
        marketplace.buyCredits{value: 10 ether}(1, 10);

        vm.prank(bob);
        vm.expectRevert("Marketplace: not fee recipient");
        marketplace.withdrawFees();
    }

    function test_withdrawFees_revertsIfNoFees() public {
        vm.prank(feeRecipient);
        vm.expectRevert("Marketplace: no fees to withdraw");
        marketplace.withdrawFees();
    }

    function test_withdrawFees_canWithdrawMultipleTimes() public {
        // First sale
        vm.prank(alice);
        marketplace.listCredits(creditId, 20, 1 ether);

        vm.prank(bob);
        marketplace.buyCredits{value: 10 ether}(1, 10);

        uint256 fee1 = (10 ether * PLATFORM_FEE_BPS) / 10000;

        vm.prank(feeRecipient);
        marketplace.withdrawFees();

        assertEq(feeRecipient.balance, fee1);

        // Second sale (listing still has 10 remaining)
        vm.prank(carol);
        marketplace.buyCredits{value: 10 ether}(1, 10);

        uint256 fee2 = (10 ether * PLATFORM_FEE_BPS) / 10000;

        vm.prank(feeRecipient);
        marketplace.withdrawFees();

        assertEq(feeRecipient.balance, fee1 + fee2);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 7. Partial buy
    // ══════════════════════════════════════════════════════════════════════════

    function test_partialBuy_listingStaysActiveWithReducedAmount() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 20, 1 ether);

        // Bob buys 8 out of 20
        vm.prank(bob);
        marketplace.buyCredits{value: 8 ether}(1, 8);

        Marketplace.Listing memory l = marketplace.getListing(1);
        assertTrue(l.active);
        assertEq(l.amount, 12); // 20 - 8 = 12 remaining

        assertEq(cc.balanceOf(bob, creditId), 8);
    }

    function test_partialBuy_secondBuyFinishesListing() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 20, 1 ether);

        // Bob buys 8
        vm.prank(bob);
        marketplace.buyCredits{value: 8 ether}(1, 8);

        Marketplace.Listing memory l1 = marketplace.getListing(1);
        assertTrue(l1.active);
        assertEq(l1.amount, 12);

        // Carol buys the remaining 12
        vm.prank(carol);
        marketplace.buyCredits{value: 12 ether}(1, 12);

        Marketplace.Listing memory l2 = marketplace.getListing(1);
        assertFalse(l2.active);
        assertEq(l2.amount, 0);

        assertEq(cc.balanceOf(bob, creditId), 8);
        assertEq(cc.balanceOf(carol, creditId), 12);
    }

    function test_partialBuy_multipleBuyersAccumulateFees() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 30, 2 ether);

        // Bob buys 10 => 20 ether
        vm.prank(bob);
        marketplace.buyCredits{value: 20 ether}(1, 10);

        // Carol buys 15 => 30 ether
        vm.prank(carol);
        marketplace.buyCredits{value: 30 ether}(1, 15);

        uint256 totalSalesVolume = 20 ether + 30 ether;
        uint256 expectedFees = (totalSalesVolume * PLATFORM_FEE_BPS) / 10000;

        assertEq(marketplace.accumulatedFees(), expectedFees);
    }

    function test_partialBuy_cannotExceedRemainingAmount() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        // Bob buys 7
        vm.prank(bob);
        marketplace.buyCredits{value: 7 ether}(1, 7);

        // Carol tries to buy 5 but only 3 remain
        vm.prank(carol);
        vm.expectRevert("Marketplace: amount exceeds listing");
        marketplace.buyCredits{value: 5 ether}(1, 5);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 8. Fee calculation
    // ══════════════════════════════════════════════════════════════════════════

    function test_feeCalculation_exactAmountsAt2Point5Percent() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        uint256 aliceBalanceBefore = alice.balance;

        // Total price = 10 * 1 ether = 10 ether
        // Fee = 10 ether * 250 / 10000 = 0.25 ether
        // Seller proceeds = 10 ether - 0.25 ether = 9.75 ether
        vm.prank(bob);
        marketplace.buyCredits{value: 10 ether}(1, 10);

        uint256 expectedFee = 0.25 ether;
        uint256 expectedSellerProceeds = 9.75 ether;

        assertEq(marketplace.accumulatedFees(), expectedFee);
        assertEq(alice.balance, aliceBalanceBefore + expectedSellerProceeds);
    }

    function test_feeCalculation_singleUnit() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 1, 4 ether);

        uint256 aliceBalanceBefore = alice.balance;

        // Total price = 1 * 4 ether = 4 ether
        // Fee = 4 ether * 250 / 10000 = 0.1 ether
        // Seller proceeds = 4 ether - 0.1 ether = 3.9 ether
        vm.prank(bob);
        marketplace.buyCredits{value: 4 ether}(1, 1);

        assertEq(marketplace.accumulatedFees(), 0.1 ether);
        assertEq(alice.balance, aliceBalanceBefore + 3.9 ether);
    }

    function test_feeCalculation_smallAmount() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 1, 100); // 100 wei

        // Fee = 100 * 250 / 10000 = 2 (integer division, 2.5 rounds down to 2)
        vm.prank(bob);
        marketplace.buyCredits{value: 100}(1, 1);

        assertEq(marketplace.accumulatedFees(), 2);
    }

    function test_feeCalculation_feeRoundsDown() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 1, 1); // 1 wei

        // Fee = 1 * 250 / 10000 = 0 (rounds down to 0)
        uint256 aliceBalanceBefore = alice.balance;

        vm.prank(bob);
        marketplace.buyCredits{value: 1}(1, 1);

        assertEq(marketplace.accumulatedFees(), 0);
        assertEq(alice.balance, aliceBalanceBefore + 1); // seller gets full amount
    }

    function test_feeCalculation_accumulatesAcrossMultipleSales() public {
        // Listing 1: 10 credits at 2 ether each
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 2 ether);

        vm.prank(bob);
        marketplace.buyCredits{value: 10 ether}(1, 5); // 5 * 2 = 10 ether

        // Fee1 = 10 ether * 250 / 10000 = 0.25 ether
        assertEq(marketplace.accumulatedFees(), 0.25 ether);

        vm.prank(carol);
        marketplace.buyCredits{value: 10 ether}(1, 5); // 5 * 2 = 10 ether

        // Fee2 = 10 ether * 250 / 10000 = 0.25 ether
        // Total = 0.5 ether
        assertEq(marketplace.accumulatedFees(), 0.5 ether);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 9. getListing
    // ══════════════════════════════════════════════════════════════════════════

    function test_getListing_returnsCorrectData() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 50, 3 ether);

        Marketplace.Listing memory l = marketplace.getListing(1);
        assertEq(l.listingId, 1);
        assertEq(l.creditId, creditId);
        assertEq(l.seller, alice);
        assertEq(l.amount, 50);
        assertEq(l.pricePerUnit, 3 ether);
        assertTrue(l.active);
    }

    function test_getListing_returnsDefaultForNonexistent() public view {
        Marketplace.Listing memory l = marketplace.getListing(999);
        assertEq(l.listingId, 0);
        assertEq(l.creditId, 0);
        assertEq(l.seller, address(0));
        assertEq(l.amount, 0);
        assertEq(l.pricePerUnit, 0);
        assertFalse(l.active);
    }

    function test_getListing_reflectsPartialBuy() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 20, 1 ether);

        vm.prank(bob);
        marketplace.buyCredits{value: 7 ether}(1, 7);

        Marketplace.Listing memory l = marketplace.getListing(1);
        assertEq(l.amount, 13); // 20 - 7
        assertTrue(l.active);
    }

    function test_getListing_reflectsCancellation() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(alice);
        marketplace.cancelListing(1);

        Marketplace.Listing memory l = marketplace.getListing(1);
        assertFalse(l.active);
        // Other data should still be there
        assertEq(l.seller, alice);
        assertEq(l.amount, 10);
    }

    function test_getListing_reflectsPriceUpdate() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        vm.prank(alice);
        marketplace.updatePrice(1, 7 ether);

        Marketplace.Listing memory l = marketplace.getListing(1);
        assertEq(l.pricePerUnit, 7 ether);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Constructor edge cases
    // ══════════════════════════════════════════════════════════════════════════

    function test_constructor_revertsZeroCarbonCreditAddress() public {
        vm.expectRevert("Marketplace: zero address");
        new Marketplace(address(0), PLATFORM_FEE_BPS, feeRecipient);
    }

    function test_constructor_revertsZeroFeeRecipient() public {
        vm.expectRevert("Marketplace: zero fee recipient");
        new Marketplace(address(cc), PLATFORM_FEE_BPS, address(0));
    }

    function test_constructor_revertsFeeTooHigh() public {
        vm.expectRevert("Marketplace: fee too high");
        new Marketplace(address(cc), 1001, feeRecipient); // > 10%
    }

    function test_constructor_acceptsMaxFee() public {
        // 10% (1000 bps) should be accepted
        Marketplace m = new Marketplace(address(cc), 1000, feeRecipient);
        assertEq(m.platformFee(), 1000);
    }

    function test_constructor_setsStateCorrectly() public view {
        assertEq(address(marketplace.carbonCredit()), address(cc));
        assertEq(marketplace.platformFee(), PLATFORM_FEE_BPS);
        assertEq(marketplace.feeRecipient(), feeRecipient);
        assertEq(marketplace.accumulatedFees(), 0);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Edge cases and integration scenarios
    // ══════════════════════════════════════════════════════════════════════════

    function test_sellerCanBuyOwnListing() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        uint256 aliceCreditsBefore = cc.balanceOf(alice, creditId);

        vm.prank(alice);
        marketplace.buyCredits{value: 5 ether}(1, 5);

        // Credits transferred from alice to alice (net zero)
        assertEq(cc.balanceOf(alice, creditId), aliceCreditsBefore);
    }

    function test_multipleListingsFromSameSeller() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 30, 1 ether);

        vm.prank(alice);
        marketplace.listCredits(creditId, 40, 2 ether);

        Marketplace.Listing memory l1 = marketplace.getListing(1);
        Marketplace.Listing memory l2 = marketplace.getListing(2);

        assertEq(l1.amount, 30);
        assertEq(l1.pricePerUnit, 1 ether);
        assertEq(l2.amount, 40);
        assertEq(l2.pricePerUnit, 2 ether);
    }

    function test_buyFromUpdatedPriceListing() public {
        vm.prank(alice);
        marketplace.listCredits(creditId, 10, 1 ether);

        // Update price to 5 ether
        vm.prank(alice);
        marketplace.updatePrice(1, 5 ether);

        // Bob tries to buy at old price — should fail
        vm.prank(bob);
        vm.expectRevert("Marketplace: insufficient payment");
        marketplace.buyCredits{value: 10 ether}(1, 10);

        // Bob buys at new price
        vm.prank(bob);
        marketplace.buyCredits{value: 50 ether}(1, 10);

        assertEq(cc.balanceOf(bob, creditId), 10);
    }
}
