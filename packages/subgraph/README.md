# Kupon Subgraph — The Graph Indexing on Base Sepolia

> Subgraph for Kupon sovereign RWA retail bond protocol on Base Sepolia.
> Indexes compliance identity claims (`KuponClaimRegistry`) and secondary bond transfers (`KuponToken`).

---

## Contracts Indexed (Base Sepolia)

| Contract | Address | Start Block |
|---|---|---|
| `KuponClaimRegistry` | `0xd473730c87c0145b2a431f39b91c06d25cc8e41a` | 21614000 |
| `KuponToken` | `0x65c5a5ed0b13d17051a20e3570c54e1bcf3de409` | 21614000 |

---

## Schema Entities

- **`ClaimEvent`**: Real-time log of `ClaimGranted` and `ClaimRevoked` events with mapped compliance rule attributes (`RESIDENCY_ID` or `ACCREDITED`).
- **`TransferEvent`**: Log of all secondary bond transfers between wallets on Base Sepolia.
- **`InvestorComplianceState`**: Aggregated state entity tracking an investor wallet's residency status, accreditation, and token balance.

---

## Build & Deploy to Subgraph Studio

```bash
# Install Graph CLI (if needed)
npm install -g @graphprotocol/graph-cli

# Generate TypeScript types
graph codegen

# Build WebAssembly binary
graph build

# Authenticate with The Graph Studio
graph auth --studio <DEPLOY_KEY>

# Deploy
graph deploy --studio kupon-rwa
```

---

## Example GraphQL Query

```graphql
query GetRegulatoryAuditTrail {
  claimEvents(first: 20, orderBy: blockTimestamp, orderDirection: desc) {
    id
    account
    claimType
    action
    blockNumber
    blockTimestamp
    transactionHash
  }
  transferEvents(first: 20, orderBy: blockTimestamp, orderDirection: desc) {
    id
    from
    to
    value
    blockTimestamp
    transactionHash
  }
}
```
