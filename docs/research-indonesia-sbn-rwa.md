# Riset Pasar & Kerangka Regulasi: Tokenisasi SBN Ritel (RWA) di Indonesia

> **Dokumen Riset & Landasan Strategis Proyek Kupon (ETHGlobal ETHOnline 2026)**  
> Disusun untuk referensi arsitektur, bahan pitch juri, dan dokumentasi kepatuhan.

---

## 1. Executive Summary & Tesis Utama

Kupon adalah instrumen demonstrasi **Real-World Asset (RWA)** berupa obligasi ritel negara fiktif (*SBN Ritel 2027*) yang diterbitkan di atas blockchain (EVM/Layer 2) dengan penegakan kepatuhan otomatis di level *smart contract*.

### Tesis Masalah
Pasar Surat Berharga Negara (SBN) Ritel di Indonesia saat ini memiliki imbal hasil berdaulat yang sangat menarik (**6.25% – 6.80% p.a. bebas risiko gagal bayar** karena dijamin UU APBN). Namun, adopsi ritelnya terhambat oleh infrastruktur pasar finansial konvensional:
1. **Pasar Sekunder yang Tidak Likuid:** SBN Ritel tradable (seperti ORI dan Sukuk Ritel) diperdagangkan secara bilateral *Over-The-Counter* (OTC) melalui perbankan dengan *bid-ask spread* yang lebar dan settlement **T+2**.
2. **Window Penawaran yang Terkotak-kotak:** Hanya terbit 7–8 kali setahun dengan kuota yang sering habis dalam hitungan menit di platform fintech mitra distribusi (Midis).
3. **Keterbatasan Komposabilitas:** Obligasi yang dipegang investor tidak dapat digunakan sebagai jaminan kolateral likuiditas secara instan.

### Tesis Solusi (Kupon)
Kupon membenamkan aturan hukum penerbitan obligasi ritel langsung ke dalam kontrak token (*ERC-3643-style transfer hook*). Hasilnya adalah obligasi negara dengan **likuiditas sekunder 24/7**, penyelesaian transaksi **sub-detik atomik**, serta **kepatuhan regulasi mandiri** tanpa bergantung pada rekonsiliasi kliring manual.

---

## 2. Paradoks Pasar Finansial Indonesia: 21 Juta vs 1.1 Juta

Fakta pasar yang menjadi fondasi daya tarik proyek ini di hadapan investor dan juri global:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       INDONESIA ADOPTION PARADOX                        │
├────────────────────────────────────┬────────────────────────────────────┤
│   INVESTOR ASET KRIPTO TERDAFTAR   │      INVESTOR SBN RITEL (SID)      │
│            >21.000.000             │             ~1.100.000             │
│        (Data Bappebti 2024)        │      (Data Statistik KSEI 2024)    │
└────────────────────────────────────┴────────────────────────────────────┘
```

* **Adopsi Kripto Global:** Indonesia secara konsisten menduduki peringkat **Top 3 hingga Top 7 Dunia** dalam *Chainalysis Global Crypto Adoption Index*. Generasi muda Indonesia sudah sangat akrab dengan Web3 wallet (*self-custody*).
* **Jurang Penetrasi:** Jumlah pemilik wallet kripto terdaftar di Indonesia **20 kali lipat lebih banyak** daripada jumlah seluruh warga negara yang memiliki obligasi ritel negara.
* **Capital Flight ke Spekulasi:** Karena produk keuangan negara tidak hadir di ekosistem on-chain, likuiditas puluhan triliun rupiah dari investor muda lari ke memecoin volatil atau stablecoin USD luar negeri.
* **Peran Kupon:** Membawa *sovereign risk-free yield* berdenominasi Rupiah ke native environment di mana modal digital anak muda Indonesia berada.

---

## 3. Realita Mekanisme SBN Ritel Konvensional (DJPPR & KSEI)

Berdasarkan peraturan Kementerian Keuangan (antara lain PMK No. 27/PMK.08/2020 tentang Penjualan SUN Ritel):

### A. Aktor Utama dalam Ekosistem SBN Ritel
1. **Penerbit (Issuer):** Pemerintah Republik Indonesia cq. Kementerian Keuangan, dikelola oleh **DJPPR** (Direktorat Jenderal Pengelolaan Pembiayaan dan Risiko).
2. **Lembaga Penyimpanan & Penyelesaian:** **KSEI** (PT Kustodian Sentral Efek Indonesia).
3. **Sistem Kliring Sentral:** **BI-SSSS** (Bank Indonesia Scripless Securities Settlement System).
4. **Mitra Distribusi (Midis):** Bank umum (BCA, Mandiri, BRI, BNI), sekuritas, dan platform fintech (Bibit, Bareksa, Tanamduit).

### B. Aturan Statuter SBN Ritel
* **Wajib WNI & NIK:** Investor wajib merupakan Warga Negara Indonesia perseorangan yang dibuktikan dengan KTP/NIK yang valid. KSEI menerbitkan nomor **SID (Single Investor Identification)** tunggal untuk setiap individu.
* **Plafon Pemesanan (Retail Cap):**
  * Minimal pemesanan: Rp 1.000.000 (1 unit).
  * Maksimal pemesanan: Umumnya dibatasi antara **Rp 5.000.000.000 hingga Rp 10.000.000.000** per seri per individu.
  * **Tujuan Regulasi:** Menjaga pemerataan kepemilikan dan mencegah pemodal raksasa / korporasi memonopoli jatah alokasi subsidi kupon ritel negara.
* **Minimum Holding Period (MHP):** Untuk seri tradable (ORI & SR), terdapat periode tunggu sebelum instrumen boleh ditransaksikan di pasar sekunder (biasanya setelah pembayaran kupon pertama).

### C. Masalah di Pasar Sekunder Riil
Meskipun berstatus *tradable*, likuiditas pasar sekunder SBN ritel saat ini sangat terbatas:
* Investor yang ingin menjual sebelum jatuh tempo harus menjual kembali ke bank/Midis secara bilateral (OTC).
* Bank mengambil margin *spread* harga beli/jual yang cukup tinggi.
* Proses penyelesaian dana dan pemindahan hak membutuhkan waktu T+1 atau T+2 hari kerja bursa.

---

## 4. Payung Hukum & Regulasi RWA di Indonesia

Proyek ini dirancang selaras dengan lompatan regulasi terbesar di sektor keuangan Indonesia:

### 1. UU No. 4/2023 (UU P2SK — Pengembangan dan Penguatan Sektor Keuangan)
* Merupakan undang-undang *omnibus* sektor keuangan.
* Mengalihkan mandat pengawasan Aset Keuangan Digital dan Aset Kripto dari Kementerian Perdagangan (Bappebti) ke **Otoritas Jasa Keuangan (OJK)** mulai Januari 2025.
* Memberikan mandat resmi bagi OJK untuk mengatur dan mengembangkan **Inovasi Teknologi Sektor Keuangan (ITSK)**.

### 2. POJK No. 3/2024 (Penyelenggaraan ITSK & Regulatory Sandbox)
* OJK secara resmi membentuk ruang uji coba terbatas (**Regulatory Sandbox**) bagi model bisnis baru berbasis teknologi buku besar terdistribusi (*distributed ledger technology* / blockchain).
* Klaster inovasi mencakup:
  1. *Asset-Backed Tokenization* (RWA Tokenization).
  2. *Digital Securities & Secondary Market Platforms*.
* Kepala Eksekutif Pengawas ITSK, Aset Keuangan Digital, dan Aset Kripto OJK (**Hasan Fawzi**) secara terbuka menyatakan bahwa tokenisasi aset riil merupakan instrumen efisiensi masa depan pembiayaan nasional.

### 3. Bank Indonesia: Project Garuda (Digital Rupiah / CBDC)
* Bank Indonesia menerbitkan *Whitepaper Proyek Garuda*, yang merancang Arsitektur *Digital Rupiah* (CBDC).
* Dalam *wholesale ledger* Digital Rupiah, BI secara spesifik memetakan skenario interaksi antara uang digital bank sentral dengan **surat berharga negara yang ditokenisasi** untuk penyelesaian seketika (*atomic Delivery-versus-Payment / DvP*).

---

## 5. Pemetaan Kebijakan Nyata ke Arsitektur Smart Contract Kupon

Arsitektur Kupon menerjemahkan amanat regulasi di atas ke dalam kode Solidity deterministik:

| Kebijakan / Masalah Nyata | Implementasi Kontrak di Kupon | Mekanisme Teknis |
|---|---|---|
| **Verifikasi WNI & KSEI SID** | `KuponClaimRegistry.sol` | Memetakan alamat wallet ke klaim identitas `RESIDENCY_ID` (keccak256 hash). Transfer ke alamat tanpa klaim ditolak seketika (`R1-RESIDENCY`). |
| **Plafon Ritel PMK Kemenkeu** | `KuponComplianceModule.sol` | Fungsi `enforceTransfer` memeriksa `toBalance + value <= cap`. Jika melampaui kuota ritel (5.000 KPON), transaksi revert dengan kode `R2-CAP`. |
| **Kepatuhan Sanksi / AML PPATK** | `KuponClaimRegistry.revokeClaim` | Otoritas dapat mencabut klaim `RESIDENCY_ID`. Penarikan klaim ini membekukan saldo wallet secara presisi (`R3-FROZEN`) tanpa mematikan kontrak token publik. |
| **Penerbitan Terukur DJPPR** | `KuponToken.sol` (`SERIES_CAP`) | Batas maksimal emisi seri sebesar 100.000 KPON yang dijamin oleh *cap* permanen pada fungsi `issue()`. |
| **Pasar Sekunder Macet T+2** | Standar ERC-20 ERC-3643 | Settlement antar-investor WNI berlangsung instan 24/7 di jaringan Base Sepolia, menghilangkan ketergantungan perbankan OTC. |

---

## 6. Panduan Pitch untuk Juri & Evaluator (Cheat Sheet)

Saat mempresentasikan atau mendemokan proyek ini:

### A. Untuk Juri Kategori DeFi & L2 (Base / Arbitrum)
> *"Global RWAs like Ondo bring USD yields onchain, but local economies need domestic sovereign yield. Kupon brings Indonesia's 6.5% sovereign risk-free rate onchain with sub-second L2 settlement, creating the prime collateral asset for Southeast Asian DeFi."*

### B. Untuk Juri Kategori RWA & Institusional
> *"Most tokenized bond projects rely on centralized frontend geoblocking. If a user bypasses the frontend via Etherscan or Uniswap, non-compliant transfers succeed. Kupon enforces compliance at the ERC-20 bytecode update hook: compliance rules travel with the token wherever it is traded."*

### C. Untuk Juri Kategori Regulasi / Social Impact
> *"With 21M crypto users but only 1.1M government bondholders, Indonesia has an enormous financial inclusion gap. Kupon leverages the country's statutory sandbox (POJK 3/2024 & UU P2SK) to transform sovereign debt into an accessible, liquid, self-governing instrument for the digital generation."*

---

## 7. Referensi & Dokumen Terkait

1. **Undang-Undang Republik Indonesia Nomor 4 Tahun 2023** tentang Pengembangan dan Penguatan Sektor Keuangan (UU P2SK).
2. **Peraturan Otoritas Jasa Keuangan (POJK) Nomor 3 Tahun 2024** tentang Penyelenggaraan Inovasi Teknologi Sektor Keuangan (ITSK).
3. **Peraturan Menteri Keuangan Nomor 27/PMK.08/2020** tentang Penjualan Surat Utang Negara Ritel di Pasar Perdana Domestik.
4. **Bank Indonesia (2022):** *Proyek Garuda: Menavigasi Arsitektur Digital Rupiah*.
5. **KSEI (2024–2026):** *Statistik Publik Pasar Modal Indonesia (Distribusi Single Investor Identification)*.
6. **Bappebti (2024):** *Laporan Perkembangan Pasar Calon Pedagang Fisik Aset Kripto Indonesia*.
