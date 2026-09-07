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

const STAKEHOLDER_ROLES = [
  {
    tier: "Citizen Tier",
    title: "Investor Custody Desk",
    href: "/app",
    cta: "Launch Investor App",
    badgeColor: "bg-kupon-emerald/10 text-kupon-emerald border-kupon-emerald/25",
    description:
      "Buy, hold, and trade government bonds 24/7. Receive automated monthly coupon cashflows deposited directly to your self-custody wallet, guaranteed by state budget law (UU APBN).",
  },
  {
    tier: "Government Authority",
    title: "Registrar Certification Desk",
    href: "/registrar",
    cta: "Open Registrar Desk",
    badgeColor: "bg-kupon-gold/15 text-kupon-ink border-kupon-gold/30",
    description:
      "Authenticate citizen identity (NIK / KSEI SID), grant verified compliance claims onchain, and supervise primary bond tranche allocations within statutory debt caps.",
  },
  {
    tier: "Supervisory Node",
    title: "Regulator Terminal",
    href: "/regulator",
    cta: "Open Regulator Terminal",
    badgeColor: "bg-[#EAE2C8] text-kupon-ink border-kupon-gold/30",
    description:
      "Supervise real-time compliance telemetry, simulate transfer rules with zero gas, and audit the 4-act statutory lifecycle transparently onchain.",
  },
];

const FrameworkPage: NextPage = () => {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EC] text-[#14201C] selection:bg-kupon-gold/30">
      {/* Sovereign Guilloche Watermark */}
      <div className="absolute left-0 top-20 pointer-events-none opacity-[0.03] overflow-hidden">
        <GuillochePattern variant="seal" width={650} height={650} color="emerald" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-20 relative z-10 flex flex-col gap-12">
        {/* ===================================================================== */}
        {/* 1. OPEN BROADSHEET HEADER (ZERO OUTER CARD) */}
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

          <div className="space-y-3 pt-2">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-kupon-ink tracking-tight leading-[1.12] m-0">
              Regulatory &amp; Legal Framework
            </h1>
            <p className="text-base sm:text-lg text-kupon-ink/75 font-sans leading-relaxed max-w-4xl m-0">
              A practical guide to how Kupon operationalizes Indonesian sovereign retail bonds (SBN Ritel) onchain under
              the Financial Omnibus Law (<strong>UU No. 4/2023 P2SK</strong>), Otoritas Jasa Keuangan sandbox rules (
              <strong>POJK No. 3/2024</strong>), and Bank Indonesia&apos;s digital currency roadmap.
            </p>
          </div>

          {/* Continuous Horizontal Ledger Strip (Borrowed from Landing Page) */}
          <div className="border border-kupon-gold/30 bg-[#F4EEDC] py-4 px-6 rounded-xl shadow-2xs divide-y sm:divide-y-0 sm:divide-x divide-kupon-gold/30 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0">
            <div className="sm:pr-6 flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-kupon-ink/50">Jurisdiction</span>
              <span className="font-bold text-kupon-ink text-sm sm:text-base font-mono">Indonesia (RI)</span>
              <span className="text-[11px] text-kupon-ink/60 font-sans">Sovereign Debt Domain</span>
            </div>
            <div className="sm:px-6 pt-3 sm:pt-0 flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-kupon-ink/50">Supervisory Body</span>
              <span className="font-bold text-kupon-emerald text-sm sm:text-base font-mono">OJK (ITSK / IAJD)</span>
              <span className="text-[11px] text-kupon-ink/60 font-sans">Regulatory Sandbox</span>
            </div>
            <div className="sm:px-6 pt-3 sm:pt-0 flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-kupon-ink/50">Sandbox Track</span>
              <span className="font-bold text-kupon-ink text-sm sm:text-base font-mono">Asset Tokenization (RWA)</span>
              <span className="text-[11px] text-kupon-ink/60 font-sans">SBN Ritel Benchmark</span>
            </div>
            <div className="sm:pl-6 pt-3 sm:pt-0 flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-kupon-ink/50">
                Compliance Standard
              </span>
              <span className="font-bold text-kupon-emerald text-sm sm:text-base font-mono">ERC-3643 Standard</span>
              <span className="text-[11px] text-kupon-ink/60 font-sans">KSEI SID Identity Gate</span>
            </div>
          </div>
        </header>

        {/* ===================================================================== */}
        {/* 2. SECTION 1: SIDE-BY-SIDE DUAL-TONE SPLIT LEDGER (BORROWED FROM LANDING) */}
        {/* ===================================================================== */}
        <section className="rounded-xl border border-kupon-gold/30 overflow-hidden shadow-xs grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-kupon-gold/30">
          {/* Left Side: Macro Thesis (7 cols) on Warm Parchment */}
          <div className="lg:col-span-7 bg-[#FAF4E6] p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-1 border-b border-kupon-gold/20 pb-4">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-kupon-emerald shrink-0" />
                <h2 className="text-xl font-serif font-bold text-kupon-ink m-0">1. The Structural Opportunity</h2>
              </div>
              <p className="text-xs font-sans text-kupon-ink/70 m-0">
                Why sovereign debt needs modern onchain distribution in Indonesia.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              {/* Point 1: Opportunity */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-kupon-emerald">
                    The 20x Adoption Paradox
                  </span>
                  <span className="text-[11px] font-mono font-bold text-kupon-ink bg-[#F4EEDC] px-2 py-0.5 rounded border border-kupon-gold/30">
                    20x Gap
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-sans text-kupon-ink/80 leading-relaxed m-0">
                  Indonesia is home to over <strong>21 million registered digital asset investors</strong> (Bappebti
                  2024), ranking consistently among the Top 7 globally in crypto adoption. Yet fewer than{" "}
                  <strong>1.1 million citizens hold retail government bonds (SBN Ritel)</strong> through the traditional
                  banking depository system.
                </p>
              </div>

              {/* Point 2: Legacy Friction */}
              <div className="space-y-1.5 pt-2 border-t border-kupon-gold/15">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-error block">
                  Why Does This Gap Exist?
                </span>
                <p className="text-xs sm:text-sm font-sans text-kupon-ink/80 leading-relaxed m-0">
                  Citizens eagerly seek safe sovereign yields (~6.5% p.a.), but traditional debt is trapped behind
                  legacy friction: banks open subscription windows only 4–6 times per year, require cumbersome
                  paperwork, and lock investor capital behind slow 2-day (T+2) clearing with zero weekend liquidity.
                </p>
              </div>

              {/* Point 3: Solution */}
              <div className="space-y-1.5 pt-2 border-t border-kupon-gold/15">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-kupon-emerald block">
                  The Autonomous Onchain Solution
                </span>
                <p className="text-xs sm:text-sm font-sans text-kupon-ink/85 leading-relaxed m-0">
                  Kupon bridges this divide by tokenizing national retail debt on modern Layer 2 networks. Citizens can
                  subscribe and trade 24/7 with instant T+0 settlement, while smart contracts automatically enforce
                  every statutory requirement onchain.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-kupon-gold/20 flex flex-wrap gap-2 text-[11px] font-mono text-kupon-ink/65">
              <span className="bg-[#FAF6EC] px-2 py-0.5 rounded border border-kupon-gold/25">
                24/7 Secondary Market
              </span>
              <span className="bg-[#FAF6EC] px-2 py-0.5 rounded border border-kupon-gold/25">Instant Atomic T+0</span>
              <span className="bg-[#FAF6EC] px-2 py-0.5 rounded border border-kupon-gold/25">
                Self-Custody Guaranteed
              </span>
            </div>
          </div>

          {/* Right Side: Citizen Experience Comparison (5 cols) on Soft Mint */}
          <div className="lg:col-span-5 bg-[#EEF7F2] p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-1 border-b border-kupon-emerald/20 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-kupon-emerald">
                  Citizen Experience
                </span>
                <span className="text-[10px] font-mono text-kupon-emerald bg-kupon-emerald/15 px-2 py-0.5 rounded border border-kupon-emerald/25">
                  Comparison
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-kupon-ink m-0">Traditional Banking vs. Kupon</h3>
            </div>

            <div className="flex flex-col gap-6 font-sans text-xs">
              {/* Traditional SBN */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-kupon-ink/60 uppercase text-[10px] font-mono font-bold">
                    Traditional Bank SBN
                  </span>
                  <span className="text-[10px] font-mono text-error font-semibold bg-error/10 px-1.5 py-0.2 rounded border border-error/20">
                    Legacy Model
                  </span>
                </div>
                <ul className="space-y-2 list-none p-0 m-0 text-kupon-ink/75">
                  <li className="flex items-start gap-2">
                    <span className="text-error font-mono font-bold">✕</span>
                    <span>
                      <strong>Trading Hours:</strong> Restricted to branch banking hours; closed on weekends
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error font-mono font-bold">✕</span>
                    <span>
                      <strong>Clearing Speed:</strong> Multi-day T+2 wait with broker counterparty risk
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-error font-mono font-bold">✕</span>
                    <span>
                      <strong>Secondary Exit:</strong> Illiquid P2P trading with manual paperwork &amp; wide spreads
                    </span>
                  </li>
                </ul>
              </div>

              {/* Kupon Autonomous Standard */}
              <div className="space-y-2 pt-4 border-t border-kupon-emerald/20">
                <div className="flex items-center justify-between">
                  <span className="text-kupon-emerald uppercase text-[10px] font-mono font-bold">
                    Kupon Autonomous Standard
                  </span>
                  <span className="text-[10px] font-mono text-kupon-emerald font-semibold bg-kupon-emerald/15 px-1.5 py-0.2 rounded border border-kupon-emerald/25">
                    Modern Standard
                  </span>
                </div>
                <ul className="space-y-2 list-none p-0 m-0 text-kupon-ink/90">
                  <li className="flex items-start gap-2">
                    <span className="text-kupon-emerald font-mono font-bold">✓</span>
                    <span>
                      <strong>Trading Hours:</strong> 24/7/365 continuous open access on Base Layer 2
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-kupon-emerald font-mono font-bold">✓</span>
                    <span>
                      <strong>Clearing Speed:</strong> Instant atomic T+0 Delivery-versus-Payment (&lt; 2s)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-kupon-emerald font-mono font-bold">✓</span>
                    <span>
                      <strong>Cashflow Yields:</strong> Monthly coupons auto-credited directly to wallet
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-kupon-emerald/20 text-[11px] font-mono text-kupon-ink/70 flex items-center justify-between">
              <span>Settlement Finality:</span>
              <span className="font-bold text-kupon-emerald">&lt; 2 Seconds (Atomic DvP)</span>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 3. SECTION 2: OPEN BROADSHEET PILLARS (ZERO BOXES / ZERO CARDS) */}
        {/* ===================================================================== */}
        <section className="py-12 px-4 sm:px-8 bg-gradient-to-b from-transparent via-[#F5EFE0]/50 to-transparent border-t border-b border-kupon-gold/25 rounded-2xl flex flex-col gap-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-kupon-gold/20 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-kupon-gold uppercase tracking-wider mb-1 font-semibold">
                <ScaleIcon className="w-4 h-4" />
                <span>National Jurisprudence</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-serif font-bold text-kupon-ink tracking-tight m-0">
                2. Three Legal Foundations
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-kupon-ink/70 font-sans max-w-md m-0">
              National legislation providing statutory certainty, regulatory sandbox eligibility, and digital
              settlement.
            </p>
          </div>

          {/* Open 3-Column Broadsheet with Vertical Dividers (Zero Outer Cards) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-0 lg:divide-x divide-kupon-gold/30 items-start">
            {/* Pillar 01 */}
            <div className="flex flex-col lg:pr-10">
              <div className="text-4xl sm:text-5xl font-serif font-bold text-kupon-emerald mb-3 select-none">01</div>
              <span className="text-[10px] font-mono uppercase font-bold text-kupon-emerald tracking-wider mb-1">
                Primary Legislation
              </span>
              <h3 className="font-serif font-bold text-xl text-kupon-ink mb-2">UU No. 4/2023 (UU P2SK)</h3>
              <p className="text-xs font-mono text-kupon-ink/50 mb-3">Financial Sector Omnibus Law</p>
              <p className="text-xs sm:text-sm font-sans text-kupon-ink/75 leading-relaxed m-0">
                The national law establishing the financial technology framework. It legally recognizes distributed
                ledger technology (DLT) as permissible infrastructure for innovative financial assets under OJK
                supervision.
              </p>
              <div className="mt-6 pt-3 border-t border-kupon-gold/20 text-[11px] font-mono text-kupon-ink/60">
                Scope: Chapter XVI (Financial Innovation)
              </div>
            </div>

            {/* Pillar 02 */}
            <div className="flex flex-col lg:px-10">
              <div className="text-4xl sm:text-5xl font-serif font-bold text-kupon-gold mb-3 select-none">02</div>
              <span className="text-[10px] font-mono uppercase font-bold text-kupon-gold tracking-wider mb-1">
                Regulatory Sandbox
              </span>
              <h3 className="font-serif font-bold text-xl text-kupon-ink mb-2">POJK No. 3/2024</h3>
              <p className="text-xs font-mono text-kupon-ink/50 mb-3">OJK Testing Space (IAJD)</p>
              <p className="text-xs sm:text-sm font-sans text-kupon-ink/75 leading-relaxed m-0">
                OJK&apos;s active regulatory testing space for Digital Financial Assets. Asset-backed tokenization
                (Real-World Assets / RWA) is officially categorized as a priority cluster to deepen capital markets and
                democratize citizen investment.
              </p>
              <div className="mt-6 pt-3 border-t border-kupon-gold/20 text-[11px] font-mono text-kupon-ink/60">
                Cluster: Asset-Backed Securities (RWA)
              </div>
            </div>

            {/* Pillar 03 */}
            <div className="flex flex-col lg:pl-10">
              <div className="text-4xl sm:text-5xl font-serif font-bold text-kupon-ink/70 mb-3 select-none">03</div>
              <span className="text-[10px] font-mono uppercase font-bold text-kupon-ink/70 tracking-wider mb-1">
                Central Bank Roadmap
              </span>
              <h3 className="font-serif font-bold text-xl text-kupon-ink mb-2">Project Garuda (BI CBDC)</h3>
              <p className="text-xs font-mono text-kupon-ink/50 mb-3">Wholesale Digital Rupiah</p>
              <p className="text-xs sm:text-sm font-sans text-kupon-ink/75 leading-relaxed m-0">
                Bank Indonesia&apos;s strategic blueprint for wholesale CBDC (Digital Rupiah). It designs atomic
                Delivery-versus-Payment (DvP) where digital currency and tokenized sovereign securities settle together
                without commercial bank risk.
              </p>
              <div className="mt-6 pt-3 border-t border-kupon-gold/20 text-[11px] font-mono text-kupon-ink/60">
                Integration: Atomic DvP Settlement
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 4. SECTION 3: PRACTICAL REGULATORY RULES BROADSHEET TABLE */}
        {/* ===================================================================== */}
        <section className="bg-[#FAF6EC] p-6 sm:p-8 rounded-xl border border-kupon-gold/30 shadow-xs flex flex-col gap-6">
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
                  <th className="bg-transparent py-3 px-3 w-[90px]">Rule</th>
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
                      idx % 2 === 0 ? "bg-[#F8F3E5]/50" : "bg-[#F8F3E5]/20"
                    } hover:bg-[#F8F3E5]`}
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
        {/* 5. SECTION 4: THREE-TIER STAKEHOLDER DIRECTORY (CARD-LESS DIRECTORY STRIPS) */}
        {/* ===================================================================== */}
        <section className="flex flex-col gap-6">
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
              Role-Based Portals
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {STAKEHOLDER_ROLES.map(role => (
              <div
                key={role.tier}
                className="bg-[#F8F3E5] p-5 sm:p-6 rounded-xl border border-kupon-gold/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:border-kupon-gold/60"
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${role.badgeColor}`}
                    >
                      {role.tier}
                    </span>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-kupon-ink m-0">{role.title}</h3>
                  </div>
                  <p className="text-xs sm:text-sm font-sans text-kupon-ink/75 leading-relaxed m-0">
                    {role.description}
                  </p>
                </div>

                <div className="shrink-0 self-start md:self-center">
                  <Link
                    href={role.href}
                    className="btn btn-sm btn-outline border-kupon-gold/70 text-kupon-ink hover:bg-kupon-gold/15 font-sans font-medium flex items-center gap-1.5"
                  >
                    <span>{role.cta}</span>
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===================================================================== */}
        {/* 6. SECTION 5: MINIMAL EDUCATIONAL DISCLOSURE CALLOUT */}
        {/* ===================================================================== */}
        <section className="bg-[#F4EEDC] p-5 sm:p-6 rounded-xl border-l-4 border-l-kupon-gold border border-kupon-gold/30 text-xs font-sans text-kupon-ink/80 leading-relaxed flex items-start gap-3.5">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-serif font-bold text-sm text-amber-900 block">
              Hackathon Demonstration &amp; Educational Disclosure
            </span>
            <p className="m-0 leading-relaxed">
              Kupon is an educational and technical prototype developed for <strong>ETHGlobal ETHOnline 2026</strong>.
              It models a fictional Indonesian sovereign bond (&quot;SBN Ritel 2027&quot;) to demonstrate how autonomous
              onchain compliance architecture operates under real-world statutory constraints. This project is not
              affiliated with or authorized by the Ministry of Finance of the Republic of Indonesia (Kemenkeu), Bank
              Indonesia, or Otoritas Jasa Keuangan (OJK). It does not constitute an offering, underwriting, or
              solicitation of securities.
            </p>
          </div>
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
