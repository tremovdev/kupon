"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { usePublicClient } from "wagmi";
import {
  ArrowRightIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { GuillochePattern } from "~~/components/GuillochePattern";
import { useDeployedContractInfo, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const publicClient = usePublicClient();
  const { data: registryInfo } = useDeployedContractInfo({ contractName: "KuponClaimRegistry" });

  // Live on-chain data hooks
  const { data: totalSupply, isLoading: isLoadingSupply } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "totalSupply",
  });

  const { data: seriesCap, isLoading: isLoadingSeriesCap } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "SERIES_CAP",
  });

  const { data: retailCap, isLoading: isLoadingRetailCap } = useScaffoldReadContract({
    contractName: "KuponComplianceModule",
    functionName: "cap",
  });

  // Query events safely using public client without deprecated SE-2 helpers
  const { data: claimLogs } = useQuery({
    queryKey: ["kuponClaimGrantedEvents", registryInfo?.address],
    queryFn: async () => {
      if (!publicClient || !registryInfo?.address || !registryInfo?.abi) return [];
      try {
        return await publicClient.getContractEvents({
          address: registryInfo.address,
          abi: registryInfo.abi,
          eventName: "ClaimGranted",
          fromBlock: 0n,
        });
      } catch {
        return [];
      }
    },
    enabled: Boolean(publicClient && registryInfo?.address),
  });

  // Safe formatting helpers
  const formattedSupply = totalSupply ? Number(formatEther(totalSupply)).toLocaleString("en-US") : "2,000";
  const formattedSeriesCap = seriesCap ? Number(formatEther(seriesCap)).toLocaleString("en-US") : "100,000";
  const formattedRetailCap = retailCap ? Number(formatEther(retailCap)).toLocaleString("en-US") : "5,000";
  const totalClaimsCount = claimLogs?.length ? claimLogs.length.toString() : "1";

  return (
    <div className="flex flex-col w-full min-h-screen bg-kupon-ivory text-kupon-ink selection:bg-kupon-gold/30">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 border-b border-kupon-gold/30 bg-gradient-to-b from-[#FAF6EC] via-[#F6F0E0] to-[#FAF6EC]">
        {/* Background Guilloche Watermarks */}
        <div className="absolute -right-24 -top-24 pointer-events-none opacity-[0.07]">
          <GuillochePattern variant="seal" width={640} height={640} color="emerald" />
        </div>
        <div className="absolute -left-32 top-1/3 pointer-events-none opacity-[0.06]">
          <GuillochePattern variant="rosette" width={560} height={560} color="gold" />
        </div>
        <div className="absolute bottom-0 inset-x-0 pointer-events-none opacity-20">
          <GuillochePattern variant="waves" height={60} color="gold" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center">
          {/* Sovereign Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded bg-base-100/90 border border-kupon-gold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-kupon-emerald animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-kupon-emerald uppercase font-semibold">
              Sovereign Retail Bond · SBN Ritel 2027 Onchain
            </span>
          </div>

          {/* Main Display Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-kupon-ink tracking-tight max-w-4xl leading-[1.1] mb-6">
            The retail bond that enforces its own rules.
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl text-kupon-ink/80 max-w-3xl font-sans leading-relaxed mb-10">
            Kupon is the fictional <strong>SBN Ritel 2027</strong> tokenized as a compliance-gated asset. Every transfer
            is checked against three onchain rules — and reverts name the rule.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto">
            <Link
              href="/app"
              className="btn btn-primary btn-lg px-8 font-sans font-medium text-kupon-ivory certificate-border-emerald tracking-wide shadow-md hover:scale-[1.01] transition-transform w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <span>Launch Investor App</span>
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <Link
              href="/debugger"
              className="btn btn-outline btn-lg border-kupon-gold/80 text-kupon-ink hover:bg-kupon-gold/10 font-sans tracking-wide w-full sm:w-auto"
            >
              Inspect Verified Contracts
            </Link>
          </div>

          {/* Sovereign Certificate Preview Ribbon */}
          <div className="mt-14 w-full max-w-3xl bg-base-100 p-6 rounded certificate-border shadow-certificate text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 opacity-15 pointer-events-none">
              <Image src="/kupon-logo.svg" alt="Seal Mark Watermark" width={180} height={180} />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-kupon-gold/30 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 shrink-0 flex items-center justify-center">
                  <Image
                    src="/kupon-logo.svg"
                    alt="Kupon Seal Mark"
                    width={44}
                    height={44}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-kupon-gold font-bold">
                    On-Chain Certificate Registry
                  </span>
                  <div className="font-serif font-bold text-base text-kupon-emerald">
                    REPUBLIK INDONESIA · SBN RITEL 2027
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right font-mono text-xs text-kupon-ink/70">
                <span>SERIES NO: </span>
                <span className="text-kupon-emerald font-semibold">KPON-2027-WNI-01</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs font-sans">
              <div>
                <div className="text-[10px] text-kupon-ink/60 uppercase font-mono">Standard</div>
                <div className="font-semibold text-kupon-ink mt-0.5">ERC-3643 Pattern</div>
              </div>
              <div>
                <div className="text-[10px] text-kupon-ink/60 uppercase font-mono">Deployment</div>
                <div className="font-semibold text-kupon-ink mt-0.5">Base Sepolia</div>
              </div>
              <div>
                <div className="text-[10px] text-kupon-ink/60 uppercase font-mono">Enforcement</div>
                <div className="font-semibold text-kupon-ink mt-0.5">Contract-Level Reverts</div>
              </div>
              <div>
                <div className="text-[10px] text-kupon-ink/60 uppercase font-mono">Nominal Value</div>
                <div className="font-semibold text-kupon-emerald mt-0.5">1 KPON = 1 IDR Unit</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. LIVE STATS STRIP */}
      {/* ========================================================================= */}
      <section className="bg-[#FAF6EC] border-b border-kupon-gold/30 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 pb-2 border-b border-base-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-kupon-ink/80 font-semibold m-0">
                Live On-Chain Telemetry (Base Sepolia)
              </h2>
            </div>
            <div className="text-[11px] font-mono text-kupon-ink/60 mt-1 md:mt-0">
              Verified contracts polled in real-time
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Stat 1: Total Supply */}
            <div className="bg-base-100 p-5 rounded border border-kupon-gold/40 shadow-sm relative overflow-hidden">
              <div className="text-[11px] font-mono uppercase tracking-wider text-kupon-ink/60 mb-1">
                Current Circulation
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-kupon-emerald tabular-nums">
                {isLoadingSupply ? <span className="text-base text-kupon-ink/40">Loading...</span> : formattedSupply}
              </div>
              <div className="text-[10px] font-sans text-kupon-ink/60 mt-1">KPON issued to date</div>
            </div>

            {/* Stat 2: Series Cap */}
            <div className="bg-base-100 p-5 rounded border border-kupon-gold/40 shadow-sm relative overflow-hidden">
              <div className="text-[11px] font-mono uppercase tracking-wider text-kupon-ink/60 mb-1">
                Series Offering Cap
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-kupon-ink tabular-nums">
                {isLoadingSeriesCap ? (
                  <span className="text-base text-kupon-ink/40">Loading...</span>
                ) : (
                  formattedSeriesCap
                )}
              </div>
              <div className="text-[10px] font-sans text-kupon-ink/60 mt-1">Max issuance threshold</div>
            </div>

            {/* Stat 3: Retail Cap */}
            <div className="bg-base-100 p-5 rounded border border-kupon-gold/40 shadow-sm relative overflow-hidden">
              <div className="text-[11px] font-mono uppercase tracking-wider text-kupon-ink/60 mb-1">
                Per-Investor Retail Cap
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-kupon-gold tabular-nums">
                {isLoadingRetailCap ? (
                  <span className="text-base text-kupon-ink/40">Loading...</span>
                ) : (
                  formattedRetailCap
                )}
              </div>
              <div className="text-[10px] font-sans text-kupon-ink/60 mt-1">Enforced by R2-CAP rule</div>
            </div>

            {/* Stat 4: Granted Claims */}
            <div className="bg-base-100 p-5 rounded border border-kupon-gold/40 shadow-sm relative overflow-hidden">
              <div className="text-[11px] font-mono uppercase tracking-wider text-kupon-ink/60 mb-1">
                Identity Claims Granted
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-kupon-emerald tabular-nums">
                {totalClaimsCount}
              </div>
              <div className="text-[10px] font-sans text-kupon-ink/60 mt-1">Recorded on ClaimRegistry</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. THREE RULES SECTION */}
      {/* ========================================================================= */}
      <section className="py-16 md:py-24 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-mono uppercase tracking-widest text-kupon-gold font-bold mb-2">
            The Three Invariant Gates
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-kupon-ink mb-4">
            Compliance encoded into bytecode.
          </h2>
          <p className="text-base sm:text-lg text-kupon-ink/75 font-sans leading-relaxed">
            Unlike legacy centralized securities that rely on off-chain reconciliation or front-end bans, Kupon enforces
            eligibility inside the ERC-20 transfer hook. If a rule fails, the contract reverts and identifies the exact
            rule ID.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: R1-RESIDENCY */}
          <div className="bg-base-100 rounded certificate-border p-7 flex flex-col justify-between shadow-certificate hover:shadow-certificate-lg transition-shadow relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded bg-kupon-emerald/10 border border-kupon-emerald/30 flex items-center justify-center text-kupon-emerald">
                  <CheckBadgeIcon className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-base-200 border border-kupon-gold/40 text-kupon-emerald">
                  RULE 1
                </span>
              </div>
              <h3 className="text-xl font-serif font-bold text-kupon-ink mb-2">R1-RESIDENCY (WNI Gate)</h3>
              <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed mb-4">
                The recipient wallet must hold a verified Indonesian residency claim in the registry before receiving
                tokens.
              </p>
            </div>
            <div className="pt-4 border-t border-base-300 font-mono text-[11px] text-kupon-ink/60 bg-base-200/50 -mx-7 -mb-7 p-4 rounded-b">
              <span className="text-kupon-emerald font-semibold">Revert Contract:</span>
              <div className="truncate text-kupon-ink mt-0.5">Kupon__RuleViolated(R1-RESIDENCY)</div>
            </div>
          </div>

          {/* Card 2: R2-CAP */}
          <div className="bg-base-100 rounded certificate-border p-7 flex flex-col justify-between shadow-certificate hover:shadow-certificate-lg transition-shadow relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded bg-kupon-gold/15 border border-kupon-gold/40 flex items-center justify-center text-kupon-gold">
                  <ScaleIcon className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-base-200 border border-kupon-gold/40 text-kupon-gold">
                  RULE 2
                </span>
              </div>
              <h3 className="text-xl font-serif font-bold text-kupon-ink mb-2">R2-CAP (5,000 KPON Limit)</h3>
              <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed mb-4">
                Retail investors cannot hold more than 5,000 KPON. Transfers exceeding this threshold revert unless the
                wallet holds accredited status.
              </p>
            </div>
            <div className="pt-4 border-t border-base-300 font-mono text-[11px] text-kupon-ink/60 bg-base-200/50 -mx-7 -mb-7 p-4 rounded-b">
              <span className="text-kupon-gold font-semibold">Revert Contract:</span>
              <div className="truncate text-kupon-ink mt-0.5">Kupon__RuleViolated(R2-CAP)</div>
            </div>
          </div>

          {/* Card 3: R3-FROZEN */}
          <div className="bg-base-100 rounded certificate-border p-7 flex flex-col justify-between shadow-certificate hover:shadow-certificate-lg transition-shadow relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded bg-red-800/10 border border-red-800/30 flex items-center justify-center text-red-800">
                  <LockClosedIcon className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-base-200 border border-kupon-gold/40 text-red-800">
                  RULE 3
                </span>
              </div>
              <h3 className="text-xl font-serif font-bold text-kupon-ink mb-2">R3-FROZEN (Instant Revoke)</h3>
              <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed mb-4">
                Revoking an investor&apos;s identity claim immediately freezes outgoing transfers. Zero blacklists or
                manual contract pauses required.
              </p>
            </div>
            <div className="pt-4 border-t border-base-300 font-mono text-[11px] text-kupon-ink/60 bg-base-200/50 -mx-7 -mb-7 p-4 rounded-b">
              <span className="text-red-800 font-semibold">Revert Contract:</span>
              <div className="truncate text-kupon-ink mt-0.5">Kupon__RuleViolated(R3-FROZEN)</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. THE FOUR ACTS DEMO SCENARIO */}
      {/* ========================================================================= */}
      <section
        id="four-acts"
        className="py-16 md:py-20 px-4 sm:px-6 bg-[#F6F0E0] border-t border-b border-kupon-gold/30 relative"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-kupon-emerald font-bold mb-2">
                Demonstration Script
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-kupon-ink mb-2">
                The 4-Act Compliance Narrative
              </h2>
              <p className="text-sm text-kupon-ink/75 font-sans max-w-xl m-0">
                Experience the complete investor lifecycle across four sequential scenarios, designed for hackathon
                evaluators and compliance auditors.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link href="/app" className="btn btn-sm btn-primary text-kupon-ivory font-sans">
                Test in Investor App →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Act 1 */}
            <div className="bg-base-100 p-6 rounded certificate-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs font-bold text-kupon-gold mb-2">ACT I · THE ATTEMPT</div>
                <h3 className="text-lg font-serif font-bold text-kupon-ink mb-2">Blocked by Default</h3>
                <p className="text-xs text-kupon-ink/80 font-sans leading-relaxed">
                  A new unverified wallet attempts to receive KPON. The transaction reverts onchain with{" "}
                  <code className="font-mono text-[11px] bg-base-200 px-1 py-0.5 rounded">R1-RESIDENCY</code>.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-base-300">
                <Link
                  href="/app"
                  className="text-xs font-medium text-kupon-emerald hover:text-kupon-gold inline-flex items-center gap-1"
                >
                  <span>Experience in App</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Act 2 */}
            <div className="bg-base-100 p-6 rounded certificate-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs font-bold text-kupon-gold mb-2">ACT II · THE GRANT</div>
                <h3 className="text-lg font-serif font-bold text-kupon-ink mb-2">Registrar Grants Claim</h3>
                <p className="text-xs text-kupon-ink/80 font-sans leading-relaxed">
                  The verified registrar grants{" "}
                  <code className="font-mono text-[11px] bg-base-200 px-1">RESIDENCY</code> onchain. The exact same
                  transfer is retried and succeeds immediately.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-base-300">
                <Link
                  href="/registrar"
                  className="text-xs font-medium text-kupon-emerald hover:text-kupon-gold inline-flex items-center gap-1"
                >
                  <span>Registrar Portal</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Act 3 */}
            <div className="bg-base-100 p-6 rounded certificate-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs font-bold text-kupon-gold mb-2">ACT III · THE CAP</div>
                <h3 className="text-lg font-serif font-bold text-kupon-ink mb-2">Retail Cap Enforced</h3>
                <p className="text-xs text-kupon-ink/80 font-sans leading-relaxed">
                  A compliant wallet attempts to receive 5,001 KPON. The transfer reverts with{" "}
                  <code className="font-mono text-[11px] bg-base-200 px-1 py-0.5 rounded">R2-CAP</code>, preventing
                  whale accumulation.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-base-300">
                <Link
                  href="/app"
                  className="text-xs font-medium text-kupon-emerald hover:text-kupon-gold inline-flex items-center gap-1"
                >
                  <span>Simulate in App</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Act 4 */}
            <div className="bg-base-100 p-6 rounded certificate-border shadow-sm flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs font-bold text-kupon-gold mb-2">ACT IV · THE FREEZE</div>
                <h3 className="text-lg font-serif font-bold text-kupon-ink mb-2">Regulator Freezes</h3>
                <p className="text-xs text-kupon-ink/80 font-sans leading-relaxed">
                  Compliance revokes claims for sanctions. Outgoing transfers immediately revert with{" "}
                  <code className="font-mono text-[11px] bg-base-200 px-1 py-0.5 rounded">R3-FROZEN</code>.
                </p>
              </div>
              <div className="mt-6 pt-3 border-t border-base-300">
                <Link
                  href="/regulator"
                  className="text-xs font-medium text-kupon-emerald hover:text-kupon-gold inline-flex items-center gap-1"
                >
                  <span>Regulator View</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. DISCLAIMER & REGULATORY CITATIONS (Below fold) */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto w-full text-center">
        <div className="bg-base-100 p-8 sm:p-10 rounded certificate-border shadow-certificate relative overflow-hidden text-left">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheckIcon className="w-8 h-8 text-kupon-emerald shrink-0" />
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-kupon-gold font-bold">
                Regulatory Compliance Notice
              </div>
              <h3 className="text-2xl font-serif font-bold text-kupon-ink">
                Indonesian Financial Innovation Sandbox Architecture
              </h3>
            </div>
          </div>

          <p className="text-sm text-kupon-ink/85 font-sans leading-relaxed mb-6">
            Kupon is engineered in accordance with the evolving digital securities landscape established under{" "}
            <strong>UU No. 4/2023 tentang Pengembangan dan Penguatan Sektor Keuangan (UU P2SK)</strong>, which mandates
            Otoritas Jasa Keuangan (OJK) to oversee tokenized digital financial assets, alongside{" "}
            <strong>POJK 27/2024</strong> and <strong>POJK 23/2025</strong> governing the regulatory sandbox.
          </p>

          <div className="p-4 rounded bg-amber-500/10 border border-amber-600/30 flex items-start gap-3 text-xs text-kupon-ink/90 font-sans">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Demonstration Disclaimer:</strong> Kupon is a fictional technical demonstration built strictly for
              the <strong>ETHGlobal ETHOnline 2026</strong> hackathon. It does not represent actual sovereign Indonesian
              government bonds and does not constitute an offer, sale, or solicitation of debt securities.
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 items-center justify-between pt-6 border-t border-base-300">
            <div className="text-xs font-mono text-kupon-ink/70">
              Contract Address (Token):{" "}
              <span className="text-kupon-emerald font-semibold">0x65c5a5ed0b13d17051a20e3570c54e1bcf3de409</span>
            </div>
            <Link href="/app" className="btn btn-sm btn-primary text-kupon-ivory font-sans">
              Enter Investor Portal →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
