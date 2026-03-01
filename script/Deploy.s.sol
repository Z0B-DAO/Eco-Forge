// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CarbonCredit} from "../src/contracts/CarbonCredit.sol";
import {Marketplace} from "../src/contracts/Marketplace.sol";
import {EcoForgeToken} from "../src/contracts/EcoForgeToken.sol";
import {EcoForgeGovernance} from "../src/contracts/EcoForgeGovernance.sol";
import {EcoForgeOracle} from "../src/contracts/EcoForgeOracle.sol";

/// @title Deploy — Deploys all EcoForge contracts to Fuji
/// @notice forge script script/Deploy.s.sol --rpc-url $FUJI_RPC_URL --broadcast --verify
contract Deploy is Script {
    // ──────────────────── Configuration (adjust before deploy) ──────────────
    uint256 constant DAILY_ACTION_CAP = 10;
    uint256 constant PLATFORM_FEE_BPS = 250; // 2.5%
    uint256 constant MIN_PROPOSAL_TOKENS = 1; // 1 token to propose
    uint256 constant DISPUTE_STAKE_AMOUNT = 1; // 1 token to dispute
    uint256 constant DISPUTE_BONUS_AMOUNT = 1; // 1 token bonus for successful challenger

    // Chainlink Functions (Fuji)
    // Router: https://docs.chain.link/chainlink-functions/supported-networks#avalanche-fuji-testnet
    address constant CHAINLINK_FUNCTIONS_ROUTER = 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0;
    bytes32 constant DON_ID = 0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000; // fun-avalanche-fuji-1
    uint64 constant SUBSCRIPTION_ID = 0; // Fill after creating subscription on functions.chain.link

    // JS source for Chainlink Functions (placeholder — calls our Server Action)
    string constant CHAINLINK_JS_SOURCE =
        "const creditId = args[0];"
        "const response = await Functions.makeHttpRequest({"
        "  url: `https://ecoforge.vercel.app/api/oracle-score?creditId=${creditId}`"
        "});"
        "if (response.error) throw Error('Request failed');"
        "return Functions.encodeUint256(response.data.score);";

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address feeRecipient = deployer; // DAO treasury — change post-deploy

        vm.startBroadcast(deployerPrivateKey);

        // ──────────────── 1. Deploy EcoForgeToken (no dependencies) ────────
        EcoForgeToken token = new EcoForgeToken(DAILY_ACTION_CAP);

        // ──────────────── 2. Deploy CarbonCredit (no dependencies) ─────────
        CarbonCredit carbonCredit = new CarbonCredit();

        // ──────────────── 3. Deploy Marketplace (needs CarbonCredit) ───────
        Marketplace marketplace = new Marketplace(
            address(carbonCredit),
            PLATFORM_FEE_BPS,
            feeRecipient
        );

        // ──────────────── 4. Deploy Governance (needs Token + CarbonCredit) ─
        EcoForgeGovernance governance = new EcoForgeGovernance(
            address(token),
            address(carbonCredit),
            MIN_PROPOSAL_TOKENS,
            DISPUTE_STAKE_AMOUNT,
            DISPUTE_BONUS_AMOUNT
        );

        // ──────────────── 5. Deploy Oracle (needs CarbonCredit + Router) ────
        EcoForgeOracle oracle = new EcoForgeOracle(
            CHAINLINK_FUNCTIONS_ROUTER,
            address(carbonCredit),
            DON_ID,
            SUBSCRIPTION_ID,
            CHAINLINK_JS_SOURCE
        );

        // ──────────────── 6. Grant Roles ────────────────────────────────────

        // Governance needs MINTER_ROLE on EcoForgeToken (for burn, burnAll, mint, recordAction)
        token.grantRole(token.MINTER_ROLE(), address(governance));

        // Governance needs ADMIN_ROLE on CarbonCredit (for suspendCredit, blacklist, setDisputed)
        carbonCredit.grantRole(carbonCredit.ADMIN_ROLE(), address(governance));

        // Oracle needs VERIFIER_ROLE on CarbonCredit (for updateImpactScore)
        carbonCredit.grantRole(carbonCredit.VERIFIER_ROLE(), address(oracle));

        vm.stopBroadcast();

        // ──────────────── Log Deployed Addresses ────────────────────────────
        // These go into .env as NEXT_PUBLIC_*_ADDRESS
        _log("EcoForgeToken", address(token));
        _log("CarbonCredit", address(carbonCredit));
        _log("Marketplace", address(marketplace));
        _log("EcoForgeGovernance", address(governance));
        _log("EcoForgeOracle", address(oracle));
    }

    function _log(string memory name, address addr) internal pure {
        console.log(
            string.concat("NEXT_PUBLIC_", name, "_ADDRESS="),
            addr
        );
    }
}
