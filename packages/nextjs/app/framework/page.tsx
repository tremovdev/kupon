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
  title: "Regulatory & Legal Framework — Kupon Sovereign RWA",
  description:
    "A clear, practical guide to how Kupon brings Indonesian sovereign retail bonds (SBN Ritel) onchain under UU P2SK and OJK POJK 3/2024.",
});

const STATUTORY_RULES = [
  {
    code: "Rule R1",
    badgeColor: "bg-kupon-emerald/10 text-kupon-emerald border-kupon-emerald/25",
    title: "Indonesian Citizen Access Only (WNI)",
    law: "Ministry of Finance (PMK SBN Ritel) & KSEI SID Mandate",
    mechanism:
      "Every wallet must be verified with an active Indonesian citizen identity claim (NIK & KSEI SID). Unverified foreign accounts are automatically blocked.",
    benefit: "Guarantees national debt stays strictly in citizen hands",
  },
  {
    code: "Rule R2",
    badgeColor: "bg-kupon-gold/15 text-kupon-ink border-kupon-gold/30",
    title: "Anti-Whale Retail Quota Protection",
    law: "DJPPR Ministry of Finance Statutory Limit (Max Rp5B / Investor)",
    mechanism:
      "Limits retail investor holdings to a maximum of 5,000 KPON (Rp5 Billion). Any order or secondary transfer exceeding this ceiling is automatically rejected.",
    benefit: "Prevents whale concentration & ensures fair public access",
  },
  {
    code: "Rule R3",
    badgeColor: "bg-error/10 text-error border-error/25",
    title: "Targeted Emergency Freeze (Sanctions & AML)",
    law: "PPATK & OJK Financial Sanctions Directives",
    mechanism:
      "If a wallet is flagged for legal sanctions, authorities revoke its certification. Outgoing transfers halt immediately while legitimate markets stay open 24/7.",
    benefit: "Isolates bad actors without closing the national market",
  },
  {
    code: "Debt Cap",
    badgeColor: "bg-[#EAE2C8] text-kupon-ink border-kupon-gold/30",
    title: "National Debt Ceiling Enforcement",
    law: "State Budget Law (UU APBN Sovereign Issuance Quota)",
    contract: "KuponToken.SERIES_CAP",
    mechanism:
      "A hardcoded issuance limit of 100,000 KPON (Rp100 Billion). No entity—not even the contract owner—can mint bonds beyond the authorized government quota.",
    benefit: "Eliminates unauthorized dilution and unauthorized debt creation",
  },
  {
    code: "Instant DvP",
    badgeColor: "bg-kupon-emerald/10 text-kupon-emerald border-kupon-emerald/25",
    title: "Instant Delivery-versus-Payment (T+0)",
    law: "OJK POJK 3/2024 Sandbox & Bank Indonesia Project Garuda",
    mechanism:
      "Bonds and payment swap simultaneously in a single atomic transaction. No 2-day waiting delay, eliminating broker counterparty and settlement failure risks.",
    benefit: "Instant 24/7 liquidity with zero settlement risk",
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
        {/* HEADER: POLICY BRIEFING */}
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
              <span>Regulatory Policy Briefing</span>
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
                Regulatory &amp; Legal Framework
              </h1>
              <p className="text-sm sm:text-base text-kupon-ink/75 font-sans leading-relaxed max-w-4xl m-0 pt-1">
                A practical guide to how Kupon operationalizes Indonesian sovereign retail bonds (SBN Ritel) onchain
                under the Financial Omnibus Law (<strong>UU No. 4/2023 P2SK</strong>), Otoritas Jasa Keuangan sandbox
                rules (<strong>POJK No. 3/2024</strong>), and Bank Indonesia&apos;s digital currency roadmap.
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
                <span className="text-[10px] text-kupon-ink/50 uppercase tracking-wider block">
                  Supervisory Authority
                </span>
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
                  Compliance Architecture
                </span>
                <span className="font-bold text-kupon-emerald text-sm">ERC-3643 Standard</span>
                <span className="text-[11px] text-kupon-ink/60 font-sans block">KSEI SID Identity Gate</span>
              </div>
            </div>
          </div>
        </header>

        {/* ===================================================================== */}
        {/* SECTION 1: MACRO THESIS (7 : 5 ASYMMETRIC GRID) */}
        {/* ===================================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column (7 cols): Deconstructed Editorial Blocks */}
          <div className="lg:col-span-7 bg-[#F8F3E5] p-6 sm:p-8 rounded-xl border border-kupon-gold/30 shadow-xs flex flex-col justify-between gap-5">
            <div className="flex items-center justify-between border-b border-kupon-gold/20 pb-3">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-kupon-emerald shrink-0" />
                <h2 className="text-xl font-serif font-bold text-kupon-ink m-0">
                  1. Why Sovereign Bonds Need Modern Onchain Infrastructure
                </h2>
              </div>
              <span className="text-[10px] font-mono text-kupon-emerald font-semibold bg-kupon-emerald/10 px-2 py-0.5 rounded border border-kupon-emerald/20 shrink-0">
                Macro Thesis
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {/* Block 1: The Adoption Paradox */}
              <div className="bg-[#FAF6EC] p-4 sm:p-5 rounded-xl border border-kupon-gold/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-kupon-emerald" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-kupon-ink/60">
                      The Market Opportunity
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-sans text-kupon-ink/85 leading-relaxed m-0">
                    Indonesia is home to over <strong>21 million registered digital asset investors</strong> (Bappebti
                    2024). Yet fewer than <strong>1.1 million citizens hold retail government bonds (SBN Ritel)</strong>{" "}
                    through the traditional banking depository system.
                  </p>
                </div>
                <div className="bg-[#F8F3E5] px-4 py-2.5 rounded-lg border border-kupon-gold/30 text-center shrink-0 self-stretch sm:self-auto flex sm:flex-col justify-between sm:justify-center items-center">
                  <span className="font-serif font-bold text-xl sm:text-2xl text-kupon-ink leading-none">20x</span>
                  <span className="text-[10px] font-mono text-kupon-ink/55 uppercase tracking-wider mt-0.5">
                    Adoption Gap
                  </span>
                </div>
              </div>

              {/* Block 2: The Legacy Friction */}
              <div className="bg-[#FAF6EC] p-4 sm:p-5 rounded-xl border border-kupon-gold/25 flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-error" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-kupon-ink/60">
                    Why Does This Gap Exist?
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-sans text-kupon-ink/80 leading-relaxed m-0">
                  Citizens eagerly seek safe sovereign yields (~6.5% p.a.), but traditional debt is trapped behind
                  legacy friction: banks open subscription windows only 4–6 times per year, require cumbersome
                  paperwork, and lock investor capital behind slow 2-day (T+2) clearing with zero weekend liquidity.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[10px] font-mono text-error/80 bg-error/10 px-2 py-0.5 rounded border border-error/20">
                    ✕ 4–6 Windows / Year
                  </span>
                  <span className="text-[10px] font-mono text-error/80 bg-error/10 px-2 py-0.5 rounded border border-error/20">
                    ✕ Cumbersome Paperwork
                  </span>
                  <span className="text-[10px] font-mono text-error/80 bg-error/10 px-2 py-0.5 rounded border border-error/20">
                    ✕ T+2 Settlement Delays
                  </span>
                </div>
              </div>

              {/* Block 3: The Autonomous Solution */}
              <div className="bg-[#EEF7F2] p-4 sm:p-5 rounded-xl border border-kupon-emerald/30 flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-kupon-emerald animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-kupon-emerald">
                    The Autonomous Solution
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-sans text-kupon-ink/85 leading-relaxed m-0">
                  Kupon bridges this divide by tokenizing national retail debt on modern Layer 2 networks. Citizens can
                  subscribe and trade 24/7 with instant T+0 settlement, while smart contracts automatically enforce
                  every statutory requirement onchain.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[10px] font-mono text-kupon-emerald bg-kupon-emerald/10 px-2 py-0.5 rounded border border-kupon-emerald/25">
                    ✓ 24/7 Continuous Access
                  </span>
                  <span className="text-[10px] font-mono text-kupon-emerald bg-kupon-emerald/10 px-2 py-0.5 rounded border border-kupon-emerald/25">
                    ✓ Instant T+0 Atomic Settlement
                  </span>
                  <span className="text-[10px] font-mono text-kupon-emerald bg-kupon-emerald/10 px-2 py-0.5 rounded border border-kupon-emerald/25">
                    ✓ Bytecode Rule Compliance
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Practical Comparison */}
          <div className="lg:col-span-5 bg-[#FAF6EC] p-6 sm:p-8 rounded-xl border border-kupon-gold/30 shadow-xs flex flex-col justify-between gap-5">
            <div className="space-y-1 border-b border-kupon-gold/20 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-kupon-ink/60">
                  Practical Comparison
                </span>
                <span className="text-[10px] font-mono text-kupon-emerald bg-kupon-emerald/10 px-2 py-0.5 rounded border border-kupon-emerald/20">
                  Citizen Experience
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-kupon-ink m-0">
                Traditional Bank Bonds vs. Kupon Onchain
              </h3>
            </div>

            <div className="flex flex-col gap-4 text-xs font-mono">
              {/* Traditional Bank Model */}
              <div className="bg-[#F8F3E5] p-4 rounded-xl border border-kupon-gold/25 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-kupon-ink/60 uppercase text-[10px] font-bold">Traditional Bank SBN</span>
                  <span className="text-[10px] font-mono text-error font-semibold bg-error/10 px-1.5 py-0.2 rounded border border-error/20">
                    Legacy Model
                  </span>
                </div>
                <div className="space-y-1.5 font-sans text-xs text-kupon-ink/75">
                  <div className="flex items-start gap-2">
                    <span className="text-error font-mono font-bold">✕</span>
                    <span>
                      <strong>Trading Hours:</strong> Restricted to branch banking hours; closed weekends
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-error font-mono font-bold">✕</span>
                    <span>
                      <strong>Clearing Speed:</strong> T+2 multi-day wait with broker counterparty risk
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-error font-mono font-bold">✕</span>
                    <span>
                      <strong>Secondary Exit:</strong> Illiquid P2P trading with manual paperwork fees
                    </span>
                  </div>
                </div>
              </div>

              {/* Kupon Onchain Model */}
              <div className="bg-[#EEF7F2] p-4 rounded-xl border border-kupon-emerald/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-kupon-emerald uppercase text-[10px] font-bold">Kupon Autonomous Standard</span>
                  <span className="text-[10px] font-mono text-kupon-emerald font-semibold bg-kupon-emerald/10 px-1.5 py-0.2 rounded border border-kupon-emerald/20">
                    Modern Standard
                  </span>
                </div>
                <div className="space-y-1.5 font-sans text-xs text-kupon-ink/85">
                  <div className="flex items-start gap-2">
                    <span className="text-kupon-emerald font-mono font-bold">✓</span>
                    <span>
                      <strong>Trading Hours:</strong> 24/7/365 continuous open access on Layer 2
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-kupon-emerald font-mono font-bold">✓</span>
                    <span>
                      <strong>Clearing Speed:</strong> Instant atomic T+0 Delivery-versus-Payment (&lt; 2s)
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-kupon-emerald font-mono font-bold">✓</span>
                    <span>
                      <strong>Cashflow Yields:</strong> Monthly coupons auto-credited directly to wallet
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-kupon-gold/20 text-[11px] font-mono text-kupon-ink/60 flex items-center justify-between">
              <span>Settlement Finality:</span>
              <span className="font-bold text-kupon-emerald">&lt; 2 Seconds (Atomic DvP)</span>
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
                  2. Three Legal Foundations
                </h2>
                <p className="text-xs text-kupon-ink/70 font-sans m-0 mt-0.5">
                  How Indonesian national laws support onchain debt tokenization and automated financial settlement.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-kupon-ink/60 uppercase self-start sm:self-auto">
              National Legislation
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
                  The national law establishing the financial technology framework. It legally recognizes distributed
                  ledger technology (DLT) as permissible infrastructure for innovative financial assets under OJK
                  supervision.
                </p>
              </div>
              <div className="pt-2 border-t border-kupon-gold/15 text-[11px] font-mono text-kupon-ink/60">
                Scope: Chapter XVI (Financial Innovation)
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
                  OJK&apos;s active regulatory testing space for Digital Financial Assets. Asset-backed tokenization
                  (Real-World Assets / RWA) is officially categorized as a priority cluster to deepen capital markets
                  and democratize citizen investment.
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
                  Bank Indonesia&apos;s strategic blueprint for wholesale CBDC (Digital Rupiah). It designs atomic
                  Delivery-versus-Payment (DvP) where digital currency and tokenized sovereign securities settle
                  together without commercial bank risk.
                </p>
              </div>
              <div className="pt-2 border-t border-kupon-gold/15 text-[11px] font-mono text-kupon-ink/60">
                Integration: Atomic DvP Settlement
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* SECTION 3: PRACTICAL REGULATORY RULES TABLE (NO OVERLAPPING BADGES) */}
        {/* ===================================================================== */}
        <section className="bg-[#F8F3E5] p-6 sm:p-8 rounded-xl border border-kupon-gold/30 shadow-xs flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-kupon-gold/20 pb-4 gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-5 h-5 text-kupon-emerald shrink-0" />
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-kupon-ink m-0">
                  3. How Indonesian Regulations are Enforced Onchain
                </h2>
                <p className="text-xs text-kupon-ink/70 font-sans m-0 mt-0.5">
                  Real-world rules from the Ministry of Finance (Kemenkeu), OJK, and Bank Indonesia translated into
                  plain terms.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-kupon-emerald uppercase bg-kupon-emerald/10 px-2 py-0.5 rounded border border-kupon-emerald/20 self-start sm:self-auto">
              Automated Compliance
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-sm w-full font-sans text-xs">
              <thead>
                <tr className="border-b border-kupon-gold/30 text-kupon-ink/60 font-mono text-[11px] uppercase tracking-wider">
                  <th className="bg-transparent py-3 px-3 w-[80px]">Rule</th>
                  <th className="bg-transparent py-3 px-3 w-[220px]">Protection Mandate</th>
                  <th className="bg-transparent py-3 px-3 w-[240px]">Indonesian Legal Grounding</th>
                  <th className="bg-transparent py-3 px-3">How It Works Onchain</th>
                  <th className="bg-transparent py-3 px-3 w-[240px]">Practical Outcome</th>
                </tr>
              </thead>
              <tbody>
                {STATUTORY_RULES.map((item, idx) => (
                  <tr
                    key={item.code}
                    className={`border-b border-kupon-gold/15 transition-colors ${
                      idx % 2 === 0 ? "bg-[#FAF6EC]/50" : "bg-[#FAF6EC]/20"
                    } hover:bg-[#FAF6EC]`}
                  >
                    {/* Clean separate rule tag column with shrink-0 and whitespace-nowrap */}
                    <td className="py-3 px-3 align-top">
                      <span
                        className={`inline-block whitespace-nowrap text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${item.badgeColor}`}
                      >
                        {item.code}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="py-3 px-3 font-semibold text-kupon-ink align-top">{item.title}</td>

                    {/* Legal Basis */}
                    <td className="py-3 px-3 text-kupon-ink/75 font-mono text-[11px] align-top">{item.law}</td>

                    {/* Plain English Explanation */}
                    <td className="py-3 px-3 text-kupon-ink/80 text-xs font-sans leading-relaxed align-top">
                      {item.mechanism}
                    </td>

                    {/* Practical Benefit */}
                    <td className="py-3 px-3 text-kupon-emerald font-medium text-xs font-sans align-top">
                      ✓ {item.benefit}
                    </td>
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
                  4. Built for Citizens, Issuers, and Regulators
                </h2>
                <p className="text-xs text-kupon-ink/70 font-sans m-0 mt-0.5">
                  Three tailored portals connecting every participant in the sovereign bond lifecycle.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-kupon-ink/60 uppercase self-start sm:self-auto">
              Role-Based Architecture
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1: Citizen */}
            <div className="bg-[#FAF6EC] p-5 sm:p-6 rounded-xl border border-kupon-gold/25 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase font-bold text-kupon-emerald bg-kupon-emerald/10 px-2 py-0.5 rounded border border-kupon-emerald/20 inline-block">
                  For Citizens
                </span>
                <h3 className="font-serif font-bold text-base sm:text-lg text-kupon-ink m-0">Investor Custody Desk</h3>
                <p className="text-xs font-sans text-kupon-ink/75 leading-relaxed m-0">
                  Buy, hold, and trade government bonds 24/7. Receive automated monthly coupon cashflow deposited
                  directly to your self-custody wallet, backed by state budget law (UU APBN).
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
                  For Government Authority
                </span>
                <h3 className="font-serif font-bold text-base sm:text-lg text-kupon-ink m-0">
                  Registrar Certification Desk
                </h3>
                <p className="text-xs font-sans text-kupon-ink/75 leading-relaxed m-0">
                  Authenticate citizen identity (NIK / KSEI SID), grant compliance claims onchain, and supervise primary
                  bond tranche allocations within statutory debt caps.
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
                  For Financial Regulators
                </span>
                <h3 className="font-serif font-bold text-base sm:text-lg text-kupon-ink m-0">Regulator Terminal</h3>
                <p className="text-xs font-sans text-kupon-ink/75 leading-relaxed m-0">
                  Supervise real-time compliance telemetry, simulate transfer rules with zero gas, and audit the 4-act
                  statutory lifecycle transparently onchain.
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
            Kupon is an educational and technical prototype developed for <strong>ETHGlobal ETHOnline 2026</strong>. It
            models a fictional Indonesian sovereign bond (&quot;SBN Ritel 2027&quot;) to demonstrate how autonomous
            onchain compliance architecture operates under real-world statutory constraints. This project is not
            affiliated with or authorized by the Ministry of Finance of the Republic of Indonesia (Kemenkeu), Bank
            Indonesia, or Otoritas Jasa Keuangan (OJK). It does not constitute an offering, underwriting, or
            solicitation of securities.
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
