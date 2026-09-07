# Spec: Kupon Partner Integrations (ETHOnline 2026)

> Document: `SPEC-PARTNERS.md` — Sep 7, 2026.
> Scope: 3 Partner Prizes (Privy, World ID, The Graph) without touching verified core smart contracts.
> Capability Map Ref: `CAPABILITY-MAP.md` (Modules: `partner-privy`, `partner-world`, `partner-thegraph`).

---

## 1. Objective

Kupon is a compliance-enforced sovereign retail bond demo on Base Sepolia. To qualify for ETHOnline 2026 Partner Prizes and strengthen our institutional narrative, we integrate three ecosystem partners without modifying or redeploying the core verified contracts (`0x65c5...`):

1. **Privy (`partner-privy`):** Streamline the retail investor experience on `/app`. Eliminate the Web3 onboarding barrier (MetaMask extension + initial gas purchase) by offering 1-click social/email login with an embedded wallet.
2. **World ID (`partner-world`):** Enhance the Registrar certification desk on `/registrar`. Before granting the sovereign `RESIDENCY_ID` claim to an investor, the registrar validates the user's Proof of Personhood via World ID (`IDKitWidget`), ensuring 1-human-1-citizen compliance.
3. **The Graph (`partner-thegraph`):** Provide an immutable, high-speed regulatory audit trail for `/regulator`. Index `ClaimGranted`, `ClaimRevoked`, and `Transfer` events from Base Sepolia via a dedicated Kupon Subgraph, exposing a clean GraphQL API.

---

## 2. Architecture & Zero-Overhaul Invariant

The core contracts (`KuponToken`, `KuponClaimRegistry`, `KuponComplianceModule`) remain untouched at their verified Base Sepolia deployment addresses. All partner integrations layer seamlessly onto the presentation, authentication, and indexing tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KUPON INSTITUTIONAL TIOR                        │
├──────────────────┬──────────────────────────┬──────────────────────────┤
│ 1. INVESTOR      │ 2. REGISTRAR             │ 3. REGULATOR             │
│    (/app)        │    (/registrar)          │    (/regulator)          │
├──────────────────┼──────────────────────────┼──────────────────────────┤
│ Partner: PRIVY   │ Partner: WORLD ID        │ Partner: THE GRAPH       │
│ Embedded wallet, │ Proof of Personhood /    │ Subgraph query untuk     │
│ 1-click login    │ verification before      │ audit trail real-time &  │
│ email/Google     │ granting KSEI SID claim  │ compliance telemetry     │
├──────────────────┼──────────────────────────┼──────────────────────────┤
│ packages/nextjs  │ packages/nextjs          │ packages/subgraph +      │
│ (components/auth)│ (/registrar/page.tsx)    │ (/regulator/page.tsx)    │
└──────────────────┴──────────────────────────┴──────────────────────────┘
```

---

## 3. Module Specifications

### Module A: `partner-privy`
- **Goal:** Allow investors to connect via Privy (Email/SMS/Google) or their existing injected/RainbowKit wallet.
- **Components:**
  - Setup `PrivyProvider` in `packages/nextjs/components/PrivyClientProvider.tsx` (wrapped around or alongside RainbowKit/Wagmi).
  - Add "Login with Email / Social (Privy)" option in the navbar wallet drawer and on the `/app` Primary Market desk.
  - Expose connected embedded wallet address to `useAccount` / viem actions.
- **Environment:**
  - `NEXT_PUBLIC_PRIVY_APP_ID`: Privy App ID (with graceful fallback/mock mode if unconfigured in local dev).

### Module B: `partner-world`
- **Goal:** Verify human uniqueness before the Registrar issues a `RESIDENCY_ID` claim.
- **Components:**
  - Add `@worldcoin/idkit` widget to `packages/nextjs/app/registrar/page.tsx`.
  - App ID: `app_staging_kupon_rwa` (Simulator / Staging testnet).
  - Action ID: `verify-residency-ksei`.
  - UI State: "World ID Verified (Proof of Personhood) ✓" badge on the investor evaluation card. The "Grant RESIDENCY_ID Claim" button is highlighted and enabled once human verification passes.

### Module C: `partner-thegraph`
- **Goal:** Index onchain events from Base Sepolia and feed the `/regulator` event ledger.
- **Components:**
  - Create `packages/subgraph/` directory containing:
    - `subgraph.yaml`: Manifest targeting `KuponClaimRegistry` (`0xd473...`) and `KuponToken` (`0x65c5...`) on `base-sepolia`.
    - `schema.graphql`: Entities for `ClaimEvent`, `TransferAudit`, and `InvestorState`.
    - `src/mapping.ts`: Handlers for `ClaimGranted`, `ClaimRevoked`, and `Transfer`.
  - Frontend client in `packages/nextjs/services/thegraph/client.ts` querying the Subgraph endpoint with automatic fallback to `publicClient.getContractEvents`.

---

## 4. Commands

```bash
# Frontend dev & check
yarn start                              # packages/nextjs dev server (http://localhost:3000)
yarn check-types                        # TypeScript verification across workspaces
yarn lint                               # Next.js ESLint verification
yarn build                              # Static generation & Next.js production build

# Subgraph generation (packages/subgraph)
cd packages/subgraph && graph codegen   # Generate TypeScript types from ABI & schema
cd packages/subgraph && graph build     # Compile AssemblyScript mappings
```

---

## 5. Project Structure Additions

```
packages/
  nextjs/
    components/
      auth/
        PrivyAuthButton.tsx            # Privy 1-click embedded login component
        PrivyProviderWrapper.tsx       # PrivyProvider client container
      registrar/
        WorldIDVerificationButton.tsx  # IDKit integration for KSEI SID verification
    services/
      thegraph/
        client.ts                      # GraphQL query client for regulatory telemetry
  subgraph/
    abis/
      KuponClaimRegistry.json          # ABI for claim events
      KuponToken.json                  # ABI for transfer events
    src/
      mapping.ts                       # Event indexing handlers
    schema.graphql                     # GraphQL entities definition
    subgraph.yaml                      # Subgraph deployment manifest (Base Sepolia)
    package.json                       # Graph CLI dependencies
tasks/
  plan-partners.md                     # Implementation plan broken into verifiable tasks
```

---

## 6. Code Style & Patterns

### 1. Graceful Fallback Pattern (Zero-Breakage)
Every partner SDK must support offline / unconfigured dev environments without throwing hydration errors:
```typescript
// Example: Privy graceful initialization
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clplaceholder_kupon_demo";

export const SafePrivyProvider = ({ children }: { children: React.ReactNode }) => {
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    // Render children directly if running without Privy credentials in dev
    return <>{children}</>;
  }
  return <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>{children}</PrivyProvider>;
};
```

### 2. Impeccable Sovereign Aesthetics
All partner buttons and badges must strictly follow the Kupon Sovereign Certificate visual design tokens:
- Primary: Emerald (`#0E5E4A`)
- Accent/Border: Muted Gold (`#C9A227`, `rgba(201, 162, 39, 0.3)`)
- Canvas: Warm Ivory (`#FAF6EC`)
- Ink: Slate Ink (`#14201C`)
- Typography: Fraunces serif headers, IBM Plex Mono for addresses/hashes, Inter for body copy.

---

## 7. Testing & Verification Strategy

1. **`partner-privy` Verification:**
   - Open private browser tab without browser extension.
   - Click Privy Login → modal opens → sign in with test credentials → address populated in header.
   - Run `yarn build` to ensure no SSR/Next.js 16 hydration mismatches.

2. **`partner-world` Verification:**
   - Navigate to `/registrar`.
   - Click "Verify with World ID" → IDKit modal opens in simulator mode.
   - Complete verification in Worldcoin Simulator → page displays green verified badge.

3. **`partner-thegraph` Verification:**
   - Validate `subgraph.yaml` and schema with `graph codegen` and `graph build`.
   - Verify `/regulator` event feed fetches and renders schema-compliant records.

---

## 8. Boundaries

- **Always:**
  - Keep core smart contracts untouched (no recompiling or redeploying `KuponToken`).
  - Keep `yarn build` and `yarn lint` green at 100% at every commit.
  - Disclose all partner SDKs in `README.md` and submission forms.
- **Ask First:**
  - Introducing dependencies requiring native binaries or breaking React 19 compatibility.
- **Never:**
  - Commit API secret keys (Privy App Secret, Graph auth tokens) into git.
  - Break standard browser wallet support (MetaMask/RainbowKit must remain functional alongside Privy).

---

## 9. Success Criteria (Definition of Done)

- [ ] `packages/nextjs` integrates Privy login alongside RainbowKit.
- [ ] `/registrar` features a working World ID verification trigger.
- [ ] `packages/subgraph` is fully coded and validated (`subgraph.yaml`, `schema.graphql`, `mapping.ts`).
- [ ] `/regulator` displays telemetry backed by The Graph GraphQL client service.
- [ ] Concrete code lines and GitHub links are drafted for the 3 Partner Prize slots on the ETHGlobal submission dashboard.
