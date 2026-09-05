# Kupon 🏛️

> **Tokenized Indonesian retail bonds where every transfer obeys on-chain compliance.**
> A compliance-gated RWA token demo — built from scratch at ETHGlobal ETHOnline, Sep 4–13 2026.

[![Live Demo](https://img.shields.io/badge/live-kupon--rwa.vercel.app-blue)](https://kupon-rwa.vercel.app/) [![Spec](https://img.shields.io/badge/spec-SPEC.md-green)](./SPEC.md) · [Bahasa Indonesia](./SPEC-ID.md)

---

## Why Indonesia, why now

This quarter — **Q3 2026** — Indonesia's financial regulator (**OJK**) is scheduled to publish its rulebook for **real-world-asset tokenization**, completing the country's migration of digital-asset oversight into the securities perimeter:

- **UU P2SK** (Law No. 4/2023) — mandates the transfer of crypto oversight from commodity regulator Bappebti to the securities regulator
- **POJK 27/2024** — digital financial asset trading framework, effective Jan 10 2025 (amended by **POJK 23/2025**)
- **The transfer is complete** — OJK and Bappebti ended their transition MoU in 2026
- **The RWA tokenization rulebook** — targeted for publication at the latest in Q3 2026 *(Kontan, Jun 8 2026)*

Kupon demonstrates the primitive that rulebook will require on public chains: **identity-gated issuance and transfer** — a retail government bond ("SBN Ritel 2027", *fictional*) whose compliance lives in the contract, not the interface.

## How it works

Three contracts. Compliance is enforced **at the transfer level**, so it holds for any caller — not just our UI:

```
Registrar ──grant/revoke claims──▶ KuponClaimRegistry
                                         │
                                         │ reads live claims on every transfer
                                         ▼
Investor ──transfer──▶ KuponToken ──enforceTransfer──▶ KuponComplianceModule
                       (ERC-3643-style)                 R1-RESIDENCY · R2-CAP · R3-FROZEN
```

| Rule | Policy (demo) | Mechanics |
|---|---|---|
| `R1-RESIDENCY` | WNI gate (retail tranche) | Sender & recipient must hold a `RESIDENCY_ID` or `ACCREDITED` claim |
| `R2-CAP` | Retail per-investor cap | Retail wallets: balance ≤ 5,000 KPON (1 KPON = 1 bond = Rp1,000,000 nominal) |
| `R3-FROZEN` | Post-revocation freeze | Claim revoked → balance frozen; re-granting unfreezes instantly |

The demo follows **two wallets**: a non-compliant transfer *reverts naming the exact rule it violated*; the registrar grants the claim; the retry succeeds; the **regulator view** exposes the whole thing as a rule-by-rule audit trail.

## Status — build log

Honest progress, newest last. Everything below started at the Sep 4 kickoff (Classic "From Scratch" track):

- **Sep 4** — repo bootstrapped (Scaffold-ETH 2, Hardhat), env-secret guardrails, first deploys to Vercel
- **Sep 5** — PRD written via spec-driven workflow ([SPEC.md](./SPEC.md), [SPEC-ID.md](./SPEC-ID.md)), adversarial review pass, spec approved
- **Next** — `token-core` (TDD, 3 fuzz invariants) → Investor/Registrar/Regulator UI → Base Sepolia + Arbitrum Sepolia deploys

## Run locally

```bash
yarn install
yarn chain        # terminal 1 — local Hardhat network
yarn deploy       # terminal 2 — deploy contracts
yarn start        # terminal 3 — http://localhost:3000
yarn test         # hardhat test suite
```

Requires Node ≥ 20.18 and [Yarn](https://yarnpkg.com/getting-started/install). Explorer API keys (Basescan/Etherscan) go in a gitignored local `.env` — never committed.

## Disclosures

- **Boilerplate:** built on [Scaffold-ETH 2](https://github.com/scaffold-eth/scaffold-eth-2) (Next.js, Hardhat, wagmi/viem, RainbowKit).
- **Libraries:** [OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts) (ERC20, AccessControl).
- **Reference pattern:** [ERC-3643 / T-REX](https://eips.ethereum.org/EIPS/eip-3643) permissioned-token standard. This is a **re-implementation of the pattern, simplified**: identity is a single on-chain claim registry (not a full per-wallet ONCHAINID contract). Deliberate scope decision — see [SPEC.md](./SPEC.md).
- **AI-assisted development:** spec-driven workflow with Claude Code; all specs and prompts are committed to this repo; architecture, review, and final code are human-directed.

## Disclaimer

**"SBN Ritel 2027" is a fictional asset** created for demonstration only. No affiliation with Kemenkeu, OJK, DJPPR, or any government body. Nothing here is legal, financial, or investment advice.
