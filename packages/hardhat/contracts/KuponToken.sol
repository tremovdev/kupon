// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

/// @notice Minimal read surface the token needs from {KuponComplianceModule}.
interface IKuponCompliance {
    function enforceTransfer(address from, address to, uint256 value, uint256 toBalance) external view;
}

/// @title KuponToken
/// @notice KPON — the compliance-gated ERC-3643-style token for the fictional
/// "Kupon SBN Ritel 2027" series. Every real transfer is checked against the
/// compliance module inside `_update`, so no caller (including `transferFrom`
/// operators) can bypass the rules. Compliance failures revert with the violated
/// rule id, which the UI translates into plain-language policy.
/// @dev Demo centralization by design: the deployer EOA holds every role
/// (recorded as a limitation in the threat model).
contract KuponToken is ERC20, AccessControl {
    /// @notice Mints new KPON via {issue}.
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");

    /// @notice Maximum total issuance for this series: 100,000 KPON (1 KPON = 1e18 base units).
    uint256 public constant SERIES_CAP = 100_000 * 10 ** 18;

    /// @notice Issuing `requested` would push total supply past the series cap.
    /// @param totalSupply Supply before the attempted issuance.
    /// @param requested The attempted issuance amount.
    error Kupon__SeriesCapExceeded(uint256 totalSupply, uint256 requested);

    IKuponCompliance private immutable _compliance;

    /// @param compliance The compliance module enforcing the three transfer rules.
    /// @param admin Account receiving DEFAULT_ADMIN_ROLE and ISSUER_ROLE (the deployer).
    constructor(address compliance, address admin) ERC20("Kupon SBN Ritel 2027", "KPON") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
        _compliance = IKuponCompliance(compliance);
    }

    /// @notice Issues (mints) `amount` KPON to `to`, passing the same compliance gate
    /// as transfers — issuance to non-compliant or over-cap wallets reverts with a rule id.
    /// @param to The wallet receiving the newly minted KPON.
    /// @param amount The amount to mint, in token base units.
    function issue(address to, uint256 amount) external onlyRole(ISSUER_ROLE) {
        _compliance.enforceTransfer(address(0), to, amount, balanceOf(to));
        uint256 supplyBefore = totalSupply();
        if (supplyBefore + amount > SERIES_CAP) {
            revert Kupon__SeriesCapExceeded(supplyBefore, amount);
        }
        _mint(to, amount);
    }

    /// @notice Transfer-level compliance hook — mirrors the ERC-3643 T-REX pattern (simplified).
    /// Mints and burns bypass the module here; issuance is gated inside {issue} instead,
    /// keeping the mint path under ISSUER_ROLE control.
    function _update(address from, address to, uint256 value) internal override {
        if (from != address(0) && to != address(0)) {
            _compliance.enforceTransfer(from, to, value, balanceOf(to));
        }
        super._update(from, to, value);
    }
}
