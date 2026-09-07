# Capability Map: Kupon (ETHOnline Fase 1)

> Disetujui Harry 5 Sep 2026 (4 keputusan: simplified registry · satu token bertingkat · KPON · JS-seeded fuzz).
> Spesifikasi per modul diperluas JIT saat modul mulai dikerjakan; setiap spec modul harus trace ke id di peta ini.

| Module id | Responsibility | Depends on |
|---|---|---|
| `token-core` | Kontrak: ClaimRegistry (address→claims, role REGISTRAR), ComplianceModule (3 rule bernama), KuponToken (ERC-3643-style gated ERC-20) | — |
| `frontend` | SE2 Next.js: halaman Investor, Registrar, Regulator view (audit trail + simulasi) | `token-core` |
| `infra` | Deploy Base Sepolia + Arbitrum Sepolia, verifikasi explorer, Vercel git-integration | `token-core`, `frontend` |
| `tests-docs` | Core-path tests, 3 fuzz invariant JS-seeded, threat model 1 halaman, README (disclosure + sitasi) | menempel ke semua |

Build order: `token-core` → `frontend` → `infra`; `tests-docs` menyertai tiap modul (test dulu per slice).

## Partner Integrations (ETHOnline Partner Prizes)

> Ditambahkan 7 Sep 2026: Strategi 3 Partner Prizes tanpa overhaul smart contract core.

| Module id | Responsibility | Depends on |
|---|---|---|
| `partner-privy` | Social/Email onboarding -> embedded wallet instan untuk Investor Portal (`/app`) | `frontend` |
| `partner-world` | Proof of Personhood / Human verification via `@worldcoin/idkit` di Meja Registrar (`/registrar`) | `frontend` |
| `partner-thegraph` | Subgraph indexing untuk event registry & token di Base Sepolia -> GraphQL telemetry untuk Regulator (`/regulator`) | `token-core`, `infra` |

Build order: `partner-privy` → `partner-world` → `partner-thegraph`
