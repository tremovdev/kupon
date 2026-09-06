# Plan: Kupon Brand Overhaul (T13 series)

> Dibuat 6 Sep 2026 (pasca Gate 1) atas arahan Harry. Dieksekusi di **fresh session**.
> **Read-first:** `AGENTS.md` (repo) · `SPEC.md` · file ini · skill `impeccable` (UI craft,
> baca via skill router) · `branding/logo-prompts.md` (asset prompts).
> Status Gate 1: TUTUP (T5+T6min+T9 ✅). Plan ini SISIPAN sebelum/paralel T7–T8 —
> branding foundation dikerjakan lebih dulu supaya T7/T8 lahir langsung di dalam design system.

## 0. Konsep Brand — "Sovereign Certificate"

Narasi: SBN Ritel 2027 versi onchain — bahasa visual **sertifikat utang negara**:
guilloche engraving, seal, serial number, kertas premium. Bukan crypto cliché
(coin/glow/hexagon dilarang). Target rasa: dipercaya seperti bank sentral, tajam
seperti fintech modern.

| Token | Nilai | Pakai |
|---|---|---|
| `--kupon-emerald` | `#0E5E4A` | primary, header, tombol utama |
| `--kupon-gold` | `#C9A227` | aksen, rule lines, seal, highlight angka |
| `--kupon-ivory` | `#FAF6EC` | background |
| `--kupon-ink` | `#14201C` | teks |

Font (via `next/font/google`, **zero new dependency**): Fraunces (display) · Inter (body) ·
IBM Plex Mono + `tabular-nums` (angka/serial). Motif: guilloche SVG hand-coded
(deterministic, bukan raster), double-rule certificate borders, stamp/badge
untuk status.

**Copy language:** English (judge-facing) — nama produk Indonesia dipertahankan
(Kupon, SBN Ritel 2027, WNI gate).

## 1. Information Architecture (baru)

```
/            Landing page (narasi + stats live + CTA)     ← BARU, menggantikan welcome SE2
/app         Investor (page.tsx sekarang, dipindah)       ← T6, sudah live
/registrar   T7 (belum dibangun — lahir di shell baru)
/regulator   T8 (belum dibangun — lahir di shell baru)
/debugger    Debug tools TERGABUNG (contracts + explorer) ← rename dari /debug
/blockexplorer  SE2 as-is, DIPERTAHANKAN, di-link dari /debugger
```

Header: logo mark + nav (Landing tidak ada di nav — logo = home; App · Registrar ·
Regulator · Debugger) + RainbowKit connect + network badge.
Footer: disclaimer wajib ("fictional asset, demo — bukan SBN sungguhan") + sitasi
(UU P2SK, POJK 27/2024, POJK 23/2025, OJK Q3-2026 rulebook — dari SPEC) + link GitHub.

## 2. Task Breakdown

### T13a — Theme foundation (S)
- DaisyUI custom theme `kupon` **light-only** — toggle dark mode DINONAKTIFKAN
  (hapus/sembunyikan `SwitchTheme` di Header; next-themes dipaksa light).
- Font `next/font/google` (Fraunces, Inter, IBM Plex Mono) di `app/layout.tsx`.
- Utility class certificate-border + komponen `GuillochePattern` (SVG deterministik).
- **Sekalian QA#7 cleanup:** hapus `contracts/YourContract.sol`,
  `deploy/00_deploy_your_contract.ts`, `test/YourContract.ts`; hapus referensi di
  `/debug` & `Header`. Lalu `yarn deploy` (baseSepolia) → hardhat-deploy skip kontrak
  lama yang unchanged, alamat Kupon TIDAK berubah, `deployedContracts.ts` regenerasi
  tanpa YourContract.
- Acceptance: theme aktif di seluruh app, tanpa deps baru, test 44→42 hijau, CI hijau.

### T13b — Layout shell + navigasi (S)
- Header baru (logo, nav 5 rute, connect wallet SE2), Footer (disclaimer + sitasi).
- Pindah investor: `app/page.tsx` → `app/app/page.tsx`.
- Buat `app/page.tsx` baru = placeholder landing (full di T13c).
- Rename route `/debug` → `/debugger` (folder move + update link), title "Debugger".
- Acceptance: semua rute reachable, tidak ada dead link, render check via browser.

### T13c — Landing page (M)
Struktur narasi (satu scroll):
1. **Hero**: H1 "The retail bond that enforces its own rules." · sub: "Kupon is the
   fictional SBN Ritel 2027 tokenized as a compliance-gated asset. Every transfer is
   checked against three onchain rules — and reverts name the rule." · CTA "Launch App"
   → `/app` · background guilloche texture.
2. **Live stats strip** (hook SE2, data nyata testnet): total supply / series cap /
   retail cap / jumlah claim event.
3. **Three rules** (kartu): R1 WNI gate · R2 retail cap 5.000 · R3 revoke = freeze —
   masing-masing satu kalimat manusiawi + "reverts carry the rule id".
4. **The 4 acts** (= naskah demo): blocked → registrar grants → cap proof → regulator
   freeze; tiap act satu kalimat + link ke halaman terkait.
5. **Disclaimer + sitasi** (duplikasi footer di bawah fold).
- Acceptance: copy mengikuti skeleton ini (boleh poles), semua angka live dari chain,
  render check.

### T13d — Debugger page merge (S)
- `/debugger`: section "Contracts" (DebugContracts 3 kontrak Kupon) + section
  "Explorer" (link ke /blockexplorer SE2 yang sudah ada — jangan rebuild).
- Hapus Welcome SE2 & aset template tak terpakai (BugAntIcon dsb) yang tersisa.
- Acceptance: satu halaman debugger; grep tidak menyisakan rute /debug lama.

### T13e — Logo & asset integration (S, menunggu aset Harry)
- **Arah terkunci: SEAL MARK** — generate dari prompt #1 (`branding/logo-prompts.md`).
  Wordmark TIDAK di-generate sebagai gambar: dibangun sebagai teks CSS (Fraunces +
  rule line) supaya selalu tajam. Favicon dari prompt #3, OG texture dari prompt #4.
- Integrasi sesuai checklist di `branding/logo-prompts.md` (favicon, OG 1200×630,
  header mark, metadata "Kupon").
- Acceptance: favicon tampil, share-preview OG benar, tidak ada judul "Scaffold-ETH 2 App".

### T13f — QA + verify (S)
- Skill `impeccable` checklist (spacing/type/contrast) di 5 rute.
- Browser: dev (port 3001 milik Harry — JANGAN pakai 3000) + Vercel production.
- `yarn lint --max-warnings=0`, `check-types`, CI hijau, commit granular per T13x.

## 3. Urutan & Kaitan T7/T8

**T13a → T13b → (T13c ‖ T13d) → T13e → T13f**, lalu T7/T8 dibangun DI DALAM shell baru.
Jangan reskin retroaktif dua kali. Estimasi: T13a–d satu sesi; T13e menunggu aset;
T13f menyatu di akhir tiap task.

## 4. Constraints (non-negotiable)

- Nol dependency baru tanpa izin Harry (font = `next/font`, pattern = SVG tulisan tangan).
- Jangan sentuh kontrak/test yang sudah hijau, kecuali cleanup YourContract di T13a.
- Jangan rusak demo 4-act & jalan pintas verifikasinya (Checkpoint B tetap target Selasa).
- `.env`/key tidak pernah masuk repo; commit author `tremov`; commit granular per task.
- Semua copy English; disclaimer fictional asset harus tampil di landing & footer.

## 5. Keputusan Terkunci (Harry, 6 Sep 2026)

1. Logo = **seal mark** (prompt #1); wordmark = teks CSS, bukan gambar.
2. **Light-only** — toggle dark mode dimatikan.
3. Tagline hero/OG: **"The retail bond that enforces its own rules."** — APPROVED.
4. Block explorer SE2 **dipertahankan** sebagai halaman terpisah, di-link dari `/debugger`.
