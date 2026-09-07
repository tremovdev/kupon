# ETHOnline 2026 Partner Prize Submission Form Answers

> Use these prepared answers directly in your ETHGlobal Hacker Dashboard for the selected Partner Prizes.

---

## 1. Privy ($2,500 — Best Financial Flow / B2B)

### Field: How are you using this Protocol / API?
```text
Kupon uses Privy to eliminate the primary onboarding friction for Indonesian retail government bond (SBN Ritel) investors. Instead of forcing non-crypto citizens to install browser wallet extensions or fund gas upfront, investors can authenticate via 1-click Email or Google social login, instantly generating a secure embedded institutional smart wallet. This enables seamless, immediate subscription to sovereign bond tranches (KPON) while retaining full compliance verification at the contract level.
```

### Field: Link to the line of code where the tech is used
```text
https://github.com/tremovdev/kupon/blob/main/packages/nextjs/components/auth/PrivyProviderWrapper.tsx#L8-L24
```
*(Secondary link to UI button: `https://github.com/tremovdev/kupon/blob/main/packages/nextjs/components/auth/PrivyAuthButton.tsx#L9-L65`)*

### Field: How easy is it to use the API / Protocol? (1 - 10)
`9` (or `10`)

### Field: Additional feedback for the Sponsor
```text
Privy's React SDK was exceptionally straightforward to integrate alongside Wagmi/RainbowKit. The embedded wallet creation flow on login (`createOnLogin: "users-without-wallets"`) perfectly solves our non-crypto retail investor persona. One suggestion for improvement: provide clearer peer-dependency guidance when installing in React 19 / Next.js 16 app router projects to avoid optional Stripe onramp bundle warnings.
```

---

## 2. World / World ID ($3,500 — Proof of Personhood / Identity Verification)

### Field: How are you using this Protocol / API?
```text
Kupon integrates World ID (@worldcoin/idkit) into the KSEI Registrar certification desk (/registrar). Indonesian retail bonds have a strict statutory per-citizen quota (5,000 KPON max to prevent syndicate accumulation). Before the sovereign registrar issues an on-chain RESIDENCY_ID claim to an investor wallet, the registrar verifies the applicant's unique Proof of Personhood via World ID, preventing Sybil attacks and ensuring a strict 1-human-1-citizen quota allocation.
```

### Field: Link to the line of code where the tech is used
```text
https://github.com/tremovdev/kupon/blob/main/packages/nextjs/components/registrar/WorldIDVerificationButton.tsx#L98-L115
```
*(Secondary link to Registrar flow: `https://github.com/tremovdev/kupon/blob/main/packages/nextjs/app/registrar/page.tsx#L509-L514`)*

### Field: How easy is it to use the API / Protocol? (1 - 10)
`9`

### Field: Additional feedback for the Sponsor
```text
The v4 IDKitRequestWidget and preset system (`proofOfHuman()`) provide a clean, user-friendly modal experience. The staging simulator works seamlessly for hackathon judging and testing. One suggestion: include copy-pasteable minimal RpContext examples in the v4 quickstart documentation for faster developer onboarding.
```

---

## 3. The Graph ($5,000 — Subgraph Indexing / Data Infrastructure)

### Field: How are you using this Protocol / API?
```text
Kupon implements a dedicated Subgraph on Base Sepolia to power the transparent Regulator Terminal (/regulator). Financial supervisors (OJK/DJPPR) require real-time, immutable audit trails of all investor identity certifications, claim revocations, and secondary market bond transfers emitted by KuponClaimRegistry and KuponToken. The Subgraph indexes these events into clean GraphQL entities (ClaimEvent, TransferEvent, InvestorComplianceState), enabling sub-second regulatory querying and compliance telemetry.
```

### Field: Link to the line of code where the tech is used
```text
https://github.com/tremovdev/kupon/blob/main/packages/subgraph/subgraph.yaml#L4-L44
```
*(Secondary link to GraphQL Client: `https://github.com/tremovdev/kupon/blob/main/packages/nextjs/services/thegraph/client.ts#L43-L75`)*

### Field: How easy is it to use the API / Protocol? (1 - 10)
`8` (or `9`)

### Field: Additional feedback for the Sponsor
```text
The Graph CLI codegen and Base Sepolia indexing speed were smooth and reliable. Managing event signatures directly in AssemblyScript mappings provided high data fidelity for our compliance entities. Suggestion: provide a unified zero-config Subgraph Studio template specifically designed for Next.js App Router projects to make client-side query wiring even faster.
```

---

## 4. (Bonus / Backup) Uniswap Foundation ($5,000)

*In case Uniswap Foundation is retained as an active slot:*

### Field: How are you using this Protocol / API?
```text
Kupon references the Uniswap v4 Permissioned Pools architecture to conceptualize regulated secondary market bond trading. The protocol routes secondary OTC and AMM bond transfers through an ERC-3643 transfer enforcement hook that validates live identity credentials in the KuponClaimRegistry before settlement, demonstrating how sovereign securities can trade within Uniswap liquidity pools without violating statutory investor limits.
```

### Field: Link to the line of code where the tech is used
```text
https://github.com/tremovdev/kupon/blob/main/SPEC-PARTNERS.md#L15-L35
```

### Field: How easy is it to use the API / Protocol? (1 - 10)
`8`

### Field: Additional feedback for the Sponsor
```text
Uniswap v4's hook architecture is revolutionary for Real World Assets (RWA) and institutional compliance. We strongly appreciate the official documentation on Permissioned Pools. Providing official Hardhat/viem deployment templates alongside Foundry for hook development would significantly lower the barrier for builders outside the Foundry ecosystem.
```
