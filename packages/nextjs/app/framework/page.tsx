import Link from "next/link";
import type { NextPage } from "next";
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { GuillochePattern } from "~~/components/GuillochePattern";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Regulatory & Statutory Framework — Kupon Sovereign RWA",
  description:
    "Comprehensive legal, regulatory, and architectural thesis for sovereign debt tokenization under Indonesian law (UU P2SK & OJK POJK 3/2024).",
});

const STATUTORY_MAPPING = [
  {
    mandate: "WNI Citizenship Verification",
    law: "PMK SBN Ritel & KSEI SID Requirement",
    contract: "KuponClaimRegistry.sol (R1)",
    action: "Reverts with Kupon__RuleViolated(R1-RESIDENCY) if recipient lacks valid NIK/SID",
    badge: "R1-RESIDENCY",
  },
  {
    mandate: "Statutory Retail Quota Cap",
    law: "DJPPR Ministry of Finance (Max Rp5B / Investor)",
    contract: "KuponComplianceModule.sol (R2)",
    action: "Halts transfer if post-settlement retail holdings exceed 5,000 KPON limit",
    badge: "R2-CAP",
  },
  {
    mandate: "Targeted Sanctions & AML Freeze",
    law: "PPATK & OJK Financial Sanctions Directives",
    contract: "KuponClaimRegistry.revokeClaim() (R3)",
    action: "Revokes claim to trigger immediate transfer freeze; target balance remains intact",
    badge: "R3-FROZEN",
  },
  {
    mandate: "National Debt Ceiling Limit",
    law: "UU APBN National Debt Issuance Quota",
    contract: "KuponToken.SERIES_CAP",
    action: "Enforces hard cap of 100,000 KPON (Rp100 Billion); blocks unauthorized mints",
    badge: "SERIES_CAP",
  },
  {
    mandate: "Atomic Delivery-versus-Payment",
    law: "POJK 3/2024 Sandbox Settlement Standard",
    contract: "KuponToken._update() Compliance Hook",
    action: "Atomic T+0 token and payment finality without counterparty or settlement risk",
    badge: "ATOMIC_DVP",
  },
];

const FrameworkPage: NextPage = () => {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EC] text-[#14201C] selection:bg-kupon-gold/30">
      {/* Sovereign Guilloche Watermark */}
      <div className="absolute left-0 top-20 pointer-events-none opacity-[0.03] overflow-hidden">
        <GuillochePattern variant="seal" width={650} height={650} color="emerald" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-20 relative z-10 flex flex-col gap-8">
        {/* ===================================================================== */}
        {/* HEADER: INSTITUTIONAL POLICY BRIEFING */}
        {/* ===================================================================== */}
        <header className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-kupon-gold/30 pb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-kupon-emerald hover:text-kupon-gold transition-colors"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Return to Homepage</span>
            </Link>
            <div className="flex items-center gap-2 text-[11px] font-mono text-kupon-ink/60 uppercase">
              <span>Institutional Policy Briefing</span>
              <span>·</span>
              <span className="font-semibold text-kupon-emerald">OJK Regulatory Sandbox</span>
              <span>·</span>
              <span>Q3 2026</span>
            </div>
          </div>

          {/* Hero Header Card */}
          <div className="bg-[#F8F3E5] p-6 sm:p-10 rounded-xl border border-kupon-gold/30 shadow-xs flex flex-col gap-6 relative overflow-hidden">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-kupon-ink tracking-tight leading-[1.15] m-0">
                Regulatory &amp; Statutory Framework for Onchain Sovereign Debt
              </h1>
              <p className="text-sm sm:text-base text-kupon-ink/75 font-sans leading-relaxed max-w-4xl m-0 pt-1">
                How autonomous smart contracts operationalize Indonesian financial law (
                <strong>UU No. 4/2023 P2SK</strong>), Otoritas Jasa Keuangan sandbox rules (
                <strong>POJK No. 3/2024</strong>), and sovereign retail debt (SBN Ritel) mandates into deterministic
                onchain bytecode.
              </p>
            </div>

            {/* Institutional Metadata Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-kupon-gold/25 text-xs font-mono">
              <div className="space-y-0.5">
                <span className="text-[10px] text-kupon-ink/50 uppercase tracking-wider block">Jurisdiction</span>
                <span className="font-bold text-kupon-ink text-sm">Indonesia (RI)</span>
                <span className="text-[11px] text-kupon-ink/60 font-sans block">Sovereign Debt Domain</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-kupon-ink/50 uppercase tracking-wider block">Supervisory Body</span>
                <span className="font-bold text-kupon-emerald text-sm">OJK (ITSK / IAJD)</span>
                <span className="text-[11px] text-kupon-ink/60 font-sans block">Regulatory Sandbox</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-kupon-ink/50 uppercase tracking-wider block">Sandbox Focus</span>
                <span className="font-bold text-kupon-ink text-sm">Asset Tokenization (RWA)</span>
                <span className="text-[11px] text-kupon-ink/60 font-sans block">SBN Ritel Benchmark</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] text-kupon-ink/50 uppercase tracking-wider block">
                  Compliance Standard
                </span>
                <span className="font-bold text-kupon-emerald text-sm">ERC-3643 Bytecode</span>
                <span className="text-[11px] text-kupon-ink/60 font-sans block">KSEI SID Identity Gate</span>
              </div>
            </div>
          </div>
        </header>

        {/* ===================================================================== */}
        {/* SECTION 1: MACRO CONTEXT & DIGITAL LIQUIDITY THESIS (7 : 5) */}
        {/* ===================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column (7 cols): Thesis */}
          <div className="lg:col-span-7 bg-[#F8F3E5] p-6 sm:p-8 rounded-xl border border-kupon-gold/30 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-kupon-gold/20 pb-3">
              <DocumentTextIcon className="w-5 h-5 text-kupon-emerald shrink-0" />
              <h2 className="text-xl font-serif font-bold text-kupon-ink m-0">
                1. The Structural Problem: 21M Crypto Investors vs. 1.1M Bond Holders
              </h2>
            </div>

            <div className="text-xs sm:text-sm font-sans text-kupon-ink/80 leading-relaxed space-y-3">
              <p className="m-0">
                Indonesia is home to over <strong>21 million registered digital asset investors</strong> (Bappebti
                2024), consistently ranking among the Top 7 worldwide in the Chainalysis Global Crypto Adoption Index.
                In contrast, fewer than <strong>1.1 million citizens hold retail sovereign debt (SBN Ritel)</strong>{" "}
                through the traditional Single Investor Identification (SID) system at KSEI.
              </p>
              <p className="m-0">
                This <strong>20x structural gap</strong> exists not because citizens lack appetite for secure,
                government-guaranteed returns (~6.5% p.a.), but because sovereign debt has historically been locked
                inside restricted banking distribution windows (opened only 4–6 times per year), burdened by manual
                paperwork, and restricted by illiquid secondary trading with T+2 clearing delays.
              </p>
              <p className="m-0 font-medium text-kupon-ink">
                Kupon transforms national retail bonds into programmable smart tokens that settle atomically 24/7 on
                Layer 2 infrastructure, bringing sovereign yield directly to where citizen digital wealth already
                resides.
              </p>
            </div>
          </div>

          {/* Right Column (5 cols): Settlement Comparison */}
          <div className="lg:col-span-5 bg-[#FAF6EC] p-6 sm:p-8 rounded-xl border border-kupon-gold/30 shadow-xs flex flex-col justify-between gap-5">
            <div className="space-y-1 border-b border-kupon-gold/20 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-kupon-ink/60">
                  Infrastructure Comparison
                </span>
                <span className="text-[10px] font-mono text-kupon-emerald bg-kupon-emerald/10 px-2 py-0.5 rounded border border-kupon-emerald/20">
                  Institutional Delta
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-kupon-ink m-0">Legacy Banking vs. Kupon Onchain SBN</h3>
            </div>

            <div className="flex flex-col gap-3 text-xs font-mono">
              {/* Legacy SBN */}
              <div className="bg-[#F8F3E5] p-3.5 rounded-lg border border-kupon-gold/20 space-y-1">
                <span className="text-kupon-ink/50 uppercase text-[10px] block">Legacy Retail Bond Model</span>
                <div className="font-semibold text-error">T+2 Settlement · 4x/Year Windows</div>
                <p className="font-sans text-[11px] text-kupon-ink/70 m-0 leading-normal">
                  Limited bank operating hours, manual SID forms, quota exhaustion, and delayed secondary liquidity.
                </p>
              </div>

              {/* Kupon Onchain */}
              <div className="bg-[#EEF7F2] p-3.5 rounded-lg border border-kupon-emerald/30 space-y-1">
                <span className="text-kupon-emerald uppercase text-[10px] block font-bold">
                  Kupon Autonomous Standard
                </span>
                <div className="font-semibold text-kupon-emerald">Instant T+0 DvP · 24/7 Secondary Trading</div>
                <p className="font-sans text-[11px] text-kupon-ink/70 m-0 leading-normal">
                  Automated bytecode KSEI SID gate, atomic monthly coupon distributions, and self-custody backed by UU
                  APBN.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-kupon-gold/20 text-[11px] font-mono text-kupon-ink/60 flex items-center justify-between">
              <span>Settlement Finality:</span>
              <span className="font-bold text-kupon-emerald">&lt; 2 Seconds (Base L2)</span>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* SECTION 2: THREE STATUTORY PILLARS (3-COLUMN GRID) */}
        {/* ===================================================================== */}
        <section className="bg-[#F8F3E5] p-6 sm:p-8 rounded-xl border border-kupon-gold/30 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-kupon-gold/20 pb-4 gap-2">
            <div className="flex items-center gap-2">
              <ScaleIcon className="w-5 h-5 text-kupon-gold shrink-0" />
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-kupon-ink m-0">
                  2. Statutory &amp; Regulatory Pillars (Indonesian Law)
                </h2>
                <p className="text-xs text-kupon-ink/70 font-sans m-0 mt-0.5">
                  Three legal anchors establishing legal certainty, regulatory sandbox eligibility, and digital
                  settlement.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-kupon-ink/60 uppercase self-start sm:self-auto">
              National Jurisprudence
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="bg-[#FAF6EC] p-5 sm:p-6 rounded-xl border border-kupon-gold/25 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-kupon-emerald bg-kupon-emerald/10 px-2 py-0.5 rounded border border-kupon-emerald/20 inline-block">
                  Primary Legislation
                </span>
                <h3 className="font-serif font-bold text-base sm:text-lg text-kupon-ink m-0">
                  UU No. 4/2023 (UU P2SK)
                </h3>
                <p className="text-xs font-mono text-kupon-ink/50 m-0">Financial Sector Omnibus Law</p>
                <p className="text-xs font-sans text-kupon-ink/75 leading-relaxed m-0 pt-1">
                  Chapter on Financial Sector Technological Innovation (ITSK) mandates the integration of digital
                  financial assets into the formal economy under OJK. It legally recognizes distributed ledger
                  infrastructure for innovative financial products.
                </p>
              </div>
              <div className="pt-2 border-t border-kupon-gold/15 text-[11px] font-mono text-kupon-ink/60">
                Scope: Chapter XVI (ITSK Framework)
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-[#FAF6EC] p-5 sm:p-6 rounded-xl border border-kupon-gold/25 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-kupon-gold bg-kupon-gold/10 px-2 py-0.5 rounded border border-kupon-gold/20 inline-block">
                  Regulatory Sandbox
                </span>
                <h3 className="font-serif font-bold text-base sm:text-lg text-kupon-ink m-0">POJK No. 3/2024</h3>
                <p className="text-xs font-mono text-kupon-ink/50 m-0">OJK Testing Space (IAJD)</p>
                <p className="text-xs font-sans text-kupon-ink/75 leading-relaxed m-0 pt-1">
                  OJK establishes the active regulatory testing space for Digital Financial Assets (IAJD). Asset-backed
                  tokenization (Real-World Assets / RWA) is officially categorized as a priority cluster to deepen
                  domestic capital markets and expand inclusion.
                </p>
              </div>
              <div className="pt-2 border-t border-kupon-gold/15 text-[11px] font-mono text-kupon-ink/60">
                Cluster: Asset-Backed Securities (RWA)
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-[#FAF6EC] p-5 sm:p-6 rounded-xl border border-kupon-gold/25 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-kupon-ink/70 bg-[#EAE2C8] px-2 py-0.5 rounded inline-block">
                  Central Bank Roadmap
                </span>
                <h3 className="font-serif font-bold text-base sm:text-lg text-kupon-ink m-0">
                  Project Garuda (BI CBDC)
                </h3>
                <p className="text-xs font-mono text-kupon-ink/50 m-0">Wholesale Digital Rupiah</p>
                <p className="text-xs font-sans text-kupon-ink/75 leading-relaxed m-0 pt-1">
                  Bank Indonesia&apos;s whitepaper establishes the future architectural interface between wholesale CBDC
                  (Digital Rupiah) and tokenized sovereign securities, enabling atomic Delivery-versus-Payment (DvP)
                  without commercial bank intermediary risk.
                </p>
              </div>
              <div className="pt-2 border-t border-kupon-gold/15 text-[11px] font-mono text-kupon-ink/60">
                Interface: Atomic Securities DvP
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* SECTION 3: STATUTORY MAPPING TABLE (LAW -> BYTECODE) */}
        {/* ===================================================================== */}
        <section className="bg-[#F8F3E5] p-6 sm:p-8 rounded-xl border border-kupon-gold/30 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-kupon-gold/20 pb-4 gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-kupon-emerald shrink-0" />
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-kupon-ink m-0">
                  3. Mapping Real-World Law to Smart Contract Bytecode
                </h2>
                <p className="text-xs text-kupon-ink/70 font-sans m-0 mt-0.5">
                  Every compliance check in Kupon corresponds 1:1 to an explicit statutory requirement enforced by DJPPR
                  and KSEI.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-kupon-emerald uppercase bg-kupon-emerald/10 px-2 py-0.5 rounded border border-kupon-emerald/20 self-start sm:self-auto">
              Deterministic Bytecode
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-sm w-full font-sans text-xs">
              <thead>
                <tr className="border-b border-kupon-gold/30 text-kupon-ink/60 font-mono text-[11px] uppercase tracking-wider">
                  <th className="bg-transparent py-3">Statutory Mandate</th>
                  <th className="bg-transparent py-3">Indonesian Legal Source</th>
                  <th className="bg-transparent py-3">Smart Contract Component</th>
                  <th className="bg-transparent py-3">Bytecode Invariant Action</th>
                </tr>
              </thead>
              <tbody>
                {STATUTORY_MAPPING.map((item, idx) => (
                  <tr
                    key={item.mandate}
                    className={`border-b border-kupon-gold/15 transition-colors ${
                      idx % 2 === 0 ? "bg-[#FAF6EC]/50" : "bg-[#FAF6EC]/20"
                    } hover:bg-[#FAF6EC]`}
                  >
                    <td className="py-3 font-semibold text-kupon-ink">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-xs font-mono bg-kupon-gold/20 text-kupon-ink border border-kupon-gold/40">
                          {item.badge}
                        </span>
                        <span>{item.mandate}</span>
                      </div>
                    </td>
                    <td className="py-3 text-kupon-ink/75 font-mono text-[11px]">{item.law}</td>
                    <td className="py-3 font-mono font-medium text-kupon-emerald text-[11px]">{item.contract}</td>
                    <td className="py-3 text-kupon-ink/80 text-[11px] font-sans">{item.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* SECTION 4: THREE-TIER STAKEHOLDER ARCHITECTURE */}
        {/* ===================================================================== */}
        <section className="bg-[#F8F3E5] p-6 sm:p-8 rounded-xl border border-kupon-gold/30 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-kupon-gold/20 pb-4 gap-2">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-kupon-gold shrink-0" />
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-kupon-ink m-0">
                  4. Multi-Tier Stakeholder Architecture
                </h2>
                <p className="text-xs text-kupon-ink/70 font-sans m-0 mt-0.5">
                  Kupon unites citizen investors, sovereign registrars, and financial regulators into an integrated
                  ecosystem.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-kupon-ink/60 uppercase self-start sm:self-auto">
              Separation of Roles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1: Citizen */}
            <div className="bg-[#FAF6EC] p-5 sm:p-6 rounded-xl border border-kupon-gold/25 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-kupon-emerald bg-kupon-emerald/10 px-2 py-0.5 rounded border border-kupon-emerald/20 inline-block">
                  Citizen Tier
                </span>
                <h3 className="font-serif font-bold text-base sm:text-lg text-kupon-ink m-0">Investor Custody Desk</h3>
                <p className="text-xs font-sans text-kupon-ink/75 leading-relaxed m-0">
                  Self-custody verified sovereign debt (ORI026-T3), receive monthly automated coupons every 15th, and
                  trade 24/7 on the peer-to-peer secondary market with automated pre-flight checks.
                </p>
              </div>
              <div className="pt-3 border-t border-kupon-gold/15">
                <Link
                  href="/app"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-kupon-emerald hover:underline"
                >
                  <span>Launch Investor App</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Tier 2: Government */}
            <div className="bg-[#FAF6EC] p-5 sm:p-6 rounded-xl border border-kupon-gold/25 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-kupon-gold bg-kupon-gold/10 px-2 py-0.5 rounded border border-kupon-gold/20 inline-block">
                  Government Authority
                </span>
                <h3 className="font-serif font-bold text-base sm:text-lg text-kupon-ink m-0">
                  Registrar Certification Desk
                </h3>
                <p className="text-xs font-sans text-kupon-ink/75 leading-relaxed m-0">
                  Authenticate citizen National Identity (NIK / KSEI SID) in KuponClaimRegistry, certify institutional
                  accreditations, and supervise tranche issuance parameters.
                </p>
              </div>
              <div className="pt-3 border-t border-kupon-gold/15">
                <Link
                  href="/registrar"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-kupon-gold hover:underline"
                >
                  <span>Open Registrar Desk</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Tier 3: Regulator */}
            <div className="bg-[#FAF6EC] p-5 sm:p-6 rounded-xl border border-kupon-gold/25 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-kupon-ink/80 bg-[#EAE2C8] px-2 py-0.5 rounded inline-block">
                  Supervisory Node
                </span>
                <h3 className="font-serif font-bold text-base sm:text-lg text-kupon-ink m-0">Regulator Terminal</h3>
                <p className="text-xs font-sans text-kupon-ink/75 leading-relaxed m-0">
                  Supervise real-time compliance telemetry, evaluate transfer validity via 0-gas eth_call simulations,
                  and audit the 4-act sovereign rule narrative without offchain dependencies.
                </p>
              </div>
              <div className="pt-3 border-t border-kupon-gold/15">
                <Link
                  href="/regulator"
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-kupon-ink hover:underline"
                >
                  <span>Open Regulator Terminal</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* SECTION 5: HACKATHON DEMONSTRATION DISCLOSURE */}
        {/* ===================================================================== */}
        <section className="bg-[#F8F3E5] p-6 sm:p-8 rounded-xl border border-kupon-gold/30 shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2 font-serif font-bold text-sm text-amber-900">
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Hackathon Demonstration &amp; Educational Disclosure</span>
          </div>
          <p className="text-xs font-sans text-kupon-ink/80 leading-relaxed m-0">
            Kupon is an educational and technical demonstration developed for <strong>ETHGlobal ETHOnline 2026</strong>.
            It models a fictional Indonesian sovereign bond (&quot;SBN Ritel 2027&quot;) to showcase how onchain
            compliance architecture operates under real-world statutory constraints. This project is not affiliated with
            or authorized by the Ministry of Finance of the Republic of Indonesia (Kemenkeu), Bank Indonesia, or
            Otoritas Jasa Keuangan (OJK). It does not constitute an offering, underwriting, or solicitation of
            securities.
          </p>
        </section>

        {/* ===================================================================== */}
        {/* FOOTER & NAVIGATION */}
        {/* ===================================================================== */}
        <footer className="flex flex-wrap items-center justify-between border-t border-kupon-gold/30 pt-5 text-xs text-kupon-ink/70 font-sans gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/" className="text-kupon-emerald hover:underline font-medium">
              ← Home
            </Link>
            <span className="text-kupon-ink/30">·</span>
            <Link href="/app" className="text-kupon-emerald hover:underline font-medium">
              Investor Portal →
            </Link>
            <span className="text-kupon-ink/30">·</span>
            <Link href="/registrar" className="text-kupon-gold hover:underline font-medium">
              Registrar Desk →
            </Link>
            <span className="text-kupon-ink/30">·</span>
            <Link href="/regulator" className="text-kupon-ink hover:underline font-medium">
              Regulator Terminal →
            </Link>
            <span className="text-kupon-ink/30">·</span>
            <Link href="/debugger" className="text-kupon-ink/70 hover:underline font-medium">
              Debugger →
            </Link>
          </div>
          <div className="font-mono text-[11px] text-kupon-ink/60">
            Governance Standard: <code className="text-kupon-emerald font-semibold">UU P2SK · POJK 3/2024</code>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default FrameworkPage;
