// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title KuponClaimRegistry
/// @notice Address-to-claims registry for the Kupon token — a deliberately simplified
/// ERC-3643 (T-REX) identity: a single mapping instead of per-wallet ONCHAINID contracts.
/// Compliance reads these claims live on every transfer; revoking a claim instantly
/// freezes the wallet, re-granting it instantly unfreezes.
/// @dev Only the two known claim types can be granted, so a typo can never create a
/// claim the compliance module silently ignores.
contract KuponClaimRegistry is AccessControl {
    /// @notice Manages claim grants and revocations.
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    /// @notice Indonesian residency claim — required for the retail tranche (R1-RESIDENCY).
    bytes32 public constant RESIDENCY_ID = keccak256("RESIDENCY_ID");
    /// @notice Accredited/institutional investor claim — exempt from the retail cap (R2-CAP).
    bytes32 public constant ACCREDITED = keccak256("ACCREDITED");

    /// @notice The claim type is not one of the known claims (RESIDENCY_ID, ACCREDITED).
    error Kupon__InvalidClaim(bytes32 claim);

    /// @notice Emitted when `account` gains `claim`.
    event ClaimGranted(address indexed account, bytes32 indexed claim);
    /// @notice Emitted when `account` loses `claim`.
    event ClaimRevoked(address indexed account, bytes32 indexed claim);

    mapping(address account => mapping(bytes32 claim => bool)) private _claims;

    /// @param registrar Account receiving REGISTRAR_ROLE and the admin role over it.
    constructor(address registrar) {
        _grantRole(DEFAULT_ADMIN_ROLE, registrar);
        _grantRole(REGISTRAR_ROLE, registrar);
    }

    /// @notice Grants `claim` to `account`.
    /// @return granted False if the claim was already held (no-op, no event).
    function grantClaim(address account, bytes32 claim) external onlyRole(REGISTRAR_ROLE) returns (bool granted) {
        _requireKnownClaim(claim);
        if (_claims[account][claim]) {
            return false;
        }
        _claims[account][claim] = true;
        emit ClaimGranted(account, claim);
        return true;
    }

    /// @notice Revokes `claim` from `account`, freezing it for compliance purposes.
    /// @return revoked False if the claim was not held (no-op, no event).
    function revokeClaim(address account, bytes32 claim) external onlyRole(REGISTRAR_ROLE) returns (bool revoked) {
        _requireKnownClaim(claim);
        if (!_claims[account][claim]) {
            return false;
        }
        _claims[account][claim] = false;
        emit ClaimRevoked(account, claim);
        return true;
    }

    /// @notice Whether `account` currently holds `claim`. Always reflects live registry state.
    function hasClaim(address account, bytes32 claim) public view returns (bool) {
        return _claims[account][claim];
    }

    function _requireKnownClaim(bytes32 claim) private pure {
        if (claim != RESIDENCY_ID && claim != ACCREDITED) {
            revert Kupon__InvalidClaim(claim);
        }
    }
}
