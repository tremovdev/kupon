# Kupon — Task List

> Source of truth: [plan.md](./plan.md). Mark `[x]` when acceptance + verification both pass.

## Phase 1 — Compliance foundation (Fri–Sat)

- [ ] Task 1: KuponClaimRegistry — claims, roles, events (S)
- [ ] Task 2: KuponComplianceModule — R1/R2/R3 with ruleIds (M)
- [ ] Task 3: KuponToken — gated ERC20 + issue() (M)
- [ ] Task 4: 3 JS-seeded fuzz invariants (S) *— may slip past Gate 1*

**Checkpoint A:** compile + full test suite green; local deploy OK.

## Phase 2 — Frontend (Sat–Sun)

- [ ] Task 5: Deploy script + SE2 contract wiring (S)
- [ ] Task 6: Investor page — minimal = Gate 1 skeleton (M)
- [ ] Task 7: Registrar page (M)
- [ ] Task 8: Regulator view (M)

**Checkpoint B:** 4-act demo passes locally.

## Phase 3 — Infra & ship prep (Sun–Wed)

- [ ] Task 9: Base Sepolia deploy + Vercel wiring — **GATE 1 with T5 + T6-min (S)**
- [ ] Task 10: Arbitrum Sepolia deploy + verify (S)
- [ ] Task 11: Threat model + diagram + README build-log + FEEDBACK.md (M)
- [ ] Task 12: Demo rehearsal + video + submission (S)

**Checkpoint C:** SPEC success criteria checked or consciously descoped (freeze Wed night).
