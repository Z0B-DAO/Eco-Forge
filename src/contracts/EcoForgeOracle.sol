// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FunctionsClient} from "@chainlink-contracts/functions/v1_3_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink-contracts/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {CarbonCredit} from "./CarbonCredit.sol";

/// @title EcoForgeOracle — Chainlink Functions client
/// @notice Pushes AI-generated impact scores on-chain via Chainlink Functions DON.
contract EcoForgeOracle is FunctionsClient, AccessControl {
    using FunctionsRequest for FunctionsRequest.Request;

    // ──────────────────────────────── Roles ────────────────────────────────
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REQUESTER_ROLE = keccak256("REQUESTER_ROLE");

    // ──────────────────────────────── State ────────────────────────────────
    CarbonCredit public immutable carbonCredit;

    bytes32 public donId; // Chainlink Functions DON ID
    uint64 public subscriptionId; // Chainlink Functions subscription ID
    uint32 public callbackGasLimit = 300_000;

    // JavaScript source code executed by the DON (calls our Server Action)
    string public source;

    // Track pending requests: requestId => creditId
    mapping(bytes32 => uint256) private _pendingRequests;

    // ──────────────────────────────── Events ───────────────────────────────
    event ScoreRequested(bytes32 indexed requestId, uint256 indexed creditId);
    event ScoreFulfilled(bytes32 indexed requestId, uint256 indexed creditId, uint256 score);
    event ScoreRequestFailed(bytes32 indexed requestId, uint256 indexed creditId, bytes error);

    // ──────────────────────────────── Constructor ──────────────────────────
    constructor(
        address _router,
        address _carbonCredit,
        bytes32 _donId,
        uint64 _subscriptionId,
        string memory _source
    ) FunctionsClient(_router) {
        require(_carbonCredit != address(0), "Oracle: zero credit address");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(REQUESTER_ROLE, msg.sender);

        carbonCredit = CarbonCredit(_carbonCredit);
        donId = _donId;
        subscriptionId = _subscriptionId;
        source = _source;
    }

    // ──────────────────────────────── Request ──────────────────────────────

    /// @notice Request an AI impact score for a credit via Chainlink Functions.
    /// @param creditId The credit ID to score.
    function requestImpactScore(uint256 creditId) external onlyRole(REQUESTER_ROLE) returns (bytes32) {
        // Build the Chainlink Functions request
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);

        // Pass the creditId as a string argument to the JS source
        string[] memory args = new string[](1);
        args[0] = _uint2str(creditId);
        req.setArgs(args);

        // Send the request
        bytes32 requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            callbackGasLimit,
            donId
        );

        _pendingRequests[requestId] = creditId;

        emit ScoreRequested(requestId, creditId);

        return requestId;
    }

    // ──────────────────────────────── Fulfill ──────────────────────────────

    /// @dev Callback from the DON with the AI score result.
    function _fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        uint256 creditId = _pendingRequests[requestId];
        require(creditId != 0, "Oracle: unknown request");

        delete _pendingRequests[requestId];

        if (err.length > 0) {
            emit ScoreRequestFailed(requestId, creditId, err);
            return;
        }

        // Decode the score from the response (uint256 encoded as bytes)
        uint256 score = abi.decode(response, (uint256));

        // Clamp score to 0-100
        if (score > 100) {
            score = 100;
        }

        // Update on-chain (Oracle needs VERIFIER_ROLE on CarbonCredit)
        carbonCredit.updateImpactScore(creditId, score);

        emit ScoreFulfilled(requestId, creditId, score);
    }

    // ──────────────────────────────── Admin ─────────────────────────────────

    /// @notice Update the DON ID.
    function setDonId(bytes32 _donId) external onlyRole(ADMIN_ROLE) {
        donId = _donId;
    }

    /// @notice Update the subscription ID.
    function setSubscriptionId(uint64 _subscriptionId) external onlyRole(ADMIN_ROLE) {
        subscriptionId = _subscriptionId;
    }

    /// @notice Update the JavaScript source code.
    function setSource(string calldata _source) external onlyRole(ADMIN_ROLE) {
        source = _source;
    }

    /// @notice Update the callback gas limit.
    function setCallbackGasLimit(uint32 _callbackGasLimit) external onlyRole(ADMIN_ROLE) {
        callbackGasLimit = _callbackGasLimit;
    }

    // ──────────────────────────────── Internal ──────────────────────────────

    /// @dev Convert uint256 to string for passing as Chainlink Functions argument.
    function _uint2str(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits--;
            buffer[digits] = bytes1(uint8(48 + (value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
