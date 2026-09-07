# Implementation Plan: Partner Integrations (Privy, World ID, The Graph)

> Document: `tasks/plan-partners.md` — Sep 7, 2026.
> Specification: `SPEC-PARTNERS.md`
> Capability Map: `CAPABILITY-MAP.md`

---

## 1. Overview & Build Order

This plan breaks down the integration of three ETHOnline 2026 ecosystem partners into discrete, verifiable tasks with zero changes to verified smart contracts on Base Sepolia.

Build Order:
1. **Task P1: `partner-privy`** — Embedded Web3 onboarding on `/app` & navbar (Email/Social login).
2. **Task P2: `partner-world`** — Proof of Personhood certification on `/registrar` (World ID IDKit).
3. **Task P3: `partner-thegraph`** — Event indexing subgraph on Base Sepolia + `/regulator` GraphQL query service.
4. **Task P4: Submission Form Answers & Documentation** — Complete answers, line-of-code URLs, ratings, and sponsor feedback for the ETHGlobal dashboard.

---

## 2. Task Breakdown

### Task P1: `partner-privy` (Investor Desk & Navigation)
- [ ] **P1.1: Dependency & Config Setup**
  - Install or configure `@privy-io/react-auth` / custom safe wrapper in `packages/nextjs`.
  - Add `NEXT_PUBLIC_PRIVY_APP_ID` environment definition in `.env.example` with fallback demo App ID.
- [ ] **P1.2: UI Components**
  - Create `packages/nextjs/components/auth/PrivyLoginModal.tsx` and `PrivyAuthButton.tsx` adhering to the Sovereign Certificate palette (`#0E5E4A`, `#C9A227`, `#FAF6EC`).
  - Add a dedicated "Instant Investor Onboarding (Email/Google via Privy)" banner on the Primary Market desk (`/app`) and a secondary login action in the navbar drawer.
- [ ] **P1.3: Verification**
  - Test modal opening and login trigger.
  - Verify `yarn check-types` and `yarn build` succeed without SSR hydration mismatch.

---

### Task P2: `partner-world` (Registrar Desk)
- [ ] **P2.1: World ID Component**
  - Create `packages/nextjs/components/registrar/WorldIDVerificationButton.tsx` utilizing `@worldcoin/idkit` (or compatible cloud staging simulator handler).
  - Configure App ID (`app_staging_kupon_rwa`) and Action ID (`verify-residency-ksei`).
- [ ] **P2.2: Registrar Workflow Wiring**
  - Wire verification state into `packages/nextjs/app/registrar/page.tsx`.
  - Before granting `RESIDENCY_ID` claim, require the registrar/investor to pass World ID verification.
  - Show green "Human Verified via World ID ✓" seal and unlock the `Grant RESIDENCY_ID Claim` onchain action.
- [ ] **P2.3: Verification**
  - Verify the simulator flow unlocks the grant button.
  - Verify static build (`yarn build`) passes.

---

### Task P3: `partner-thegraph` (Regulator Terminal)
- [ ] **P3.1: Subgraph Manifest & Schema**
  - Create `packages/subgraph/` structure.
  - Add `subgraph.yaml` mapping `KuponClaimRegistry` (`0xd473...`) and `KuponToken` (`0x65c5...`) on `base-sepolia`.
  - Add `schema.graphql` defining `ClaimEvent`, `TransferEvent`, and `InvestorState`.
  - Add `src/mapping.ts` event handlers.
  - Add ABIs in `packages/subgraph/abis/`.
- [ ] **P3.2: Frontend GraphQL Service**
  - Create `packages/nextjs/services/thegraph/client.ts` with GraphQL queries for `ClaimEvents` and `TransferEvents`.
  - Connect to `/regulator` event stream with graceful fallback to `publicClient.getContractEvents`.
- [ ] **P3.3: Verification**
  - Validate subgraph manifest and schema syntax.
  - Verify `/regulator` renders telemetry records fetched via the GraphQL service.

---

### Task P4: Submission Readiness & ETHGlobal Partner Form Answers
- [ ] **P4.1: Draft Form Content**
  - Create `docs/partner-submissions.md` containing all required fields for the 3 prizes:
    - *How are you using this Protocol / API?* (2-3 sentences with clear narrative value)
    - *Link to the line of code where the tech is used* (GitHub permanent permalinks)
    - *Ease of use rating (1-10)*
    - *Additional feedback for the sponsor* (actionable developer experience feedback)
- [ ] **P4.2: Update README & Disclosures**
  - Update `README.md` to disclose Privy, World ID, and The Graph under the Integrations section.
  - Commit all changes with granular, authored commits.
