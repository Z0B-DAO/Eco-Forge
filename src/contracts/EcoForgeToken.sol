// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title EcoForgeToken — Non-transferable (soulbound) governance token
/// @notice Earned through milestone-based activity rewards. 1 token = 1 vote.
/// @dev transfer/transferFrom are DISABLED. Only mint (via milestones) and burn (via punishment) allowed.
contract EcoForgeToken is ERC20, AccessControl {
    // ──────────────────────────────── Roles ────────────────────────────────
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // ──────────────────────────────── Structs ──────────────────────────────
    struct Milestone {
        uint256 actionsRequired; // cumulative actions needed
        uint256 tokensRewarded; // tokens minted at this milestone
    }

    // ──────────────────────────────── State ────────────────────────────────
    Milestone[] private _milestones;
    mapping(address => uint256) private _userActions; // cumulative action count per wallet
    mapping(address => uint256) private _userMilestone; // index of next milestone to reach (0 = none reached)
    uint256 public dailyActionCap; // max actions counted per wallet per day (anti-sybil)
    mapping(address => mapping(uint256 => uint256)) private _dailyActions; // address => day => count

    // ──────────────────────────────── Events ───────────────────────────────
    event ActionRecorded(address indexed user, uint256 totalActions);

    event MilestoneReached(
        address indexed user,
        uint256 indexed milestoneIndex,
        uint256 tokensRewarded
    );

    event TokensBurned(address indexed user, uint256 amount, string reason);

    event AllTokensBurned(address indexed user, string reason);

    // ──────────────────────────────── Constructor ──────────────────────────
    constructor(uint256 _dailyActionCap) ERC20("EcoForge", "EFRG") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);

        dailyActionCap = _dailyActionCap;

        // Hardcoded milestone tiers (Fibonacci-like progression)
        _milestones.push(Milestone(5, 1)); // Tier 1:   5 actions  → 1 token
        _milestones.push(Milestone(15, 2)); // Tier 2:  15 actions  → 2 tokens
        _milestones.push(Milestone(30, 3)); // Tier 3:  30 actions  → 3 tokens
        _milestones.push(Milestone(50, 5)); // Tier 4:  50 actions  → 5 tokens
        _milestones.push(Milestone(100, 8)); // Tier 5: 100 actions  → 8 tokens
        _milestones.push(Milestone(200, 13)); // Tier 6: 200 actions  → 13 tokens
        _milestones.push(Milestone(500, 21)); // Tier 7: 500 actions  → 21 tokens
    }

    // ──────────────────────────────── Soulbound ────────────────────────────

    /// @dev Override _update to block all transfers. Only mint (from=0) and burn (to=0) allowed.
    function _update(address from, address to, uint256 value) internal override {
        require(
            from == address(0) || to == address(0),
            "EcoForgeToken: non-transferable"
        );
        super._update(from, to, value);
    }

    // ──────────────────────────────── Core ──────────────────────────────────

    /// @notice Record a qualifying action for a user. Auto-mints tokens if milestone reached.
    /// @dev Called by other contracts (CarbonCredit, Marketplace, Governance) on qualifying actions.
    function recordAction(address user) external onlyRole(MINTER_ROLE) {
        // Anti-sybil: daily action cap
        uint256 today = block.timestamp / 1 days;
        require(
            _dailyActions[user][today] < dailyActionCap,
            "EcoForgeToken: daily action cap reached"
        );
        _dailyActions[user][today]++;

        _userActions[user]++;

        emit ActionRecorded(user, _userActions[user]);

        // Check if next milestone is reached
        uint256 nextIdx = _userMilestone[user];
        if (nextIdx < _milestones.length) {
            Milestone memory m = _milestones[nextIdx];
            if (_userActions[user] >= m.actionsRequired) {
                _userMilestone[user] = nextIdx + 1;
                _mint(user, m.tokensRewarded * 10 ** decimals());

                emit MilestoneReached(user, nextIdx, m.tokensRewarded);
            }
        }
    }

    // ──────────────────────────────── Mint (for stake return / bonus) ──────

    /// @notice Mint tokens to an address. Used by Governance to return dispute stakes + bonus.
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // ──────────────────────────────── Punishment ────────────────────────────

    /// @notice Burn a specific amount of tokens from a user (e.g. false dispute penalty).
    function burn(address user, uint256 amount) external onlyRole(MINTER_ROLE) {
        _burn(user, amount);
        emit TokensBurned(user, amount, "punishment");
    }

    /// @notice Burn ALL tokens from a user (fraud penalty — issuer loses everything).
    function burnAll(address user) external onlyRole(MINTER_ROLE) {
        uint256 balance = balanceOf(user);
        require(balance > 0, "EcoForgeToken: no tokens to burn");
        _burn(user, balance);
        emit AllTokensBurned(user, "fraud");
    }

    // ──────────────────────────────── Views ─────────────────────────────────

    /// @notice Returns all milestone tiers.
    function getMilestones() external view returns (Milestone[] memory) {
        return _milestones;
    }

    /// @notice Returns a user's progress: actions, current milestone, next milestone, tokens earned.
    /// @return actions Cumulative actions count.
    /// @return currentMilestone Index of the last milestone reached (0 = none yet).
    /// @return nextMilestone actionsRequired for the next milestone (0 if all reached).
    /// @return tokensEarned Total tokens earned from all milestones reached.
    function getUserProgress(
        address user
    )
        external
        view
        returns (
            uint256 actions,
            uint256 currentMilestone,
            uint256 nextMilestone,
            uint256 tokensEarned
        )
    {
        actions = _userActions[user];
        currentMilestone = _userMilestone[user];

        // Next milestone's required actions (0 if all milestones reached)
        if (currentMilestone < _milestones.length) {
            nextMilestone = _milestones[currentMilestone].actionsRequired;
        }

        // Sum all rewards earned so far
        for (uint256 i = 0; i < currentMilestone; i++) {
            tokensEarned += _milestones[i].tokensRewarded;
        }
    }

    // ──────────────────────────────── Overrides ─────────────────────────────

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
