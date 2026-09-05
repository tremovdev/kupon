// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice Minimal read surface the compliance module needs from {KuponClaimRegistry}.
interface IKuponClaimRegistry {
    function hasClaim(address account, bytes32 claim) external view returns (bool);
}

/// @title KuponComplianceModule
/// @notice The three named transfer rules of the Kupon demo, each reverting with an
/// explicit rule id so the UI can translate a revert into policy language:
///
/// - R1-RESIDENCY: a wallet may only RECEIVE while it holds `RESIDENCY_ID` or `ACCREDITED`
///   (also gates mints — issuance passes the same gate).
/// - R2-CAP: a retail wallet (holds `RESIDENCY_ID` but not `ACCREDITED`) may never hold
///   more than `cap`; accredited wallets are exempt.
/// - R3-FROZEN: a wallet may only SEND while it holds at least one claim. Revoking a
///   wallet's last claim therefore freezes its balance, and re-granting instantly
///   unfreezes it — the state is derived live from the registry on every check, there is
///   deliberately no cached freeze flag.
///
/// @dev `enforceTransfer` is a pure rule evaluation over live registry state, so anyone
/// (e.g. the regulator view) can simulate a transfer off-chain via `eth_call`.
contract KuponComplianceModule is AccessControl {
    /// @notice Configures the retail cap.
    bytes32 public constant COMPLIANCE_ADMIN_ROLE = keccak256("COMPLIANCE_ADMIN_ROLE");

    /// @notice Claim keys queried from the registry — same keccak values as {KuponClaimRegistry}.
    bytes32 public constant RESIDENCY_ID = keccak256("RESIDENCY_ID");
    bytes32 public constant ACCREDITED = keccak256("ACCREDITED");

    /// @notice Rule ids carried by {Kupon__RuleViolated} — keccak of the demo policy names.
    bytes32 public constant R1_RESIDENCY = keccak256("R1-RESIDENCY");
    bytes32 public constant R2_CAP = keccak256("R2-CAP");
    bytes32 public constant R3_FROZEN = keccak256("R3-FROZEN");

    /// @notice A transfer violated the named rule.
    /// @param ruleId The violated rule (R1_RESIDENCY, R2_CAP, or R3_FROZEN).
    error Kupon__RuleViolated(bytes32 ruleId);

    /// @notice Emitted when the retail cap changes.
    event CapChanged(uint256 oldCap, uint256 newCap);

    IKuponClaimRegistry private immutable _registry;

    uint256 public cap;

    /// @param registry The live claims registry compliance reads on every check.
    /// @param admin Account receiving COMPLIANCE_ADMIN_ROLE (the deployer in this demo).
    constructor(address registry, address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(COMPLIANCE_ADMIN_ROLE, admin);
        _registry = IKuponClaimRegistry(registry);
        // 1 KPON = 1 bond = Rp1,000,000 nominal, decimals 18 → default cap 5,000 KPON.
        cap = 5_000 * 10 ** 18;
    }

    /// @notice Updates the retail per-investor holding cap (applies immediately, live).
    /// @param newCap The new cap in token base units (decimals 18).
    function setCap(uint256 newCap) external onlyRole(COMPLIANCE_ADMIN_ROLE) {
        emit CapChanged(cap, newCap);
        cap = newCap;
    }

    /// @notice Reverts unless transferring `value` from `from` to `to` satisfies all rules.
    /// @param from The sender, or address(0) for a mint (issuance gate).
    /// @param to The recipient.
    /// @param value The amount being transferred, in token base units.
    /// @param toBalance The recipient's balance BEFORE the transfer (`balanceOf(to)`),
    /// supplied by the token so this module never needs a token binding.
    function enforceTransfer(address from, address to, uint256 value, uint256 toBalance) external view {
        bool toHasResidency = _registry.hasClaim(to, RESIDENCY_ID);
        bool toIsAccredited = _registry.hasClaim(to, ACCREDITED);

        // R1-RESIDENCY: the recipient needs an entry claim (mints included, from == 0).
        if (!toHasResidency && !toIsAccredited) {
            revert Kupon__RuleViolated(R1_RESIDENCY);
        }

        // R3-FROZEN: the sender must still hold a claim (revoked last claim = frozen).
        if (from != address(0) && !_registry.hasClaim(from, RESIDENCY_ID) && !_registry.hasClaim(from, ACCREDITED)) {
            revert Kupon__RuleViolated(R3_FROZEN);
        }

        // R2-CAP: retail wallets (residency but not accredited) are capped; accredited exempt.
        if (toHasResidency && !toIsAccredited && toBalance + value > cap) {
            revert Kupon__RuleViolated(R2_CAP);
        }
    }
}
