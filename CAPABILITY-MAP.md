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
