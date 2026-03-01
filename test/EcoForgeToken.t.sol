// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {EcoForgeToken} from "../src/contracts/EcoForgeToken.sol";

contract EcoForgeTokenTest is Test {
    EcoForgeToken public token;

    address public deployer = address(0xDEAD);
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public unauthorized = address(0xBAD);

    uint256 public constant DAILY_CAP = 10;
    uint256 public constant ONE_TOKEN = 1e18;

    // Mirror the events from the contract so we can use vm.expectEmit
    event ActionRecorded(address indexed user, uint256 totalActions);
    event MilestoneReached(address indexed user, uint256 indexed milestoneIndex, uint256 tokensRewarded);
    event TokensBurned(address indexed user, uint256 amount, string reason);
    event AllTokensBurned(address indexed user, string reason);

    function setUp() public {
        vm.prank(deployer);
        token = new EcoForgeToken(DAILY_CAP);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  1. DEPLOYMENT
    // ═══════════════════════════════════════════════════════════════════════

    function test_deployment_name() public view {
        assertEq(token.name(), "EcoForge");
    }

    function test_deployment_symbol() public view {
        assertEq(token.symbol(), "EFRG");
    }

    function test_deployment_decimals() public view {
        assertEq(token.decimals(), 18);
    }

    function test_deployment_dailyActionCap() public view {
        assertEq(token.dailyActionCap(), DAILY_CAP);
    }

    function test_deployment_milestones() public view {
        EcoForgeToken.Milestone[] memory milestones = token.getMilestones();
        assertEq(milestones.length, 7);
    }

    function test_deployment_deployer_has_admin_role() public view {
        assertTrue(token.hasRole(token.DEFAULT_ADMIN_ROLE(), deployer));
    }

    function test_deployment_deployer_has_minter_role() public view {
        assertTrue(token.hasRole(token.MINTER_ROLE(), deployer));
    }

    function test_deployment_totalSupply_zero() public view {
        assertEq(token.totalSupply(), 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  2. recordAction
    // ═══════════════════════════════════════════════════════════════════════

    function test_recordAction_increments_userActions() public {
        vm.prank(deployer);
        token.recordAction(alice);

        (uint256 actions, , , ) = token.getUserProgress(alice);
        assertEq(actions, 1);
    }

    function test_recordAction_increments_multiple_times() public {
        vm.startPrank(deployer);
        token.recordAction(alice);
        token.recordAction(alice);
        token.recordAction(alice);
        vm.stopPrank();

        (uint256 actions, , , ) = token.getUserProgress(alice);
        assertEq(actions, 3);
    }

    function test_recordAction_reverts_when_dailyCap_exceeded() public {
        vm.startPrank(deployer);
        // Fill the daily cap
        for (uint256 i = 0; i < DAILY_CAP; i++) {
            token.recordAction(alice);
        }
        // Next action should revert
        vm.expectRevert("EcoForgeToken: daily action cap reached");
        token.recordAction(alice);
        vm.stopPrank();
    }

    function test_recordAction_dailyCap_resets_next_day() public {
        vm.startPrank(deployer);
        // Fill the daily cap
        for (uint256 i = 0; i < DAILY_CAP; i++) {
            token.recordAction(alice);
        }
        vm.stopPrank();

        // Warp forward 1 day
        vm.warp(block.timestamp + 1 days);

        // Should succeed again
        vm.prank(deployer);
        token.recordAction(alice);

        (uint256 actions, , , ) = token.getUserProgress(alice);
        assertEq(actions, DAILY_CAP + 1);
    }

    function test_recordAction_reverts_without_MINTER_ROLE() public {
        vm.prank(unauthorized);
        vm.expectRevert();
        token.recordAction(alice);
    }

    function test_recordAction_emits_ActionRecorded() public {
        vm.prank(deployer);
        vm.expectEmit(true, false, false, true, address(token));
        emit ActionRecorded(alice, 1);
        token.recordAction(alice);
    }

    function test_recordAction_emits_ActionRecorded_sequential() public {
        vm.startPrank(deployer);
        token.recordAction(alice);

        vm.expectEmit(true, false, false, true, address(token));
        emit ActionRecorded(alice, 2);
        token.recordAction(alice);
        vm.stopPrank();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  3. MILESTONE AUTO-MINT
    // ═══════════════════════════════════════════════════════════════════════

    /// @dev Helper: record N actions for a user, warping days as needed to respect the daily cap.
    function _recordActions(address user, uint256 count) internal {
        uint256 done = 0;
        uint256 dayOffset = 0;
        while (done < count) {
            // Warp to a new day if needed
            if (done > 0 && done % DAILY_CAP == 0) {
                dayOffset++;
                vm.warp(block.timestamp + 1 days);
            }
            vm.prank(deployer);
            token.recordAction(user);
            done++;
        }
    }

    function test_milestone_tier1_at_5_actions() public {
        _recordActions(alice, 5);
        assertEq(token.balanceOf(alice), 1 * ONE_TOKEN);
    }

    function test_milestone_tier2_at_15_actions() public {
        _recordActions(alice, 15);
        // Tier 1 (1) + Tier 2 (2) = 3 tokens
        assertEq(token.balanceOf(alice), 3 * ONE_TOKEN);
    }

    function test_milestone_tier3_at_30_actions() public {
        _recordActions(alice, 30);
        // 1 + 2 + 3 = 6 tokens
        assertEq(token.balanceOf(alice), 6 * ONE_TOKEN);
    }

    function test_milestone_tier4_at_50_actions() public {
        _recordActions(alice, 50);
        // 1 + 2 + 3 + 5 = 11 tokens
        assertEq(token.balanceOf(alice), 11 * ONE_TOKEN);
    }

    function test_milestone_tier5_at_100_actions() public {
        _recordActions(alice, 100);
        // 1 + 2 + 3 + 5 + 8 = 19 tokens
        assertEq(token.balanceOf(alice), 19 * ONE_TOKEN);
    }

    function test_milestone_tier6_at_200_actions() public {
        _recordActions(alice, 200);
        // 1 + 2 + 3 + 5 + 8 + 13 = 32 tokens
        assertEq(token.balanceOf(alice), 32 * ONE_TOKEN);
    }

    function test_milestone_tier7_at_500_actions() public {
        _recordActions(alice, 500);
        // 1 + 2 + 3 + 5 + 8 + 13 + 21 = 53 tokens
        assertEq(token.balanceOf(alice), 53 * ONE_TOKEN);
    }

    function test_milestone_no_extra_mint_beyond_500() public {
        _recordActions(alice, 500);
        uint256 balanceAt500 = token.balanceOf(alice);

        // Warp to a fresh day then record more
        vm.warp(block.timestamp + 1 days);
        vm.prank(deployer);
        token.recordAction(alice);

        // Balance should remain the same (no more milestones)
        assertEq(token.balanceOf(alice), balanceAt500);
    }

    function test_milestone_emits_MilestoneReached_tier1() public {
        // Record 4 actions first (no event expected for these)
        _recordActions(alice, 4);

        // 5th action triggers milestone 0
        vm.prank(deployer);
        vm.expectEmit(true, true, false, true, address(token));
        emit MilestoneReached(alice, 0, 1);
        token.recordAction(alice);
    }

    function test_milestone_emits_MilestoneReached_tier2() public {
        // Get to 14 actions
        _recordActions(alice, 14);

        // Warp to a new day to ensure we have daily cap room
        vm.warp(block.timestamp + 1 days);

        // 15th action triggers milestone 1
        vm.prank(deployer);
        vm.expectEmit(true, true, false, true, address(token));
        emit MilestoneReached(alice, 1, 2);
        token.recordAction(alice);
    }

    function test_milestone_no_mint_between_milestones() public {
        // Record 4 actions (just under milestone 1)
        _recordActions(alice, 4);
        assertEq(token.balanceOf(alice), 0);

        // Record 1 more to reach 5 (milestone 1 reached)
        vm.warp(block.timestamp + 1 days);
        vm.prank(deployer);
        token.recordAction(alice);
        assertEq(token.balanceOf(alice), 1 * ONE_TOKEN);

        // Record 1 more (6 total, between milestones 1 and 2) -- no additional mint
        vm.prank(deployer);
        token.recordAction(alice);
        assertEq(token.balanceOf(alice), 1 * ONE_TOKEN);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  4. SOULBOUND (NON-TRANSFERABLE)
    // ═══════════════════════════════════════════════════════════════════════

    function test_soulbound_transfer_reverts() public {
        // Give alice some tokens via milestone
        _recordActions(alice, 5);
        assertEq(token.balanceOf(alice), 1 * ONE_TOKEN);

        // Attempt direct transfer
        vm.prank(alice);
        vm.expectRevert("EcoForgeToken: non-transferable");
        token.transfer(bob, 1 * ONE_TOKEN);
    }

    function test_soulbound_transferFrom_reverts() public {
        // Give alice some tokens via milestone
        _recordActions(alice, 5);

        // Alice approves bob
        vm.prank(alice);
        token.approve(bob, 1 * ONE_TOKEN);

        // Bob tries transferFrom
        vm.prank(bob);
        vm.expectRevert("EcoForgeToken: non-transferable");
        token.transferFrom(alice, bob, 1 * ONE_TOKEN);
    }

    function test_soulbound_minting_works() public {
        // Minting = transfer from address(0) to user, should work
        _recordActions(alice, 5);
        assertEq(token.balanceOf(alice), 1 * ONE_TOKEN);
    }

    function test_soulbound_burning_works() public {
        // Give alice tokens
        _recordActions(alice, 5);
        assertEq(token.balanceOf(alice), 1 * ONE_TOKEN);

        // Burn = transfer from user to address(0), should work
        vm.prank(deployer);
        token.burn(alice, 1 * ONE_TOKEN);
        assertEq(token.balanceOf(alice), 0);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  5. BURN
    // ═══════════════════════════════════════════════════════════════════════

    function test_burn_correct_amount() public {
        _recordActions(alice, 15); // 3 tokens
        assertEq(token.balanceOf(alice), 3 * ONE_TOKEN);

        vm.prank(deployer);
        token.burn(alice, 1 * ONE_TOKEN);
        assertEq(token.balanceOf(alice), 2 * ONE_TOKEN);
    }

    function test_burn_reverts_without_MINTER_ROLE() public {
        _recordActions(alice, 5);

        vm.prank(unauthorized);
        vm.expectRevert();
        token.burn(alice, 1 * ONE_TOKEN);
    }

    function test_burn_emits_TokensBurned() public {
        _recordActions(alice, 5);

        vm.prank(deployer);
        vm.expectEmit(true, false, false, true, address(token));
        emit TokensBurned(alice, 1 * ONE_TOKEN, "punishment");
        token.burn(alice, 1 * ONE_TOKEN);
    }

    function test_burn_reverts_if_amount_exceeds_balance() public {
        _recordActions(alice, 5); // 1 token

        vm.prank(deployer);
        vm.expectRevert(); // ERC20 underflow
        token.burn(alice, 2 * ONE_TOKEN);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  6. BURN ALL
    // ═══════════════════════════════════════════════════════════════════════

    function test_burnAll_burns_entire_balance() public {
        _recordActions(alice, 15); // 3 tokens
        assertEq(token.balanceOf(alice), 3 * ONE_TOKEN);

        vm.prank(deployer);
        token.burnAll(alice);
        assertEq(token.balanceOf(alice), 0);
    }

    function test_burnAll_reverts_if_balance_zero() public {
        assertEq(token.balanceOf(alice), 0);

        vm.prank(deployer);
        vm.expectRevert("EcoForgeToken: no tokens to burn");
        token.burnAll(alice);
    }

    function test_burnAll_reverts_without_MINTER_ROLE() public {
        _recordActions(alice, 5);

        vm.prank(unauthorized);
        vm.expectRevert();
        token.burnAll(alice);
    }

    function test_burnAll_emits_AllTokensBurned() public {
        _recordActions(alice, 5);

        vm.prank(deployer);
        vm.expectEmit(true, false, false, true, address(token));
        emit AllTokensBurned(alice, "fraud");
        token.burnAll(alice);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  7. getMilestones
    // ═══════════════════════════════════════════════════════════════════════

    function test_getMilestones_returns_7_tiers() public view {
        EcoForgeToken.Milestone[] memory milestones = token.getMilestones();
        assertEq(milestones.length, 7);
    }

    function test_getMilestones_tier_values() public view {
        EcoForgeToken.Milestone[] memory m = token.getMilestones();

        // Tier 1:   5 actions  -> 1 token
        assertEq(m[0].actionsRequired, 5);
        assertEq(m[0].tokensRewarded, 1);

        // Tier 2:  15 actions  -> 2 tokens
        assertEq(m[1].actionsRequired, 15);
        assertEq(m[1].tokensRewarded, 2);

        // Tier 3:  30 actions  -> 3 tokens
        assertEq(m[2].actionsRequired, 30);
        assertEq(m[2].tokensRewarded, 3);

        // Tier 4:  50 actions  -> 5 tokens
        assertEq(m[3].actionsRequired, 50);
        assertEq(m[3].tokensRewarded, 5);

        // Tier 5: 100 actions  -> 8 tokens
        assertEq(m[4].actionsRequired, 100);
        assertEq(m[4].tokensRewarded, 8);

        // Tier 6: 200 actions  -> 13 tokens
        assertEq(m[5].actionsRequired, 200);
        assertEq(m[5].tokensRewarded, 13);

        // Tier 7: 500 actions  -> 21 tokens
        assertEq(m[6].actionsRequired, 500);
        assertEq(m[6].tokensRewarded, 21);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  8. getUserProgress
    // ═══════════════════════════════════════════════════════════════════════

    function test_getUserProgress_initial_state() public view {
        (uint256 actions, uint256 currentMilestone, uint256 nextMilestone, uint256 tokensEarned) =
            token.getUserProgress(alice);

        assertEq(actions, 0);
        assertEq(currentMilestone, 0); // No milestone reached
        assertEq(nextMilestone, 5); // Next milestone requires 5 actions
        assertEq(tokensEarned, 0);
    }

    function test_getUserProgress_after_3_actions() public {
        _recordActions(alice, 3);

        (uint256 actions, uint256 currentMilestone, uint256 nextMilestone, uint256 tokensEarned) =
            token.getUserProgress(alice);

        assertEq(actions, 3);
        assertEq(currentMilestone, 0); // No milestone reached yet
        assertEq(nextMilestone, 5); // Still targeting first milestone
        assertEq(tokensEarned, 0);
    }

    function test_getUserProgress_at_5_actions() public {
        _recordActions(alice, 5);

        (uint256 actions, uint256 currentMilestone, uint256 nextMilestone, uint256 tokensEarned) =
            token.getUserProgress(alice);

        assertEq(actions, 5);
        assertEq(currentMilestone, 1); // First milestone reached (index 0 done)
        assertEq(nextMilestone, 15); // Next: 15 actions
        assertEq(tokensEarned, 1); // 1 token earned from tier 1
    }

    function test_getUserProgress_at_15_actions() public {
        _recordActions(alice, 15);

        (uint256 actions, uint256 currentMilestone, uint256 nextMilestone, uint256 tokensEarned) =
            token.getUserProgress(alice);

        assertEq(actions, 15);
        assertEq(currentMilestone, 2);
        assertEq(nextMilestone, 30);
        assertEq(tokensEarned, 3); // 1 + 2
    }

    function test_getUserProgress_at_30_actions() public {
        _recordActions(alice, 30);

        (uint256 actions, uint256 currentMilestone, uint256 nextMilestone, uint256 tokensEarned) =
            token.getUserProgress(alice);

        assertEq(actions, 30);
        assertEq(currentMilestone, 3);
        assertEq(nextMilestone, 50);
        assertEq(tokensEarned, 6); // 1 + 2 + 3
    }

    function test_getUserProgress_at_50_actions() public {
        _recordActions(alice, 50);

        (uint256 actions, uint256 currentMilestone, uint256 nextMilestone, uint256 tokensEarned) =
            token.getUserProgress(alice);

        assertEq(actions, 50);
        assertEq(currentMilestone, 4);
        assertEq(nextMilestone, 100);
        assertEq(tokensEarned, 11); // 1 + 2 + 3 + 5
    }

    function test_getUserProgress_at_100_actions() public {
        _recordActions(alice, 100);

        (uint256 actions, uint256 currentMilestone, uint256 nextMilestone, uint256 tokensEarned) =
            token.getUserProgress(alice);

        assertEq(actions, 100);
        assertEq(currentMilestone, 5);
        assertEq(nextMilestone, 200);
        assertEq(tokensEarned, 19); // 1 + 2 + 3 + 5 + 8
    }

    function test_getUserProgress_at_500_actions_all_milestones() public {
        _recordActions(alice, 500);

        (uint256 actions, uint256 currentMilestone, uint256 nextMilestone, uint256 tokensEarned) =
            token.getUserProgress(alice);

        assertEq(actions, 500);
        assertEq(currentMilestone, 7); // All 7 milestones reached
        assertEq(nextMilestone, 0); // No more milestones
        assertEq(tokensEarned, 53); // 1 + 2 + 3 + 5 + 8 + 13 + 21
    }

    function test_getUserProgress_between_milestones() public {
        _recordActions(alice, 8); // Between tier 1 (5) and tier 2 (15)

        (uint256 actions, uint256 currentMilestone, uint256 nextMilestone, uint256 tokensEarned) =
            token.getUserProgress(alice);

        assertEq(actions, 8);
        assertEq(currentMilestone, 1); // Only first milestone reached
        assertEq(nextMilestone, 15); // Next milestone still at 15
        assertEq(tokensEarned, 1); // Only 1 token from tier 1
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  EDGE CASES / INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════

    function test_multiple_users_independent_progress() public {
        _recordActions(alice, 5); // Alice reaches tier 1
        _recordActions(bob, 3); // Bob has 3 actions, no milestone

        assertEq(token.balanceOf(alice), 1 * ONE_TOKEN);
        assertEq(token.balanceOf(bob), 0);

        (uint256 aliceActions, , , ) = token.getUserProgress(alice);
        (uint256 bobActions, , , ) = token.getUserProgress(bob);
        assertEq(aliceActions, 5);
        assertEq(bobActions, 3);
    }

    function test_burnAll_then_continue_earning() public {
        _recordActions(alice, 15); // 3 tokens
        assertEq(token.balanceOf(alice), 3 * ONE_TOKEN);

        // Burn all tokens (fraud punishment)
        vm.prank(deployer);
        token.burnAll(alice);
        assertEq(token.balanceOf(alice), 0);

        // Actions continue from 15, next milestone is at 30
        // Record 15 more to reach 30 total
        vm.warp(block.timestamp + 1 days);
        _recordActions(alice, 15);

        // Should mint tier 3 reward (3 tokens)
        assertEq(token.balanceOf(alice), 3 * ONE_TOKEN);
    }

    function test_daily_cap_separate_per_user() public {
        vm.startPrank(deployer);
        // Fill alice's daily cap
        for (uint256 i = 0; i < DAILY_CAP; i++) {
            token.recordAction(alice);
        }
        // Bob should still be able to act on the same day
        token.recordAction(bob);
        vm.stopPrank();

        (uint256 bobActions, , , ) = token.getUserProgress(bob);
        assertEq(bobActions, 1);
    }

    function test_granting_minter_role_allows_recordAction() public {
        // Grant MINTER_ROLE to bob (deployer has DEFAULT_ADMIN_ROLE)
        vm.startPrank(deployer);
        token.grantRole(token.MINTER_ROLE(), bob);
        vm.stopPrank();

        // Bob can now record actions
        vm.prank(bob);
        token.recordAction(alice);

        (uint256 actions, , , ) = token.getUserProgress(alice);
        assertEq(actions, 1);
    }

    function test_supportsInterface() public view {
        // AccessControl interface ID (IAccessControl)
        bytes4 accessControlId = 0x7965db0b;
        assertTrue(token.supportsInterface(accessControlId));
    }
}
