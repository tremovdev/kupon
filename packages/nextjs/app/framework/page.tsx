import Link from "next/link";
import type { NextPage } from "next";
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { GuillochePattern } from "~~/components/GuillochePattern";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Regulatory & Statutory Framework — Kupon Sovereign RWA",
  description:
    "Comprehensive legal, regulatory, and architectural thesis for sovereign debt tokenization under Indonesian law (UU P2SK & OJK POJK 3/2024).",
});

const FrameworkPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-[#FAF6EC] text-[#14201C] selection:bg-kupon-gold/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-kupon-emerald hover:text-kupon-gold transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Return to Homepage</span>
          </Link>
          <span className="text-[11px] font-mono text-kupon-ink/60 uppercase">Institutional Briefing · Q3 2026</span>
        </div>

        {/* Paper Header */}
        <div className="bg-base-100 p-8 sm:p-12 rounded certificate-border shadow-certificate relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 opacity-[0.06] pointer-events-none">
            <GuillochePattern variant="seal" width={280} height={280} color="emerald" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#F4EEDC] border border-kupon-gold/60 text-xs font-mono text-kupon-emerald mb-6">
            <CheckBadgeIcon className="w-4 h-4 text-kupon-emerald" />
            Legal Architecture &amp; Regulatory Sandbox Brief
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-kupon-ink tracking-tight leading-[1.12] mb-6">
            Regulatory &amp; Statutory Framework for Onchain Sovereign Debt
          </h1>

          <p className="text-base sm:text-lg text-kupon-ink/80 font-sans leading-relaxed m-0">
            How autonomous smart contracts align with Indonesian financial law (<strong>UU No. 4/2023 P2SK</strong>),
            Otoritas Jasa Keuangan regulations (<strong>POJK No. 3/2024</strong>), and sovereign retail debt policy.
          </p>

          <div className="mt-8 pt-6 border-t border-kupon-gold/30 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-kupon-ink/70">
            <div>
              <span className="text-[10px] text-kupon-ink/50 uppercase block">Jurisdiction</span>
              <span className="font-semibold text-kupon-ink">Indonesia (RI)</span>
            </div>
            <div>
              <span className="text-[10px] text-kupon-ink/50 uppercase block">Supervisor</span>
              <span className="font-semibold text-kupon-emerald">OJK (ITSK / IAJD)</span>
            </div>
            <div>
              <span className="text-[10px] text-kupon-ink/50 uppercase block">Sandbox Track</span>
              <span className="font-semibold text-kupon-ink">Asset Tokenization</span>
            </div>
            <div>
              <span className="text-[10px] text-kupon-ink/50 uppercase block">Compliance Model</span>
              <span className="font-semibold text-kupon-emerald">ERC-3643 Bytecode</span>
            </div>
          </div>
        </div>

        {/* Section 1: Executive Thesis */}
        <section className="bg-base-100 p-8 sm:p-10 rounded certificate-border shadow-sm flex flex-col gap-5">
          <h2 className="text-2xl font-serif font-bold text-kupon-ink m-0">
            1. The Market Need: Sovereign Yield vs. Crypto Liquidity
          </h2>
          <p className="text-sm sm:text-base font-sans text-kupon-ink/85 leading-relaxed m-0">
            Indonesia is home to over <strong>21 million registered crypto investors</strong> (Bappebti 2024), ranking
            consistently among the Top 7 worldwide in the Chainalysis Global Crypto Adoption Index. In contrast, fewer
            than <strong>1.1 million citizens hold retail sovereign debt (SBN Ritel)</strong> through the traditional
            Single Investor Identification (SID) system at KSEI.
          </p>
          <p className="text-sm sm:text-base font-sans text-kupon-ink/85 leading-relaxed m-0">
            This 20x discrepancy exists not because citizens lack appetite for safe returns, but because sovereign debt
            has been locked inside legacy banking windows (offered only a few times a year), burdened by paperwork, and
            restricted by illiquid secondary trading with T+2 clearing delays. Kupon transforms national bonds into
            digital tokens that trade 24/7 on modern Layer 2 networks, bringing ~6.5% government-backed yield to where
            digital wealth already lives.
          </p>
        </section>

        {/* Section 2: Statutory Anchors */}
        <section className="bg-base-100 p-8 sm:p-10 rounded certificate-border shadow-sm flex flex-col gap-6">
          <h2 className="text-2xl font-serif font-bold text-kupon-ink m-0">2. Statutory &amp; Regulatory Pillars</h2>

          <div className="space-y-6 text-sm font-sans text-kupon-ink/85">
            <div className="p-5 rounded bg-[#F6F0E0] border border-kupon-gold/40">
              <h3 className="font-serif font-bold text-lg text-kupon-emerald mb-2">
                UU No. 4/2023 (UU P2SK) — Financial Sector Omnibus Law
              </h3>
              <p className="leading-relaxed m-0">
                Chapter on Financial Sector Technological Innovation (ITSK) mandates the integration of digital
                financial assets into the formal financial system under the supervision of Otoritas Jasa Keuangan (OJK).
                It formally recognizes distributed ledger technology as a permissible infrastructure for innovative
                financial products.
              </p>
            </div>

            <div className="p-5 rounded bg-[#F6F0E0] border border-kupon-gold/40">
              <h3 className="font-serif font-bold text-lg text-kupon-gold mb-2">
                POJK No. 3/2024 — Regulatory Sandbox Framework
              </h3>
              <p className="leading-relaxed m-0">
                OJK establishes the active regulatory testing space for Digital Financial Assets (IAJD). Asset-backed
                tokenization (Real-World Assets / RWA) is officially recognized as a priority sandbox cluster to improve
                financial market depth and inclusion across Indonesia.
              </p>
            </div>

            <div className="p-5 rounded bg-[#F6F0E0] border border-kupon-gold/40">
              <h3 className="font-serif font-bold text-lg text-kupon-ink mb-2">
                Bank Indonesia: Project Garuda (Digital Rupiah / CBDC)
              </h3>
              <p className="leading-relaxed m-0">
                Bank Indonesia&apos;s published whitepaper outlines the future integration between wholesale CBDC
                (Digital Rupiah) and tokenized sovereign securities, enabling atomic Delivery-versus-Payment (DvP)
                settlement without bank intermediary risk.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Statutory Mapping Table */}
        <section className="bg-base-100 p-8 sm:p-10 rounded certificate-border shadow-sm flex flex-col gap-6">
          <h2 className="text-2xl font-serif font-bold text-kupon-ink m-0">
            3. Mapping Real-World Law to Smart Contract Code
          </h2>
          <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed m-0">
            Every compliance check in Kupon corresponds to a specific statutory requirement enforced by the Ministry of
            Finance (DJPPR) and capital market depository (KSEI).
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b-2 border-kupon-gold/40 text-kupon-emerald font-mono uppercase tracking-wider">
                  <th className="py-3 px-3">Statutory Requirement</th>
                  <th className="py-3 px-3">Real-World Law</th>
                  <th className="py-3 px-3">Kupon Smart Contract</th>
                  <th className="py-3 px-3">Bytecode Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                <tr>
                  <td className="py-3 px-3 font-semibold text-kupon-ink">WNI Citizenship Only</td>
                  <td className="py-3 px-3 text-kupon-ink/70">PMK SBN Ritel / KSEI SID</td>
                  <td className="py-3 px-3 font-mono text-kupon-emerald">KuponClaimRegistry (R1)</td>
                  <td className="py-3 px-3 text-kupon-ink/80">Reverts with Kupon__RuleViolated(R1)</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-kupon-ink">Anti-Whale Order Cap</td>
                  <td className="py-3 px-3 text-kupon-ink/70">DJPPR Max Rp 5M Limit</td>
                  <td className="py-3 px-3 font-mono text-kupon-gold">KuponComplianceModule (R2)</td>
                  <td className="py-3 px-3 text-kupon-ink/80">Enforces 5,000 KPON holding ceiling</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-kupon-ink">Targeted Sanctions / AML</td>
                  <td className="py-3 px-3 text-kupon-ink/70">PPATK / OJK AML Directives</td>
                  <td className="py-3 px-3 font-mono text-red-800">revokeClaim() (R3)</td>
                  <td className="py-3 px-3 text-kupon-ink/80">Freezes wallet; market stays open</td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-kupon-ink">Series Issuance Limit</td>
                  <td className="py-3 px-3 text-kupon-ink/70">UU APBN National Debt Quota</td>
                  <td className="py-3 px-3 font-mono text-kupon-ink">KuponToken.SERIES_CAP</td>
                  <td className="py-3 px-3 text-kupon-ink/80">Blocks minting above 100,000 KPON</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Architecture Diagram & Interfaces */}
        <section className="bg-base-100 p-8 sm:p-10 rounded certificate-border shadow-sm flex flex-col gap-6">
          <h2 className="text-2xl font-serif font-bold text-kupon-ink m-0">4. Live Multi-Role System Architecture</h2>
          <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed m-0">
            Unlike simple utility tokens, Kupon connects three distinct stakeholders into a unified operational
            lifecycle:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-sans">
            <div className="p-5 rounded bg-[#F5EFE0] border border-kupon-gold/30 flex flex-col justify-between">
              <div>
                <div className="font-mono text-[10px] text-kupon-emerald uppercase font-bold mb-1">Citizen Tier</div>
                <h3 className="text-base font-serif font-bold text-kupon-ink mb-2">Investor Portal</h3>
                <p className="text-kupon-ink/75 leading-relaxed m-0">
                  Hold, receive, and transfer bond tokens with automated pre-flight checks before spending gas fees.
                </p>
              </div>
              <Link
                href="/app"
                className="text-xs font-mono font-semibold text-kupon-emerald hover:text-kupon-gold mt-4 inline-flex items-center gap-1"
              >
                <span>Launch App</span>
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-5 rounded bg-[#F5EFE0] border border-kupon-gold/30 flex flex-col justify-between">
              <div>
                <div className="font-mono text-[10px] text-kupon-gold uppercase font-bold mb-1">Government Tier</div>
                <h3 className="text-base font-serif font-bold text-kupon-ink mb-2">Debt Management Office</h3>
                <p className="text-kupon-ink/75 leading-relaxed m-0">
                  Issue bond batches within statutory caps and authorize citizen identity claims onchain.
                </p>
              </div>
              <Link
                href="/registrar"
                className="text-xs font-mono font-semibold text-kupon-emerald hover:text-kupon-gold mt-4 inline-flex items-center gap-1"
              >
                <span>Open Portal</span>
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-5 rounded bg-[#F5EFE0] border border-kupon-gold/30 flex flex-col justify-between">
              <div>
                <div className="font-mono text-[10px] text-kupon-emerald uppercase font-bold mb-1">
                  Supervisory Tier
                </div>
                <h3 className="text-base font-serif font-bold text-kupon-ink mb-2">Regulator Terminal</h3>
                <p className="text-kupon-ink/75 leading-relaxed m-0">
                  Inspect holding distributions, simulate compliance gates, and enforce targeted freezes in real time.
                </p>
              </div>
              <Link
                href="/regulator"
                className="text-xs font-mono font-semibold text-kupon-emerald hover:text-kupon-gold mt-4 inline-flex items-center gap-1"
              >
                <span>Open Terminal</span>
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Section 5: Mandatory Demonstration Notice */}
        <section className="p-6 sm:p-8 rounded bg-[#F4EEDC] border border-kupon-gold/40 text-xs font-sans text-kupon-ink/85 leading-relaxed flex flex-col gap-3">
          <div className="flex items-center gap-2 font-serif font-bold text-sm text-amber-900">
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Hackathon Demonstration &amp; Educational Disclosure</span>
          </div>
          <p className="m-0">
            Kupon is an educational and technical demonstration developed for <strong>ETHGlobal ETHOnline 2026</strong>.
            It models a fictional Indonesian sovereign bond (&quot;SBN Ritel 2027&quot;) to showcase how onchain
            compliance architecture operates under real-world regulatory constraints. This project is not affiliated
            with or authorized by the Ministry of Finance of Indonesia (Kemenkeu), Bank Indonesia, or Otoritas Jasa
            Keuangan (OJK). It does not constitute an offering, underwriting, or solicitation of securities.
          </p>
        </section>
      </div>
    </div>
  );
};

export default FrameworkPage;
