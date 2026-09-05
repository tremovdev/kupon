# Spec: Kupon — Compliance-Gated RWA Token (ETHOnline Phase 1)

> PRD v1 — Sep 5, 2026. Written AI-assisted via a spec-driven workflow; this file is committed as evidence under ETHGlobal's AI-attribution rule. **Bahasa Indonesia: [`SPEC-ID.md`](./SPEC-ID.md)** — in case of divergence, this English version is canonical.

Locked decisions: simplified registry (not full ONCHAINID) · single tiered token · "Kupon SBN Ritel 2027 / KPON" · JS-seeded fuzz in Hardhat.

## Objective

Kupon is a compliance-enforced RWA tokenization demo: a **fictional** Indonesian retail government bond ("SBN Ritel 2027") issued as an ERC-3643-style permissioned token where compliance is enforced by the contract at the transfer level — not by the UI.

**Personas:** (1) **Investor** — a wallet holder receiving/sending KPON; (2) **Registrar** — the issuer granting/revoking identity claims and issuing tokens; (3) **Regulator/observer** — reading a rule-by-rule audit trail.

**Success =** the 4-act demo runs smoothly on testnet + a complete submission before Sep 13, 23:00 WIB:

1. A wallet without the required claim tries to receive KPON → the transfer **reverts, naming the violated rule** (R1-RESIDENCY)
2. The registrar grants the residency claim → the retry succeeds
3. The retail cap is proven live (R2-CAP); accredited wallets are cap-exempt
4. The regulator view shows the audit trail; revoking a claim freezes the wallet (R3-FROZEN)

**Why Indonesia, why now:** Indonesia's financial regulator (OJK) is scheduled to publish its real-world-asset tokenization rulebook by Q3 2026 (Kontan, Jun 8 2026) — this sprint lands in that exact quarter. Full citations (UU P2SK, POJK 27/2024, POJK 23/2025) live in the README.

## Tech Stack

- **Scaffold-ETH 2** (bootstrapped via `create-eth`; Hardhat + Next.js + wagmi/viem), Solidity ≥0.8.20, OpenZeppelin Contracts (ERC20, AccessControl)
- Yarn 4 workspaces: `packages/hardhat`, `packages/nextjs`
- Dev network: local Hardhat node → deploy targets: **Base Sepolia + Arbitrum Sepolia**
- Out of scope for Phase 1 (deferred per plan): Privy embedded wallets, Uniswap v4 hook, Foundry, ERC-4626/NAV

## Commands

```
Dev chain : yarn chain
Compile   : yarn compile
Test      : yarn test                      # packages/hardhat
Deploy    : yarn deploy --network baseSepolia | arbitrumSepolia
Frontend  : yarn start
```

## Project Structure

```
packages/hardhat/contracts/
  KuponToken.sol            # ERC20 + compliance hook in _update
  KuponClaimRegistry.sol    # address → claims; REGISTRAR_ROLE grant/revoke; audit events
  KuponComplianceModule.sol # the 3 named rules; admin: COMPLIANCE_ADMIN_ROLE
packages/hardhat/test/      # Kupon.core.t.sol + Kupon.fuzz.t.sol (JS-seeded)
packages/nextjs/app/
  page.tsx                  # Investor: balance, send (revert → plain-language rule), receive
  registrar/page.tsx        # Grant/revoke claims, issue() to compliant wallets
  regulator/page.tsx        # Audit trail: events + wallet × rule matrix + eth_call simulation
```

## Code Style

Solidity 0.8.x; natspec `@title/@notice/@param` required on all public contracts; custom errors `Kupon__<Reason>` carrying a `ruleId`:

```solidity
/// @notice Transfer-level compliance hook — mirrors the ERC-3643 T-REX pattern (simplified).
function _update(address from, address to, uint256 value) internal override {
    if (from != address(0) && to != address(0)) {
        _compliance.enforceTransfer(from, to, value); // revert Kupon__RuleViolated(ruleId)
    }
    super._update(from, to, value);
}
```

Frontend: SE2 conventions (built-in `useScaffoldReadContract` etc.), small components, no extra state manager.

## Compliance Rules (3 named rules — mapped to real policy)

| Rule id | Demo policy name | Mechanics |
|---|---|---|
| `R1-RESIDENCY` | WNI gate (retail tranche) | Recipient **and** sender must hold a `RESIDENCY_ID` **or** `ACCREDITED` claim |
| `R2-CAP` | Retail per-investor cap | Wallets holding `RESIDENCY_ID` only: `balanceAfter ≤ CAP` (default 5,000 KPON, configurable) |
| `R3-FROZEN` | Post-revocation freeze | A revoked claim freezes the balance; transfers in/out are rejected |

Minting is restricted to `ISSUER_ROLE` via `issue(to, amount)` — passing through the same compliance checks; total issuance capped at 100,000 KPON (series cap). Claims: `RESIDENCY_ID`, `ACCREDITED` (bytes32, keccak). **Simplification disclosure:** identity is a single registry mapping (not a per-wallet ONCHAINID contract) — stated plainly in the README.

## Testing Strategy

- **Core paths** (Hardhat + chai): issue ok/blocked, per-rule transfer allow/block, cap boundary (exact = ok, +1 = revert), grant→unblock, revoke→freeze, role guards.
- **3 fuzz invariants** (JS-seeded, ±200 runs each, seed committed for reproducibility):
  1. No transfer ever succeeds to a wallet lacking the required claim
  2. A retail wallet's balance never exceeds CAP through any transfer combination
  3. `transferFrom`/approve obey the same rules (no alternative-path bypass)
- Coverage: 100% on compliance core paths; deliberately no total-coverage target (stated honestly in README).

## Boundaries

- **Always:** tests pass before commit · natspec everywhere · disclose every reference · reverts carry ruleId · granular commits
- **Ask first:** new dependencies · changing claim/registry structure · adding a 4th rule · changing CAP/issuance values
- **Never:** commit secrets/`.env*` · claim the token is a real SBN · remove failing tests without approval · mint to non-compliant wallets (issuance passes the same gate)

## Success Criteria (testable)

- [ ] The 4-act demo runs on Base Sepolia without failure (recorded → video)
- [ ] Reverts always carry a ruleId; the UI translates it into policy language
- [ ] Regulator view shows: claim events, per-wallet rule matrix, transfer simulation results
- [ ] Contracts verified on Base Sepolia **and** Arbitrum Sepolia; identical policy on both chains
- [ ] 3 fuzz invariants pass (reproducible seed); core tests pass locally
- [ ] README: architecture diagram + 1-page threat model + cited "Why Indonesia, why now" + disclosures (OZ, ERC-3643 reference, registry simplification) + fictional-asset disclaimer
- [ ] All specs/prompts committed; commit author `tremov`

## Open Questions

- CAP 5,000 KPON and 100,000 issuance are demo numbers; Harry may tune them any time before the Sep 10 freeze
- Registrar key = a second demo EOA (not a multisig) — sufficient for a demo; recorded as a limitation in the threat model
