// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {CarbonCredit} from "../src/contracts/CarbonCredit.sol";

contract CarbonCreditTest is Test {
    CarbonCredit public cc;

    address public deployer = address(0xDEAD);
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public unauthorized = address(0xBAD);

    // Mirror events from the contract for vm.expectEmit
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

    // ──────────────────────────────── Helpers ────────────────────────────────

    /// @dev Returns a CreditParams struct with sensible defaults.
    function _defaultParams() internal pure returns (CarbonCredit.CreditParams memory) {
        return CarbonCredit.CreditParams({
            projectName: "Amazon Reforestation",
            projectType: "reforestation",
            region: "Brazil",
            vintageYear: 2024,
            tonnesCO2e: 1000,
            initialSupply: 100,
            metadataURI: "ipfs://QmDefault"
        });
    }

    /// @dev Creates a certified credit with default params and returns the creditId.
    function _createDefaultCertified(address issuer, bool verified) internal returns (uint256) {
        vm.prank(deployer);
        return cc.createCertifiedCredit(
            _defaultParams(),
            "Verra",
            "VCS-12345",
            issuer,
            verified
        );
    }

    /// @dev Creates a community credit from the given sender and returns the creditId.
    function _createDefaultCommunity(address sender) internal returns (uint256) {
        vm.prank(sender);
        return cc.createCommunityCredit(_defaultParams());
    }

    // ──────────────────────────────── Setup ──────────────────────────────────

    function setUp() public {
        vm.prank(deployer);
        cc = new CarbonCredit();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  1. DEPLOYMENT
    // ═══════════════════════════════════════════════════════════════════════

    function test_deployment_deployer_has_DEFAULT_ADMIN_ROLE() public view {
        assertTrue(cc.hasRole(cc.DEFAULT_ADMIN_ROLE(), deployer));
    }

    function test_deployment_deployer_has_ADMIN_ROLE() public view {
        assertTrue(cc.hasRole(cc.ADMIN_ROLE(), deployer));
    }

    function test_deployment_deployer_has_MINTER_ROLE() public view {
        assertTrue(cc.hasRole(cc.MINTER_ROLE(), deployer));
    }

    function test_deployment_deployer_has_VERIFIER_ROLE() public view {
        assertTrue(cc.hasRole(cc.VERIFIER_ROLE(), deployer));
    }

    function test_deployment_other_accounts_lack_all_roles() public view {
        assertFalse(cc.hasRole(cc.DEFAULT_ADMIN_ROLE(), alice));
        assertFalse(cc.hasRole(cc.ADMIN_ROLE(), alice));
        assertFalse(cc.hasRole(cc.MINTER_ROLE(), alice));
        assertFalse(cc.hasRole(cc.VERIFIER_ROLE(), alice));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  2. createCertifiedCredit
    // ═══════════════════════════════════════════════════════════════════════

    function test_certifiedCredit_mints_tokens_to_issuer() public {
        uint256 creditId = _createDefaultCertified(alice, true);
        assertEq(cc.balanceOf(alice, creditId), 100);
    }

    function test_certifiedCredit_sets_fields_correctly_verified() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        CarbonCredit.CreditType memory ct = cc.getCreditType(creditId);
        assertEq(ct.id, creditId);
        assertEq(ct.projectName, "Amazon Reforestation");
        assertEq(ct.projectType, "reforestation");
        assertEq(ct.region, "Brazil");
        assertEq(ct.vintageYear, 2024);
        assertEq(ct.tonnesCO2e, 1000);
        assertEq(ct.totalSupply, 100);
        assertEq(ct.impactScore, 0);
        assertEq(ct.metadataURI, "ipfs://QmDefault");
        assertTrue(ct.origin == CarbonCredit.CreditOrigin.Certified);
        assertTrue(ct.status == CarbonCredit.CreditStatus.Verified);
        assertEq(ct.issuer, alice);
        assertEq(ct.registrySource, "Verra");
        assertEq(ct.retirementProof, "VCS-12345");
    }

    function test_certifiedCredit_status_pending_when_not_verified() public {
        uint256 creditId = _createDefaultCertified(alice, false);

        CarbonCredit.CreditType memory ct = cc.getCreditType(creditId);
        assertTrue(ct.status == CarbonCredit.CreditStatus.Pending);
    }

    function test_certifiedCredit_status_verified_when_verified() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        CarbonCredit.CreditType memory ct = cc.getCreditType(creditId);
        assertTrue(ct.status == CarbonCredit.CreditStatus.Verified);
    }

    function test_certifiedCredit_anti_double_bridge_reverts() public {
        CarbonCredit.CreditParams memory p = _defaultParams();

        vm.startPrank(deployer);
        cc.createCertifiedCredit(p, "Verra", "VCS-12345", alice, true);

        // Same registrySource + retirementProof → same proofHash → must revert
        vm.expectRevert("CarbonCredit: retirement proof already used");
        cc.createCertifiedCredit(p, "Verra", "VCS-12345", bob, true);
        vm.stopPrank();
    }

    function test_certifiedCredit_different_proofs_succeed() public {
        CarbonCredit.CreditParams memory p = _defaultParams();

        vm.startPrank(deployer);
        uint256 id1 = cc.createCertifiedCredit(p, "Verra", "VCS-12345", alice, true);
        uint256 id2 = cc.createCertifiedCredit(p, "Verra", "VCS-67890", bob, true);
        vm.stopPrank();

        assertEq(id1, 1);
        assertEq(id2, 2);
    }

    function test_certifiedCredit_reverts_if_issuer_blacklisted() public {
        // Blacklist alice first
        vm.startPrank(deployer);
        cc.blacklist(alice, 0);

        vm.expectRevert("CarbonCredit: issuer is blacklisted");
        cc.createCertifiedCredit(_defaultParams(), "Verra", "VCS-11111", alice, true);
        vm.stopPrank();
    }

    function test_certifiedCredit_reverts_if_caller_blacklisted() public {
        // Give alice MINTER_ROLE then blacklist her
        vm.startPrank(deployer);
        cc.grantRole(cc.MINTER_ROLE(), alice);
        cc.blacklist(alice, 0);
        vm.stopPrank();

        vm.prank(alice);
        vm.expectRevert("CarbonCredit: sender is blacklisted");
        cc.createCertifiedCredit(_defaultParams(), "Verra", "VCS-22222", bob, true);
    }

    function test_certifiedCredit_reverts_without_MINTER_ROLE() public {
        vm.prank(unauthorized);
        vm.expectRevert();
        cc.createCertifiedCredit(_defaultParams(), "Verra", "VCS-33333", alice, true);
    }

    function test_certifiedCredit_emits_CertifiedCreditCreated() public {
        CarbonCredit.CreditParams memory p = _defaultParams();
        bytes32 expectedHash = keccak256(abi.encodePacked("Verra", "VCS-12345"));

        vm.prank(deployer);
        vm.expectEmit(true, false, false, true, address(cc));
        emit CertifiedCreditCreated(1, "Amazon Reforestation", "Verra", expectedHash);
        cc.createCertifiedCredit(p, "Verra", "VCS-12345", alice, true);
    }

    function test_certifiedCredit_increments_creditId() public {
        CarbonCredit.CreditParams memory p = _defaultParams();

        vm.startPrank(deployer);
        uint256 id1 = cc.createCertifiedCredit(p, "Verra", "VCS-001", alice, true);
        uint256 id2 = cc.createCertifiedCredit(p, "GoldStandard", "GS-001", alice, true);
        vm.stopPrank();

        assertEq(id1, 1);
        assertEq(id2, 2);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  3. createCommunityCredit
    // ═══════════════════════════════════════════════════════════════════════

    function test_communityCredit_mints_tokens_to_sender() public {
        uint256 creditId = _createDefaultCommunity(alice);
        assertEq(cc.balanceOf(alice, creditId), 100);
    }

    function test_communityCredit_always_pending() public {
        uint256 creditId = _createDefaultCommunity(alice);

        CarbonCredit.CreditType memory ct = cc.getCreditType(creditId);
        assertTrue(ct.status == CarbonCredit.CreditStatus.Pending);
    }

    function test_communityCredit_sets_origin_CommunityVerified() public {
        uint256 creditId = _createDefaultCommunity(alice);

        CarbonCredit.CreditType memory ct = cc.getCreditType(creditId);
        assertTrue(ct.origin == CarbonCredit.CreditOrigin.CommunityVerified);
    }

    function test_communityCredit_registrySource_empty() public {
        uint256 creditId = _createDefaultCommunity(alice);

        CarbonCredit.CreditType memory ct = cc.getCreditType(creditId);
        assertEq(ct.registrySource, "");
    }

    function test_communityCredit_retirementProof_empty() public {
        uint256 creditId = _createDefaultCommunity(alice);

        CarbonCredit.CreditType memory ct = cc.getCreditType(creditId);
        assertEq(ct.retirementProof, "");
    }

    function test_communityCredit_issuer_is_msg_sender() public {
        uint256 creditId = _createDefaultCommunity(alice);

        CarbonCredit.CreditType memory ct = cc.getCreditType(creditId);
        assertEq(ct.issuer, alice);
    }

    function test_communityCredit_reverts_if_blacklisted() public {
        vm.prank(deployer);
        cc.blacklist(alice, 0);

        vm.prank(alice);
        vm.expectRevert("CarbonCredit: sender is blacklisted");
        cc.createCommunityCredit(_defaultParams());
    }

    function test_communityCredit_emits_CommunityCreditSubmitted() public {
        vm.prank(alice);
        vm.expectEmit(true, true, false, true, address(cc));
        emit CommunityCreditSubmitted(1, "Amazon Reforestation", alice);
        cc.createCommunityCredit(_defaultParams());
    }

    function test_communityCredit_anyone_can_create() public {
        // No MINTER_ROLE needed for community credits
        uint256 id = _createDefaultCommunity(unauthorized);
        assertEq(cc.balanceOf(unauthorized, id), 100);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  4. verifyCommunityCredit
    // ═══════════════════════════════════════════════════════════════════════

    function test_verifyCommunityCredit_changes_pending_to_verified() public {
        uint256 creditId = _createDefaultCommunity(alice);

        vm.prank(deployer);
        cc.verifyCommunityCredit(creditId);

        CarbonCredit.CreditType memory ct = cc.getCreditType(creditId);
        assertTrue(ct.status == CarbonCredit.CreditStatus.Verified);
    }

    function test_verifyCommunityCredit_reverts_without_VERIFIER_ROLE() public {
        uint256 creditId = _createDefaultCommunity(alice);

        vm.prank(unauthorized);
        vm.expectRevert();
        cc.verifyCommunityCredit(creditId);
    }

    function test_verifyCommunityCredit_reverts_if_not_pending() public {
        uint256 creditId = _createDefaultCommunity(alice);

        // Verify it first
        vm.startPrank(deployer);
        cc.verifyCommunityCredit(creditId);

        // Try to verify again — no longer Pending
        vm.expectRevert("CarbonCredit: not pending");
        cc.verifyCommunityCredit(creditId);
        vm.stopPrank();
    }

    function test_verifyCommunityCredit_reverts_if_certified() public {
        uint256 creditId = _createDefaultCertified(alice, false);

        vm.prank(deployer);
        vm.expectRevert("CarbonCredit: not a community credit");
        cc.verifyCommunityCredit(creditId);
    }

    function test_verifyCommunityCredit_reverts_if_credit_does_not_exist() public {
        vm.prank(deployer);
        vm.expectRevert("CarbonCredit: credit does not exist");
        cc.verifyCommunityCredit(999);
    }

    function test_verifyCommunityCredit_emits_CommunityCreditVerified() public {
        uint256 creditId = _createDefaultCommunity(alice);

        vm.prank(deployer);
        vm.expectEmit(true, false, false, true, address(cc));
        emit CommunityCreditVerified(creditId);
        cc.verifyCommunityCredit(creditId);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  5. mintCredits
    // ═══════════════════════════════════════════════════════════════════════

    function test_mintCredits_increases_balance() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.prank(deployer);
        cc.mintCredits(creditId, alice, 50);

        assertEq(cc.balanceOf(alice, creditId), 150);
    }

    function test_mintCredits_updates_totalSupply() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.prank(deployer);
        cc.mintCredits(creditId, alice, 50);

        CarbonCredit.CreditType memory ct = cc.getCreditType(creditId);
        assertEq(ct.totalSupply, 150);
    }

    function test_mintCredits_can_mint_to_different_address() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.prank(deployer);
        cc.mintCredits(creditId, bob, 25);

        assertEq(cc.balanceOf(bob, creditId), 25);
        assertEq(cc.balanceOf(alice, creditId), 100);
    }

    function test_mintCredits_reverts_without_MINTER_ROLE() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.prank(unauthorized);
        vm.expectRevert();
        cc.mintCredits(creditId, alice, 50);
    }

    function test_mintCredits_reverts_if_credit_does_not_exist() public {
        vm.prank(deployer);
        vm.expectRevert("CarbonCredit: credit does not exist");
        cc.mintCredits(999, alice, 50);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  6. updateImpactScore
    // ═══════════════════════════════════════════════════════════════════════

    function test_updateImpactScore_sets_score() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.prank(deployer);
        cc.updateImpactScore(creditId, 85);

        CarbonCredit.CreditType memory ct = cc.getCreditType(creditId);
        assertEq(ct.impactScore, 85);
    }

    function test_updateImpactScore_emits_with_old_and_new() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.startPrank(deployer);
        cc.updateImpactScore(creditId, 50);

        vm.expectEmit(true, false, false, true, address(cc));
        emit ImpactScoreUpdated(creditId, 50, 85);
        cc.updateImpactScore(creditId, 85);
        vm.stopPrank();
    }

    function test_updateImpactScore_emits_zero_as_old_on_first_update() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.prank(deployer);
        vm.expectEmit(true, false, false, true, address(cc));
        emit ImpactScoreUpdated(creditId, 0, 75);
        cc.updateImpactScore(creditId, 75);
    }

    function test_updateImpactScore_reverts_if_score_above_100() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.prank(deployer);
        vm.expectRevert("CarbonCredit: score must be 0-100");
        cc.updateImpactScore(creditId, 101);
    }

    function test_updateImpactScore_allows_score_of_100() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.prank(deployer);
        cc.updateImpactScore(creditId, 100);

        CarbonCredit.CreditType memory ct = cc.getCreditType(creditId);
        assertEq(ct.impactScore, 100);
    }

    function test_updateImpactScore_allows_score_of_zero() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.startPrank(deployer);
        cc.updateImpactScore(creditId, 50);
        cc.updateImpactScore(creditId, 0);
        vm.stopPrank();

        CarbonCredit.CreditType memory ct = cc.getCreditType(creditId);
        assertEq(ct.impactScore, 0);
    }

    function test_updateImpactScore_reverts_without_VERIFIER_ROLE() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.prank(unauthorized);
        vm.expectRevert();
        cc.updateImpactScore(creditId, 50);
    }

    function test_updateImpactScore_reverts_if_credit_does_not_exist() public {
        vm.prank(deployer);
        vm.expectRevert("CarbonCredit: credit does not exist");
        cc.updateImpactScore(999, 50);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  7. retireCredits
    // ═══════════════════════════════════════════════════════════════════════

    function test_retireCredits_burns_tokens() public {
        uint256 creditId = _createDefaultCertified(alice, true);
        assertEq(cc.balanceOf(alice, creditId), 100);

        vm.prank(alice);
        cc.retireCredits(creditId, 30);

        assertEq(cc.balanceOf(alice, creditId), 70);
    }

    function test_retireCredits_updates_retiredCredits_mapping() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.prank(alice);
        cc.retireCredits(creditId, 30);

        assertEq(cc.retiredCredits(alice, creditId), 30);
    }

    function test_retireCredits_accumulates_retiredCredits() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.startPrank(alice);
        cc.retireCredits(creditId, 20);
        cc.retireCredits(creditId, 15);
        vm.stopPrank();

        assertEq(cc.retiredCredits(alice, creditId), 35);
    }

    function test_retireCredits_reverts_if_insufficient_balance() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.prank(alice);
        vm.expectRevert("CarbonCredit: insufficient balance");
        cc.retireCredits(creditId, 101);
    }

    function test_retireCredits_reverts_if_credit_does_not_exist() public {
        vm.prank(alice);
        vm.expectRevert("CarbonCredit: credit does not exist");
        cc.retireCredits(999, 10);
    }

    function test_retireCredits_emits_CreditsRetired() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.prank(alice);
        vm.expectEmit(true, true, false, true, address(cc));
        emit CreditsRetired(alice, creditId, 30);
        cc.retireCredits(creditId, 30);
    }

    function test_retireCredits_can_retire_entire_balance() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.prank(alice);
        cc.retireCredits(creditId, 100);

        assertEq(cc.balanceOf(alice, creditId), 0);
        assertEq(cc.retiredCredits(alice, creditId), 100);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  8. suspendCredit
    // ═══════════════════════════════════════════════════════════════════════

    function test_suspendCredit_sets_status_suspended() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.prank(deployer);
        cc.suspendCredit(creditId);

        CarbonCredit.CreditType memory ct = cc.getCreditType(creditId);
        assertTrue(ct.status == CarbonCredit.CreditStatus.Suspended);
    }

    function test_suspendCredit_reverts_without_ADMIN_ROLE() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        vm.prank(unauthorized);
        vm.expectRevert();
        cc.suspendCredit(creditId);
    }

    function test_suspendCredit_reverts_if_credit_does_not_exist() public {
        vm.prank(deployer);
        vm.expectRevert("CarbonCredit: credit does not exist");
        cc.suspendCredit(999);
    }

    function test_suspendCredit_can_suspend_pending_credit() public {
        uint256 creditId = _createDefaultCommunity(alice);

        vm.prank(deployer);
        cc.suspendCredit(creditId);

        CarbonCredit.CreditType memory ct = cc.getCreditType(creditId);
        assertTrue(ct.status == CarbonCredit.CreditStatus.Suspended);
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  9. blacklist
    // ═══════════════════════════════════════════════════════════════════════

    function test_blacklist_sets_blacklisted() public {
        vm.prank(deployer);
        cc.blacklist(alice, 1);

        assertTrue(cc.isBlacklisted(alice));
    }

    function test_blacklist_emits_IssuerBlacklisted() public {
        vm.prank(deployer);
        vm.expectEmit(true, false, false, true, address(cc));
        emit IssuerBlacklisted(alice, 1);
        cc.blacklist(alice, 1);
    }

    function test_blacklist_reverts_if_already_blacklisted() public {
        vm.startPrank(deployer);
        cc.blacklist(alice, 1);

        vm.expectRevert("CarbonCredit: already blacklisted");
        cc.blacklist(alice, 2);
        vm.stopPrank();
    }

    function test_blacklist_reverts_without_ADMIN_ROLE() public {
        vm.prank(unauthorized);
        vm.expectRevert();
        cc.blacklist(alice, 1);
    }

    function test_blacklisted_issuer_cannot_create_certified_credit() public {
        vm.startPrank(deployer);
        cc.blacklist(alice, 0);

        vm.expectRevert("CarbonCredit: issuer is blacklisted");
        cc.createCertifiedCredit(_defaultParams(), "Verra", "VCS-99999", alice, true);
        vm.stopPrank();
    }

    function test_blacklisted_issuer_cannot_create_community_credit() public {
        vm.prank(deployer);
        cc.blacklist(alice, 0);

        vm.prank(alice);
        vm.expectRevert("CarbonCredit: sender is blacklisted");
        cc.createCommunityCredit(_defaultParams());
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  10. VIEWS
    // ═══════════════════════════════════════════════════════════════════════

    function test_isBlacklisted_returns_false_by_default() public view {
        assertFalse(cc.isBlacklisted(alice));
    }

    function test_isBlacklisted_returns_true_after_blacklist() public {
        vm.prank(deployer);
        cc.blacklist(alice, 0);

        assertTrue(cc.isBlacklisted(alice));
    }

    function test_isRetirementProofUsed_returns_false_initially() public view {
        bytes32 proofHash = keccak256(abi.encodePacked("Verra", "VCS-12345"));
        assertFalse(cc.isRetirementProofUsed(proofHash));
    }

    function test_isRetirementProofUsed_returns_true_after_certified_creation() public {
        _createDefaultCertified(alice, true);

        bytes32 proofHash = keccak256(abi.encodePacked("Verra", "VCS-12345"));
        assertTrue(cc.isRetirementProofUsed(proofHash));
    }

    function test_getCreditType_returns_correct_data() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        CarbonCredit.CreditType memory ct = cc.getCreditType(creditId);
        assertEq(ct.id, creditId);
        assertEq(ct.projectName, "Amazon Reforestation");
        assertEq(ct.issuer, alice);
    }

    function test_getCreditType_reverts_for_nonexistent_credit() public {
        vm.expectRevert("CarbonCredit: credit does not exist");
        cc.getCreditType(999);
    }

    function test_uri_returns_metadataURI() public {
        uint256 creditId = _createDefaultCertified(alice, true);
        assertEq(cc.uri(creditId), "ipfs://QmDefault");
    }

    function test_uri_returns_empty_for_nonexistent_credit() public view {
        // uri does not revert for non-existent credit, returns empty string
        assertEq(cc.uri(999), "");
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  11. PAUSABLE
    // ═══════════════════════════════════════════════════════════════════════

    function test_pause_blocks_createCertifiedCredit() public {
        vm.startPrank(deployer);
        cc.pause();

        vm.expectRevert();
        cc.createCertifiedCredit(_defaultParams(), "Verra", "VCS-PAUSED", alice, true);
        vm.stopPrank();
    }

    function test_pause_blocks_createCommunityCredit() public {
        vm.prank(deployer);
        cc.pause();

        vm.prank(alice);
        vm.expectRevert();
        cc.createCommunityCredit(_defaultParams());
    }

    function test_unpause_allows_createCertifiedCredit() public {
        vm.startPrank(deployer);
        cc.pause();
        cc.unpause();

        uint256 creditId = cc.createCertifiedCredit(_defaultParams(), "Verra", "VCS-UNPAUSE", alice, true);
        vm.stopPrank();

        assertEq(cc.balanceOf(alice, creditId), 100);
    }

    function test_unpause_allows_createCommunityCredit() public {
        vm.startPrank(deployer);
        cc.pause();
        cc.unpause();
        vm.stopPrank();

        uint256 creditId = _createDefaultCommunity(alice);
        assertEq(cc.balanceOf(alice, creditId), 100);
    }

    function test_pause_reverts_without_ADMIN_ROLE() public {
        vm.prank(unauthorized);
        vm.expectRevert();
        cc.pause();
    }

    function test_unpause_reverts_without_ADMIN_ROLE() public {
        vm.prank(deployer);
        cc.pause();

        vm.prank(unauthorized);
        vm.expectRevert();
        cc.unpause();
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  12. supportsInterface
    // ═══════════════════════════════════════════════════════════════════════

    function test_supportsInterface_ERC1155() public view {
        // ERC1155 interface ID: 0xd9b67a26
        assertTrue(cc.supportsInterface(0xd9b67a26));
    }

    function test_supportsInterface_AccessControl() public view {
        // IAccessControl interface ID: 0x7965db0b
        assertTrue(cc.supportsInterface(0x7965db0b));
    }

    function test_supportsInterface_ERC165() public view {
        // ERC165 interface ID: 0x01ffc9a7
        assertTrue(cc.supportsInterface(0x01ffc9a7));
    }

    // ═══════════════════════════════════════════════════════════════════════
    //  13. INTEGRATION / EDGE CASES
    // ═══════════════════════════════════════════════════════════════════════

    function test_mixed_certified_and_community_credits_independent_ids() public {
        uint256 id1 = _createDefaultCertified(alice, true);
        uint256 id2 = _createDefaultCommunity(bob);

        assertEq(id1, 1);
        assertEq(id2, 2);

        CarbonCredit.CreditType memory ct1 = cc.getCreditType(id1);
        CarbonCredit.CreditType memory ct2 = cc.getCreditType(id2);

        assertTrue(ct1.origin == CarbonCredit.CreditOrigin.Certified);
        assertTrue(ct2.origin == CarbonCredit.CreditOrigin.CommunityVerified);
    }

    function test_retire_then_mint_more_then_retire_again() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        // Retire 50
        vm.prank(alice);
        cc.retireCredits(creditId, 50);
        assertEq(cc.balanceOf(alice, creditId), 50);
        assertEq(cc.retiredCredits(alice, creditId), 50);

        // Mint 30 more
        vm.prank(deployer);
        cc.mintCredits(creditId, alice, 30);
        assertEq(cc.balanceOf(alice, creditId), 80);

        // Retire 20 more
        vm.prank(alice);
        cc.retireCredits(creditId, 20);
        assertEq(cc.balanceOf(alice, creditId), 60);
        assertEq(cc.retiredCredits(alice, creditId), 70);
    }

    function test_suspend_then_verify_community_reverts() public {
        uint256 creditId = _createDefaultCommunity(alice);

        vm.startPrank(deployer);
        cc.suspendCredit(creditId);

        // Trying to verify a suspended credit should fail (not pending)
        vm.expectRevert("CarbonCredit: not pending");
        cc.verifyCommunityCredit(creditId);
        vm.stopPrank();
    }

    function test_blacklist_does_not_affect_existing_balances() public {
        uint256 creditId = _createDefaultCommunity(alice);
        assertEq(cc.balanceOf(alice, creditId), 100);

        vm.prank(deployer);
        cc.blacklist(alice, creditId);

        // Blacklisting does not burn existing tokens
        assertEq(cc.balanceOf(alice, creditId), 100);
    }

    function test_multiple_users_retire_same_credit() public {
        uint256 creditId = _createDefaultCertified(alice, true);

        // Mint some to bob as well
        vm.prank(deployer);
        cc.mintCredits(creditId, bob, 50);

        // Both retire
        vm.prank(alice);
        cc.retireCredits(creditId, 40);

        vm.prank(bob);
        cc.retireCredits(creditId, 20);

        assertEq(cc.retiredCredits(alice, creditId), 40);
        assertEq(cc.retiredCredits(bob, creditId), 20);
        assertEq(cc.balanceOf(alice, creditId), 60);
        assertEq(cc.balanceOf(bob, creditId), 30);
    }

    function test_granting_roles_allows_operations() public {
        // Grant VERIFIER_ROLE to alice
        bytes32 verifierRole = cc.VERIFIER_ROLE();
        vm.prank(deployer);
        cc.grantRole(verifierRole, alice);

        uint256 creditId = _createDefaultCommunity(bob);

        // Alice can now verify
        vm.prank(alice);
        cc.verifyCommunityCredit(creditId);

        CarbonCredit.CreditType memory ct = cc.getCreditType(creditId);
        assertTrue(ct.status == CarbonCredit.CreditStatus.Verified);
    }
}
