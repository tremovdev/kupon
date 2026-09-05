# Spec: Kupon — Compliance-Gated RWA Token (ETHOnline Fase 1)

> PRD v1 — 5 Sep 2026. Disusun AI-assisted (spec-driven workflow; file ini di-commit sebagai bukti atribusi AI sesuai aturan ETHGlobal). **Versi Inggris (kanonis): [`SPEC.md`](./SPEC.md)** — jika ada perbedaan, versi Inggris yang berlaku.

Keputusan terkunci: simplified registry (bukan ONCHAINID penuh) · satu token bertingkat · "Kupon SBN Ritel 2027 / KPON" · fuzz JS-seeded di Hardhat.

## Objective

Kupon adalah demo tokenisasi RWA yang compliance-enforced di level transfer: obligasi ritel pemerintah Indonesia **fiktif** ("SBN Ritel 2027") diterbitkan sebagai token ERC-3643-style di mana aturan compliance dieksekusi kontrak, bukan UI.

**Persona:** (1) **Investor** — wallet yang menerima/mengirim KPON; (2) **Registrar** — penerbit yang grant/revoke identity claim & menerbitkan token; (3) **Regulator/pengamat** — pembaca audit trail rule-by-rule.

**Success =** demo 4 babak berjalan mulus di testnet + submission lengkap sebelum 13 Sep 23.00 WIB:

1. Wallet tanpa claim mencoba menerima KPON → **revert dengan nama rule yang dilanggar** (R1-RESIDENCY)
2. Registrar memberi claim residency → retry sukses
3. Cap ritel terbukti bekerja (R2-CAP); wallet accredited bebas cap
4. Regulator view menampilkan audit trail; revoke claim → wallet dibekukan (R3-FROZEN)

**Why Indonesia, why now:** OJK menargetkan aturan tokenisasi RWA terbit ≤ Q3 2026 (Kontan, 8 Jun 2026) — sprint ini berada di kuartal yang sama. Sitasi lengkap (UU P2SK, POJK 27/2024, POJK 23/2025) masuk README.

## Tech Stack

- **Scaffold-ETH 2** (bootstrap `create-eth`; Hardhat + Next.js + wagmi/viem), Solidity ≥0.8.20, OpenZeppelin Contracts (ERC20, AccessControl)
- Yarn 4 (workspaces: `packages/hardhat`, `packages/nextjs`)
- Network dev: Hardhat local → deploy: **Base Sepolia + Arbitrum Sepolia**
- Di luar scope Fase 1 (pull-forward): Privy embedded wallet, Uniswap v4 hook, Foundry, ERC-4626/NAV

## Commands

```
Dev chain : yarn chain
Compile   : yarn compile
Test      : yarn test                      # packages/hardhat
Deploy    : yarn deploy --network baseSepolia | arbitrumSepolia
Frontend  : yarn start
```

## Project Structure

```
packages/hardhat/contracts/
  KuponToken.sol            # ERC20 + hook compliance di _update
  KuponClaimRegistry.sol    # address → claims; REGISTRAR_ROLE grant/revoke; events audit
  KuponComplianceModule.sol # 3 rule; admin: COMPLIANCE_ADMIN_ROLE
packages/hardhat/test/      # Kupon.core.t.sol + Kupon.fuzz.t.sol (JS-seeded)
packages/nextjs/app/
  page.tsx                  # Investor: balance, send (revert → rule plain-language), receive
  registrar/page.tsx        # Grant/revoke claim, issue() ke wallet compliant
  regulator/page.tsx        # Audit trail: events + matriks wallet × rule + simulasi eth_call
```

## Code Style

Solidity 0.8.x, natspec `@title/@notice/@param` wajib di semua kontrak publik, custom errors `Kupon__<Alasan>` yang membawa `ruleId`:

```solidity
/// @notice Transfer-level compliance hook — mirrors ERC-3643 T-REX pattern (simplified).
function _update(address from, address to, uint256 value) internal override {
    if (from != address(0) && to != address(0)) {
        _compliance.enforceTransfer(from, to, value); // revert Kupon__RuleViolated(ruleId)
    }
    super._update(from, to, value);
}
```

Frontend: konvensi SE2 (hooks `useScaffoldReadContract` dsb.), komponen kecil, tanpa state manager tambahan.

## Aturan Compliance (3 rule bernama — dipetakan ke kebijakan riil)

| Rule id | Nama kebijakan (demo) | Mekanika |
|---|---|---|
| `R1-RESIDENCY` | Gate WNI (tranche ritel) | Recipient **dan** sender wajib punya claim `RESIDENCY_ID` **atau** `ACCREDITED` |
| `R2-CAP` | Cap per investor ritel | Wallet dengan `RESIDENCY_ID` saja: `balanceAfter ≤ CAP` (default 5.000 KPON, configurable) |
| `R3-FROZEN` | Pembekuan pasca-revoke | Claim dicabut → saldo terkunci, transfer keluar/masuk ditolak |

Mint hanya oleh `ISSUER_ROLE` via `issue(to, amount)` — melewati compliance check yang sama; total issuance ≤ 100.000 KPON (cap seri). Claim: `RESIDENCY_ID`, `ACCREDITED` (bytes32, keccak). **Simplification disclosure:** identity = mapping di satu registry (bukan kontrak ONCHAINID per wallet) — ditulis jujur di README.

## Testing Strategy

- **Core paths** (Hardhat + chai): issue ok/blocked, transfer allow/block per rule, cap boundary (pas = ok, +1 = revert), grant→unblock, revoke→freeze, role guard.
- **3 fuzz invariant** (JS-seeded, ±200 run per invariant, seed di-commit agar reproducible):
  1. Tidak pernah ada transfer sukses ke wallet tanpa claim yang disyaratkan
  2. Saldo wallet ritel tidak pernah melewati CAP melalui kombinasi transfer apa pun
  3. `transferFrom`/approve tunduk pada rule yang sama (tidak ada bypass jalur alternatif)
- Coverage: core path compliance 100%; total sengaja tidak ditarget (README jujur).

## Boundaries

- **Always:** test lulus sebelum commit · natspec · disclose setiap referensi · revert membawa ruleId · commit granular
- **Ask first:** dependensi baru · mengubah struktur claim/registry · menambah rule ke-4 · mengubah nilai cap/issuance cap
- **Never:** commit secret/`.env*` · klaim token = SBN asli · hapus test yang gagal tanpa persetujuan · mint ke wallet non-compliant (issuance melalui gate yang sama)

## Success Criteria (testable)

- [ ] Demo 4 babak jalan di Base Sepolia tanpa kegagalan (direkam → video)
- [ ] Revert selalu membawa ruleId; UI menerjemahkannya ke bahasa kebijakan
- [ ] Regulator view menampilkan: events claim, matriks rule per wallet, hasil simulasi transfer
- [ ] Kontrak verified di Base Sepolia **dan** Arbitrum Sepolia; pola identik di kedua chain
- [ ] 3 fuzz invariant lulus (seed reproducible); core tests lulus
- [ ] README: diagram arsitektur + threat model 1 halaman + "Why Indonesia, why now" bersitasi + disclosure (OZ, referensi ERC-3643, simplification registry) + disclaimer fiktif
- [ ] Semua spec/prompt di-commit; author commit `tremov`

## Open Questions

- Nilai CAP 5.000 KPON & issuance 100.000 — angka demo; Harry boleh ubah kapan saja sebelum freeze 10 Sep
- Kunci registrar = EOA demo kedua (bukan multisig) — cukup untuk demo; dicatat di threat model sebagai batasan
