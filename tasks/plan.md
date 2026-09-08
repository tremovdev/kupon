# Implementation Plan: Kupon (ETHOnline Phase 1)

> Approved spec: [SPEC.md](../SPEC.md) (canonical) · capability map: [CAPABILITY-MAP.md](../CAPABILITY-MAP.md)
> Deadline anchors: **Gate 1 = Sun Sep 6 EOD** (skeleton end-to-end on testnet) · scope freeze **Thu** Sep 10 night · submit target Sat Sep 12.
> **Fixed dates (WIB):** Check-in #1 dashboard — Tue Sep 8, 10:59 · **Feedback session — Thu Sep 10, 20:00 (attend)** · Check-in #2 — Fri Sep 11, 10:59 · weekly X artifact + mentor check-in — Sun Sep 6 (Gate 1 day).

## Overview

Build a compliance-gated RWA token demo: three contracts (claim registry, compliance module, gated token), a three-page SE2 frontend (Investor / Registrar / Regulator view), deployed and verified on Base + Arbitrum Sepolia, with core-path tests and 3 JS-seeded fuzz invariants. Sliced so the Gate-1 critical path (foundation → minimal investor UI → Base Sepolia deploy) lands by Sunday EOD.
Build sessions follow workspace `AGENTS.md` skill routing: ethskills for EVM-domain decisions (security/testing/gas), agent-skills for process, impeccable for UI.

## Architecture Decisions

- Simplified identity: single `KuponClaimRegistry` mapping (address → claims) with `REGISTRAR_ROLE` — deliberate ERC-3643 simplification, disclosed.
- Compliance enforced in `KuponToken._update` via `KuponComplianceModule.enforceTransfer` — holds for any caller (incl. `transferFrom`).
- Reverts carry `Kupon__RuleViolated(ruleId)`; UI maps ruleId → plain-language policy text.
- Fuzz = JS-seeded loops in Hardhat (seed committed), Foundry deferred to Phase 2.
- All demo roles granted to one deployer EOA at deploy (threat-model limitation, documented).

## Dependency Graph

```
T0 env prep (faucet gas + explorer API keys) ──▶ T9 / T10
T1 Registry ──▶ T2 ComplianceModule ──▶ T3 KuponToken ──▶ T5 deploy script/config ──▶ T9 Base Sepolia deploy + Vercel wiring
                     │                        │                                          (GATE 1 ✔)
                     │                        ├──▶ T4 fuzz invariants (can slip past Gate 1)
                     │                        └──▶ T6 Investor UI ──┐
                     └──────────────────────────────────▶ T7 Registrar UI ├──▶ T10 Arbitrum deploy
                                                          └▶ T8 Regulator view ──▶ T11 threat model/diagram/README
T12 demo rehearsal + submission checklist (after all)
```

## Task List

### Phase 0 — Environment prep (Sat)

- [ ] **Task 0: Environment prep** — fund the work wallet via faucets (Base Sepolia + Arbitrum Sepolia test ETH); create Basescan + Arbiscan API keys into the gitignored local `.env`. Faucets can lag — do this first, not right before deploying.
  - Acceptance: deployer wallet holds gas on both chains; keys present locally, never committed.
  - Verify: balance check on both explorers · Files: none (wallet + local `.env`) · Size: S
### Phase 1 — Compliance foundation (Fri–Sat)

- [x] **Task 1: KuponClaimRegistry** — claims mapping (`RESIDENCY_ID`, `ACCREDITED`), `REGISTRAR_ROLE` grant/revoke, `ClaimGranted`/`ClaimRevoked` events, custom errors.
  - Acceptance: grant/revoke work; only registrar can modify; granting twice is a no-op; events emitted.
  - Verify: `yarn test --grep Registry` · Files: `contracts/KuponClaimRegistry.sol`, `test/KuponRegistry.t.sol` · Size: S
- [x] **Task 2: KuponComplianceModule** — `enforceTransfer(from,to,value)` implementing R1-RESIDENCY / R2-CAP / R3-FROZEN, reverts `Kupon__RuleViolated(ruleId)`; CAP configurable by `COMPLIANCE_ADMIN_ROLE`.
  - Acceptance: each rule blocks with correct ruleId; cap boundary exact=pass/+1=revert; non-admin cannot change CAP.
  - Verify: `yarn test --grep Compliance` · Files: `contracts/KuponComplianceModule.sol`, `test/KuponCompliance.t.sol` · Size: M
- [x] **Task 3: KuponToken** — OZ ERC20, `_update` hook → compliance; `ISSUER_ROLE issue()` with 100k series cap, passing the same gate.
  - Acceptance: compliant transfer passes; each rule revert surfaces via token; `issue` to non-compliant reverts; series cap enforced; `transferFrom` obeys identical rules.
  - Verify: `yarn test --grep KuponToken` · Files: `contracts/KuponToken.sol`, `test/KuponToken.t.sol`, `contracts/mocks`(if needed) · Size: M
- [x] **Task 4: Fuzz invariants** — 3 JS-seeded loops (±200 runs): no-claim-recipient · retail-CAP never breached · no approve/transferFrom bypass. Seed committed.
  - Acceptance: all 3 invariants hold across runs; seed reproduces.
  - Verify: `yarn test --grep fuzz` · Files: `test/Kupon.fuzz.t.sol` · Size: S

**Checkpoint A (Gate-1 critical):** `yarn compile` + full `yarn test` green; local deploy succeeds. [DONE]

### Phase 2 — Frontend (Sat–Sun)

- [x] **Task 5: Deploy script + SE2 contract wiring** — replace scaffold contract; external-contract/deployed-contracts config so SE2 hooks generate; local deploy verified.
  - Acceptance: `yarn deploy` on local chain registers Kupon + Registry; SE2 debug page reads token data.
  - Verify: manual on `yarn start` · Files: `packages/hardhat/deploy/*`, config · Size: S
- [x] **Task 6: Investor page** — balance, send form, receive; reverts translated to plain-language policy via ruleId; blocked-wallet state visible. *(minimal version = Gate 1 skeleton)*
  - Acceptance: send from compliant wallet succeeds on testnet; blocked wallet sees named rule, not raw error.
  - Verify: manual against local + testnet · Files: `packages/nextjs/app/page.tsx` (+components) · Size: M
- [x] **Task 7: Registrar page** — grant/revoke claims, issue tokens; role-gated UI (shows address status).
  - Acceptance: registrar grants claim → investor retry succeeds end-to-end on testnet.
  - Verify: manual two-browser flow · Files: `packages/nextjs/app/registrar/page.tsx` · Size: M
- [x] **Task 8: Regulator view** — claim events feed, wallet × rule matrix, transfer simulation (eth_call) with rule verdict.
  - Acceptance: the 4-act demo is fully narrated from this page.
  - Verify: manual demo run-through · Files: `packages/nextjs/app/regulator/page.tsx` · Size: M

**Checkpoint B:** 4-act demo passes on local chain; two-browser flow recorded once as rehearsal. [DONE]

### Phase 3 — Infra & ship prep (Sun–Thu)

- [x] **Task 9: Base Sepolia deploy + Vercel wiring** — deploy, verify on Basescan, set `targetNetworks` to baseSepolia in `scaffold.config.ts` (SE2 defaults to mainnet), point Vercel env at testnet contracts. Requires Task 0. *(GATE 1: this + Task 5 + minimal Task 6 by Sun EOD)*
  - Acceptance: contract verified on Basescan; live Vercel reads/writes Base Sepolia (not mainnet, not localhost).
  - Verify: explorer link + live-site transaction · Files: deploy config, `scaffold.config.ts`, `.env` (local) · Size: S
- [ ] **Task 10: Arbitrum Sepolia deploy + verify** — same policy, both chains.
  - Acceptance: verified on Arbiscan; identical rule behavior.
  - Verify: explorer link · Size: S
- [x] **Task 11: Tests-docs finalize** — threat model 1-page, architecture diagram, README build-log update + citations, `FEEDBACK.md` (Uniswap) if applicable.
  - Acceptance: SPEC success-criteria README items all checked.
  - Verify: checklist walk · Size: M
- [ ] **Task 12: Demo rehearsal + submission** — clean-device rehearsal, record video (2–4 min, own voice ≥720p), submission form + ≤3 prizes.
  - Acceptance: video passes ETHGlobal rules checklist; form fields from `ethglobal/submission-drafts.md` finalized.
  - Verify: external review by Harry before upload · Size: S

**Checkpoint C (freeze Thu night):** everything in SPEC success-criteria checked or consciously descoped.

**Deferred by default — pull-forward rule (SPEC):** Privy embedded wallets (S) and the Uniswap v4 compliance hook (M) become eligible ONLY after the core is locked and Gate 1 has passed; each may be pulled in as T13 with explicit Harry sign-off during the Mon–Wed window, and dropped without ceremony if hours run short.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `keccak` native build warning breaks `yarn test` | High | First test run = canary (Task 1); fallback: reinstall with build tools / pin prebuilt binary |
| SE2 hook generation needs specific deploy config | Med | Task 5 isolated early; fallback: use external-contracts mode |
| Part-time hours vs Gate 1 (Sun EOD) | High | Critical path marked (T1→T2→T3→T5→T6-min→T9); T4/T7/T8 may slip to Mon/Tue without breaking Gate 1 |
| Explorer verification API hiccups | Low | Retry/queue; verification is not block-progress-critical |
| Scope creep during build | High | Boundaries in SPEC; new ideas → notes file, decide at freeze |

## Open Questions

- None blocking — CAP/issuance numbers tunable until freeze (per SPEC).
