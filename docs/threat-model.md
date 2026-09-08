# Kupon Threat Model & Security Invariants

> **Scope:** Kupon RWA Tokenization Protocol (ETHOnline Phase 1).  
> **Target Contracts:** `KuponToken.sol`, `KuponClaimRegistry.sol`, `KuponComplianceModule.sol`.  
> **Deployment:** Base Sepolia (`0x65c5...`, `0xf550...`, `0xd473...`).  
> **Standard Reference:** ERC-3643 (T-REX) Permissioned Token Pattern (Simplified).

---

## 1. System Overview & Asset Profile

Kupon models an institutional-grade sovereign retail bond (*SBN Ritel 2027*, fictional) issued on a public EVM ledger. Unlike permissionless ERC-20 tokens, every balance movement and issuance action must strictly satisfy statutory Indonesian financial regulations (UU P2SK, POJK 27/2024, and KSEI Single Investor Identification rules).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           TRUST BOUNDARIES                              │
│                                                                         │
│  [ Untrusted Public ]     [ Verified Citizen ]    [ Institutional Desk ]│
│         │                         │                        │            │
│         │ Web3 / EOA              │ Privy / Web3           │ Registrar  │
│         ▼                         ▼                        ▼            │
│  ┌───────────────┐        ┌───────────────┐        ┌─────────────────┐  │
│  │ Investor UI   │        │ Investor UI   │        │ Registrar Desk  │  │
│  │ (Uncertified) │        │ (Certified)   │        │ (World ID / SID)│  │
│  └───────┬───────┘        └───────┬───────┘        └────────┬────────┘  │
├──────────┼────────────────────────┼─────────────────────────┼───────────┤
│          │ RPC Boundary           │ RPC Boundary            │ Authority │
│          ▼                        ▼                         ▼           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                   ON-CHAIN VERIFIED PERIMETER                     │  │
│  │                                                                   │  │
│  │  KuponToken (ERC20) ────_update()────▶ KuponComplianceModule      │  │
│  │       │                                       │                   │  │
│  │       │                                       │ hasClaim()        │  │
│  │       │                                       ▼                   │  │
│  │       └──────────────────────────────▶ KuponClaimRegistry         │  │
│  │                                         (Identity State)          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Security Invariants

The protocol enforces five mathematically verifiable invariants across all execution paths:

| Invariant | Specification | Enforcement Point | Failure Result |
|---|---|---|---|
| **INV-1: WNI Residency Gate** | Neither sender nor recipient can participate in bond transfers unless both hold a valid `RESIDENCY_ID` or `ACCREDITED` claim. | `KuponComplianceModule.enforceTransfer()` | `revert Kupon__RuleViolated(R1-RESIDENCY)` |
| **INV-2: Retail Holding Cap** | An investor holding only `RESIDENCY_ID` can never hold more than `CAP` (default 5,000 KPON = Rp5 Billion). | `KuponComplianceModule.enforceTransfer()` | `revert Kupon__RuleViolated(R2-CAP)` |
| **INV-3: Sovereign Freeze** | An account with zero active claims cannot transmit tokens under any condition. | `KuponComplianceModule.enforceTransfer()` | `revert Kupon__RuleViolated(R3-FROZEN)` |
| **INV-4: No-Bypass Hook** | Transfers via `transfer()`, `transferFrom()`, automated contracts, or DEX routers must all evaluate identical rules. | `KuponToken._update()` override | Atomic revert before balance changes |
| **INV-5: Hard Series Ceiling** | Cumulative issued supply cannot exceed `SERIES_CAP` (100,000 KPON). | `KuponToken.issue()` | `revert Kupon__SeriesCapExceeded()` |

---

## 3. Threat Analysis & Attack Vectors

### 3.1. Alternative-Path Bypass (`transferFrom` / Approvals)
* **Threat:** An attacker uses `approve()` to grant an allowance to a smart contract or compliant intermediary, hoping `transferFrom()` skips the compliance hook.
* **Analysis & Mitigation:** Kupon overrides OpenZeppelin ERC-20 v5's internal `_update(address from, address to, uint256 value)` function. Since both `transfer()` and `transferFrom()` funnel directly through `_update()`, compliance is enforced universally at the bytecode level.
* **Verification:** Verified in unit test suite and JS-seeded fuzz invariant `inv-3-no-bypass` (seed `20260906`, 200 iterations passing).

### 3.2. Arithmetic Boundary & Overflow Attacks on Retail Cap
* **Threat:** An attacker with 4,999 KPON attempts to receive tokens via multiple concurrent transactions or high-value amounts that trigger integer overflow in the balance check.
* **Analysis & Mitigation:** 
  1. Solidity ≥0.8.20 provides built-in checked arithmetic (reverting on overflow/underflow).
  2. The compliance module employs an overflow-safe check:
     ```solidity
     if (value > currentCap || toBalance > currentCap - value) {
         revert Kupon__RuleViolated(RULE_R2_CAP);
     }
     ```
     This eliminates the possibility of `toBalance + value` overflowing before comparison.

### 3.3. Reentrancy & Cross-Contract State Pollution
* **Threat:** Malicious contract recipients exploit callbacks to re-enter `KuponToken` or alter claim state during transfer execution.
* **Analysis & Mitigation:** 
  1. `KuponComplianceModule` and `KuponClaimRegistry` are strictly stateless relative to balances; `enforceTransfer` is a `view` function that performs zero state writes and makes zero arbitrary external calls.
  2. `_update()` executes `enforceTransfer()` before invoking `super._update()`, guaranteeing an atomic revert before any balance manipulation.

### 3.4. Stale State & Race Conditions on Identity Revocation
* **Threat:** A sanctioned or non-compliant investor uses front-running or transaction batching to transfer tokens before a revocation takes effect.
* **Analysis & Mitigation:** Kupon does not use cached permissions or time-based expiry flags on the token contract. Every transfer synchronously executes `hasClaim()` against `KuponClaimRegistry` within the same execution frame. The instant `revokeClaim()` is mined, all outgoing and incoming transfers for that wallet fail immediately under `R1` or `R3`.

---

## 4. Trust Assumptions & Disclosed Limitations

As a hackathon demonstration of regulatory mechanics, Kupon consciously makes specific architectural simplifications:

### 4.1. Centralized Deployer Authority (Deliberate Demo Scope)
* **Status Quo:** The deployer EOA (`0x2b97bea17da0ff83fd95a73dc60881d5b27a2b9b`) holds all three operational roles:
  * `REGISTRAR_ROLE` on `KuponClaimRegistry`
  * `COMPLIANCE_ADMIN_ROLE` on `KuponComplianceModule`
  * `ISSUER_ROLE` on `KuponToken`
* **Risk:** Key compromise of the deployer EOA allows unauthorized claim grants, retail cap modifications, or bond issuance up to the series cap.
* **Production Path:** In production, roles would be segregated:
  * `REGISTRAR_ROLE` held by KSEI / Custodian Bank multi-sig with HSM integration.
  * `COMPLIANCE_ADMIN_ROLE` held by OJK / DJPPR regulatory timelock contract.
  * `ISSUER_ROLE` held by Ministry of Finance (Kemenkeu) sovereign minting contract.

### 4.2. Single Registry Mapping vs. Full ONCHAINID
* **Status Quo:** Identity claims are tracked in a single central mapping `mapping(address => mapping(bytes32 => bool)) claims` on `KuponClaimRegistry`, rather than deployable per-investor smart identity proxy contracts (ERC-734/ERC-735 / ONCHAINID standard).
* **Rationale:** A full ONCHAINID deployment requires deploying individual proxy contracts for every retail investor, incurring massive gas overhead unsuitable for mass retail bond distribution in Indonesia (20M+ target market). A single registry mapping accurately simulates KSEI Single Investor Identification (SID) with minimal gas costs.
* **Limitation:** Key recovery or wallet migration requires an administrative re-assignment by the registrar, rather than cryptographic identity claim management by the user.

### 4.3. Absence of On-Chain Personally Identifiable Information (Zero PII)
* **Status Quo:** Zero personal data (no KTP numbers, names, or physical addresses) is ever stored on-chain. Claims are stored strictly as 32-byte cryptographic hashes (`keccak256("RESIDENCY_ID")` and `keccak256("ACCREDITED")`).
* **Privacy Rationale:** Compliance with Indonesian PDP Law (UU Perlindungan Data Pribadi No. 27/2022). Off-chain registrars certify identity, while the smart contract verifies only the cryptographic validity of the entitlement claim.

### 4.4. Omission of Forced Transfers / Asset Recovery (Phase 1 Boundary)
* **Status Quo:** Standard ERC-3643 defines `forcedTransfer()` to allow authorities to recover assets in case of lost keys or court orders.
* **Decision:** `forcedTransfer()` was deliberately omitted from Phase 1. Giving an unaudited deployer EOA the unilateral ability to seize private balances would introduce an unacceptable backdoor risk for demo participants. Asset recovery is scheduled for Phase 2 under multi-party governance.

---

## 5. Summary Matrix for Hackathon Reviewers

```
┌──────────────────────────────────────────────────────────────────────────┐
│ PROPERTY                       │ STATUS       │ JUSTIFICATION            │
├────────────────────────────────┼──────────────┼──────────────────────────┤
│ Transfer Compliance Guarantee  │ Bytecode-Lev │ OZ _update hook prevents │
│                                │              │ any interface bypass     │
│ Zero-PII Privacy Posture       │ Guaranteed   │ keccak topic hashes only │
│ Reentrancy Resistance          │ Immunity     │ Pure view checks, no     │
│                                │              │ external execution hooks │
│ Math Overflow Guard            │ Checked      │ Solidity 0.8 + defensive │
│                                │              │ boundary logic           │
│ Centralization Exposure        │ Disclosed    │ Deployer EOA holds roles │
│                                │              │ for seamless live demo   │
└──────────────────────────────────────────────────────────────────────────┘
```
