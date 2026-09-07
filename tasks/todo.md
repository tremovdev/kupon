# Kupon — Task List

> Source of truth: [plan.md](./plan.md). Mark `[x]` when acceptance + verification both pass.
> Fixed dates (WIB): Check-in #1 Tue Sep 8 10:59 · Feedback session Thu Sep 10 20:00 (attend) · Freeze Thu Sep 10 night · Check-in #2 Fri Sep 11 10:59 · weekly X artifact + mentor check-in Sun Sep 6.

## Phase 0 — Environment prep (Sat)

- [ ] Task 0: Faucet gas (Base + Arbitrum Sepolia) + explorer API keys (S)

## Phase 1 — Compliance foundation (Fri–Sat)

- [x] Task 1: KuponClaimRegistry — claims, roles, events (S)
- [x] Task 2: KuponComplianceModule — R1/R2/R3 with ruleIds (M)
- [x] Task 3: KuponToken — gated ERC20 + issue() (M)
- [x] Task 4: 3 JS-seeded fuzz invariants (S) — seed 20260906 committed

**Checkpoint A:** compile + full test suite green; local deploy OK.

## Phase 2 — Frontend (Sat–Sun)

- [x] Task 5: Deploy script + SE2 contract wiring (S)
- [x] Task 6: Investor page — minimal = Gate 1 skeleton (M)
- [x] Task 7: Registrar page (M)
- [x] Task 8: Regulator view (M)

**Checkpoint B:** 4-act demo passes locally.

## Phase 3 — Infra & ship prep (Sun–Thu)

- [x] Task 9: Base Sepolia deploy + Vercel wiring — **GATE 1 with T5 + T6-min (S)**
- [ ] Task 10: Arbitrum Sepolia deploy + verify (S)
- [ ] Task 11: Threat model + diagram + README build-log + FEEDBACK.md (M)
- [ ] Task 12: Demo rehearsal + video + submission (S)

## Phase B — Brand overhaul (T13, fresh session)

- [x] T13a Theme foundation + YourContract cleanup (S)
- [x] T13b Layout shell + navigation (/app, /debugger) (S)
- [x] T13c Landing page — narasi + stats live (M)
- [x] T13d Debugger page merge (S)
- [x] T13e Logo & asset integration (S) — kupon-logo.svg integrated into Header, Landing, Footer & metadata
- [ ] T13f QA + verify (S)

> Detail: [plan-brand-overhaul.md](./plan-brand-overhaul.md) · prompts logo: [../branding/logo-prompts.md](../branding/logo-prompts.md)


**Checkpoint C:** SPEC success criteria checked or consciously descoped (freeze Thu night).

*Deferred by default (pull-forward rule): Privy (S), Uniswap v4 hook (M) — only after core locked + Gate 1 passed, with explicit sign-off.*

## Phase P — Partner Integrations (ETHOnline Partner Prizes)

> Source of truth: [plan-partners.md](./plan-partners.md) and [../SPEC-PARTNERS.md](../SPEC-PARTNERS.md).

- [ ] Task P1: `partner-privy` — Embedded Social/Email Web3 Onboarding (S)
- [ ] Task P2: `partner-world` — Proof of Personhood Verification on Registrar Desk (S)
- [ ] Task P3: `partner-thegraph` — Subgraph Indexing on Base Sepolia + GraphQL Client (M)
- [ ] Task P4: Submission Form Answers & Documentation in `docs/partner-submissions.md` (S)
