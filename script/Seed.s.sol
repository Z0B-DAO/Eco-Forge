// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {CarbonCredit} from "../src/contracts/CarbonCredit.sol";
import {Marketplace} from "../src/contracts/Marketplace.sol";
import {EcoForgeToken} from "../src/contracts/EcoForgeToken.sol";

/// @title Seed — Populate Fuji testnet with sample data
/// @notice Run after Deploy.s.sol. Fill contract addresses below.
/// @dev forge script script/Seed.s.sol --rpc-url $FUJI_RPC_URL --broadcast
contract Seed is Script {
    // ──────── Deployed on Fuji ────────
    address constant CARBON_CREDIT_ADDR = 0x292834ceD52eA68190444E5a6F324906f0F0B449;
    address constant MARKETPLACE_ADDR = 0x3f0Fa80C11bAc6c9f132922407A4ecf9E2Ad0614;
    address constant TOKEN_ADDR = 0x4E55dDCc3548870906F458A898c742CC6152E25E;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        CarbonCredit cc = CarbonCredit(CARBON_CREDIT_ADDR);
        Marketplace mp = Marketplace(MARKETPLACE_ADDR);

        vm.startBroadcast(deployerKey);

        // ──────────────── 1. Create Certified Credits ──────────────────────
        uint256 certId1 = cc.createCertifiedCredit(
            CarbonCredit.CreditParams({
                projectName: "Amazon Reforestation Block A",
                projectType: "reforestation",
                region: "Para, Brazil",
                vintageYear: 2024,
                tonnesCO2e: 10000,
                initialSupply: 500,
                metadataURI: "ipfs://QmSeedCertified1"
            }),
            "Verra",
            "VCS-2024-001234",
            deployer,
            true // verified by AI
        );

        uint256 certId2 = cc.createCertifiedCredit(
            CarbonCredit.CreditParams({
                projectName: "Wind Farm Delta",
                projectType: "renewable_energy",
                region: "Tamil Nadu, India",
                vintageYear: 2023,
                tonnesCO2e: 5000,
                initialSupply: 200,
                metadataURI: "ipfs://QmSeedCertified2"
            }),
            "Gold Standard",
            "GS-2023-005678",
            deployer,
            true
        );

        // ──────────────── 2. Create Community Credits ──────────────────────
        uint256 commId1 = cc.createCommunityCredit(
            CarbonCredit.CreditParams({
                projectName: "Mangrove Restoration Senegal",
                projectType: "reforestation",
                region: "Casamance, Senegal",
                vintageYear: 2025,
                tonnesCO2e: 3000,
                initialSupply: 300,
                metadataURI: "ipfs://QmSeedCommunity1"
            })
        );

        uint256 commId2 = cc.createCommunityCredit(
            CarbonCredit.CreditParams({
                projectName: "Biochar Carbon Capture",
                projectType: "methane_capture",
                region: "Kenya",
                vintageYear: 2025,
                tonnesCO2e: 1500,
                initialSupply: 150,
                metadataURI: "ipfs://QmSeedCommunity2"
            })
        );

        // ──────────────── 3. Verify some community credits ─────────────────
        cc.verifyCommunityCredit(commId1);
        // commId2 stays Pending (for testing challenge flow)

        // ──────────────── 4. Set impact scores ─────────────────────────────
        cc.updateImpactScore(certId1, 87);
        cc.updateImpactScore(certId2, 72);
        cc.updateImpactScore(commId1, 65);

        // ──────────────── 5. List some credits on Marketplace ──────────────
        cc.setApprovalForAll(address(mp), true);

        mp.listCredits(certId1, 100, 0.5 ether); // 100 units at 0.5 AVAX each
        mp.listCredits(certId2, 50, 0.3 ether); // 50 units at 0.3 AVAX each
        mp.listCredits(commId1, 75, 0.1 ether); // 75 units at 0.1 AVAX each

        vm.stopBroadcast();
    }
}
