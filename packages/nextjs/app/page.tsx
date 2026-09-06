"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { usePublicClient } from "wagmi";
import {
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  BuildingLibraryIcon,
  CheckBadgeIcon,
  CheckIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { GuillochePattern } from "~~/components/GuillochePattern";
import { useDeployedContractInfo, useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const publicClient = usePublicClient();
  const { data: registryInfo } = useDeployedContractInfo({ contractName: "KuponClaimRegistry" });

  // Live on-chain data hooks from Base Sepolia
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

  // Query events safely using public client
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
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EC] text-[#14201C] selection:bg-kupon-gold/30">
      {/* ========================================================================= */}
      {/* 1. ASYMMETRIC HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 border-b border-kupon-gold/30">
        {/* Subtle Watermark Flourish */}
        <div className="absolute -right-20 -top-20 pointer-events-none opacity-[0.05]">
          <GuillochePattern variant="seal" width={700} height={700} color="emerald" />
        </div>
        <div className="absolute left-1/4 -bottom-10 pointer-events-none opacity-[0.04]">
          <GuillochePattern variant="rosette" width={500} height={500} color="gold" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Authoritative Editorial Voice */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#F4EEDC] border border-kupon-gold/60 text-xs font-mono text-kupon-emerald mb-6">
              <span className="w-2 h-2 rounded-full bg-kupon-emerald animate-pulse" />
              SBN Ritel 2027 Onchain · Base Sepolia
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold text-kupon-ink tracking-tight leading-[1.08] mb-6">
              The retail bond that enforces its own rules.
            </h1>

            <p className="text-lg sm:text-xl text-kupon-ink/80 font-sans leading-relaxed max-w-2xl mb-8">
              Buying government bonds today means waiting days for bank approvals, dealing with slow paperwork, and
              battling sold-out quotas. Kupon turns national debt into smart digital tokens: trade 24/7 in seconds, earn
              reliable ~6.5% government-backed yield, and let the code handle all safety rules automatically.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-stretch sm:items-center">
              <Link
                href="/app"
                className="btn btn-primary btn-lg px-8 font-sans font-medium text-kupon-ivory certificate-border-emerald tracking-wide shadow-sm hover:scale-[1.01] transition-transform flex items-center justify-center gap-2"
              >
                <span>Launch Investor App</span>
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <a
                href="#thesis"
                className="btn btn-outline btn-lg border-kupon-gold/80 text-kupon-ink hover:bg-kupon-gold/15 font-sans tracking-wide flex items-center justify-center"
              >
                How It Works ↓
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-base-300/80 flex items-center gap-6 text-xs text-kupon-ink/65 font-sans">
              <div className="flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4 text-kupon-emerald" />
                <span>Zero Custody Overhead</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4 text-kupon-emerald" />
                <span>Sub-Second Settlement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4 text-kupon-emerald" />
                <span>OJK POJK 3/2024 Sandbox</span>
              </div>
            </div>
          </div>

          {/* Right Column: Physical-Digital Bond Certificate Specimen */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-base-100 p-7 sm:p-8 rounded certificate-border shadow-certificate relative overflow-hidden">
              {/* Corner Watermark */}
              <div className="absolute -bottom-8 -right-8 pointer-events-none opacity-10">
                <GuillochePattern variant="seal" width={160} height={160} color="emerald" />
              </div>

              {/* Certificate Header */}
              <div className="flex items-center justify-between pb-5 border-b border-kupon-gold/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                    <Image
                      src="/kupon-logo.svg"
                      alt="Kupon Seal Mark"
                      width={48}
                      height={48}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-kupon-gold font-bold">
                      Sovereign Debt Specimen
                    </div>
                    <div className="font-serif font-bold text-base text-kupon-emerald leading-tight">
                      REPUBLIK INDONESIA
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-kupon-ink/50 uppercase">Series Code</div>
                  <div className="text-xs font-mono font-bold text-kupon-emerald">KPON-2027-WNI</div>
                </div>
              </div>

              {/* Specimen Yield & Security Callout */}
              <div className="my-6 p-4 rounded bg-[#F5EFE0] border border-kupon-gold/30 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-sans text-kupon-ink/70">Fixed Sovereign Return</div>
                  <div className="text-3xl font-serif font-bold text-kupon-ink">6.50% p.a.</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-sans text-kupon-ink/70">Risk Profile</div>
                  <div className="text-xs font-mono font-bold text-kupon-emerald uppercase tracking-wider">
                    UU APBN Guaranteed
                  </div>
                </div>
              </div>

              {/* Specimen Key-Value Ledger */}
              <dl className="space-y-3 text-xs font-sans border-b border-base-300 pb-5">
                <div className="flex justify-between items-center">
                  <dt className="text-kupon-ink/65">Underlying Instrument</dt>
                  <dd className="font-medium text-kupon-ink">SBN Ritel (Tradable ORI Model)</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-kupon-ink/65">Citizen Identification</dt>
                  <dd className="font-medium text-kupon-emerald">Verified Indonesian NIK / SID</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-kupon-ink/65">Per-Wallet Holding Limit</dt>
                  <dd className="font-mono font-medium text-kupon-ink">5,000 KPON Max</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-kupon-ink/65">Settlement Layer</dt>
                  <dd className="font-mono font-medium text-kupon-ink">Base Sepolia (L2)</dd>
                </div>
              </dl>

              {/* Action Ribbon inside Certificate */}
              <div className="pt-4 flex items-center justify-between text-[11px] text-kupon-ink/70">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>On-Chain Verified</span>
                </div>
                <Link href="/app" className="text-kupon-emerald hover:text-kupon-gold font-medium">
                  Inspect Live Balance →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THE CONTINUOUS TREASURY LEDGER STRIP */}
      {/* ========================================================================= */}
      <section className="border-b border-kupon-gold/30 bg-[#F4EEDC] py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 divide-y md:divide-y-0 md:divide-x divide-kupon-gold/30">
          <div className="flex-1 md:pr-6 flex flex-col">
            <span className="text-[11px] font-mono uppercase tracking-wider text-kupon-ink/60">Circulation</span>
            <span className="text-2xl font-mono font-bold text-kupon-emerald tabular-nums">
              {isLoadingSupply ? "..." : formattedSupply} KPON
            </span>
            <span className="text-[11px] text-kupon-ink/60 font-sans">Active bond tranches</span>
          </div>

          <div className="flex-1 md:px-6 pt-4 md:pt-0 flex flex-col">
            <span className="text-[11px] font-mono uppercase tracking-wider text-kupon-ink/60">Total Series Cap</span>
            <span className="text-2xl font-mono font-bold text-kupon-ink tabular-nums">
              {isLoadingSeriesCap ? "..." : formattedSeriesCap} KPON
            </span>
            <span className="text-[11px] text-kupon-ink/60 font-sans">Statutory ceiling</span>
          </div>

          <div className="flex-1 md:px-6 pt-4 md:pt-0 flex flex-col">
            <span className="text-[11px] font-mono uppercase tracking-wider text-kupon-ink/60">
              Retail Allocation Limit
            </span>
            <span className="text-2xl font-mono font-bold text-kupon-gold tabular-nums">
              {isLoadingRetailCap ? "..." : formattedRetailCap} KPON
            </span>
            <span className="text-[11px] text-kupon-ink/60 font-sans">Enforced per wallet</span>
          </div>

          <div className="flex-1 md:pl-6 pt-4 md:pt-0 flex flex-col">
            <span className="text-[11px] font-mono uppercase tracking-wider text-kupon-ink/60">Verified Citizens</span>
            <span className="text-2xl font-mono font-bold text-kupon-emerald tabular-nums">{totalClaimsCount}</span>
            <span className="text-[11px] text-kupon-ink/60 font-sans">Onchain registry records</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. THE MARKET THESIS: EDITORIAL SPLIT */}
      {/* ========================================================================= */}
      <section id="thesis" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl mb-16">
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-kupon-ink tracking-tight mb-4">
            Why tokenized bonds make sense in Indonesia.
          </h2>
          <p className="text-lg text-kupon-ink/80 font-sans leading-relaxed">
            Indonesia is one of the fastest-growing digital asset economies in the world. Yet traditional sovereign
            wealth distribution remains trapped in manual paperwork.
          </p>
        </div>

        {/* Editorial Data Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-20">
          {/* Main Callout: The Adoption Paradox */}
          <div className="lg:col-span-7 bg-base-100 p-8 sm:p-10 rounded certificate-border shadow-certificate flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-kupon-gold font-bold mb-3">
                The 20x Adoption Gap
              </div>
              <div className="text-4xl sm:text-6xl font-mono font-bold text-kupon-emerald mb-4">21M+ vs 1.1M</div>
              <h3 className="text-2xl font-serif font-bold text-kupon-ink mb-4">
                Millions of crypto users. Only a handful of bondholders.
              </h3>
              <p className="text-base text-kupon-ink/80 font-sans leading-relaxed">
                According to official Bappebti statistics, over 21 million Indonesians trade crypto assets. Meanwhile,
                KSEI records show fewer than 1.1 million citizens hold retail sovereign bonds (SBN Ritel). The younger
                generation already has digital wallets, but national debt has never met them where their wealth lives.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-base-300 text-xs font-mono text-kupon-ink/60 flex items-center justify-between">
              <span>Source: Bappebti &amp; KSEI Official Data</span>
              <span>Top 7 Global Adoption Index</span>
            </div>
          </div>

          {/* Side Stack: Yield & Regulation */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-base-100 p-6 sm:p-7 rounded certificate-border shadow-sm flex-1 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-kupon-gold font-bold mb-1">
                  Guaranteed Wealth
                </div>
                <h4 className="text-xl font-serif font-bold text-kupon-ink mb-2">~6.5% Government-Backed Yield</h4>
                <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed">
                  Unlike volatile meme tokens or 4% USD RWAs, Indonesian government bonds pay an attractive, state
                  budget-backed fixed return guaranteed by national law (UU APBN). Kupon brings this secure yield
                  straight to digital wallets.
                </p>
              </div>
            </div>

            <div className="bg-base-100 p-6 sm:p-7 rounded certificate-border shadow-sm flex-1 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-kupon-emerald font-bold mb-1">
                  Legal Grounding
                </div>
                <h4 className="text-xl font-serif font-bold text-kupon-ink mb-2">Active Regulatory Sandbox</h4>
                <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed">
                  Indonesia is not building in a legal vacuum. Under the Financial Sector Omnibus Law (UU P2SK) and OJK
                  POJK 3/2024, the financial regulator actively supports real-world asset tokenization testbeds.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* The Side-by-Side Ledger: Old Way vs Kupon */}
        <div className="rounded certificate-border overflow-hidden bg-base-100 shadow-certificate">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-kupon-gold/30">
            {/* The Old Way */}
            <div className="p-8 sm:p-10 bg-[#FAF4E6]">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-red-700" />
                <h3 className="font-serif font-bold text-xl text-kupon-ink m-0">How Government Bonds Work Today</h3>
              </div>

              <ul className="space-y-6 text-sm font-sans text-kupon-ink/85 list-none p-0 m-0">
                <li className="flex items-start gap-3.5">
                  <XMarkIcon className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-kupon-ink font-semibold mb-1">Hard to Sell Before Maturity:</strong>
                    If you need your money before the 3-year term ends, you must sell back through distributing banks
                    during banking hours, often accepting wide dealer spreads.
                  </div>
                </li>
                <li className="flex items-start gap-3.5">
                  <XMarkIcon className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-kupon-ink font-semibold mb-1">Days of Waiting for Cash (T+2):</strong>
                    Traditional clearing systems take up to two full business days for settlement funds to reach your
                    account.
                  </div>
                </li>
                <li className="flex items-start gap-3.5">
                  <XMarkIcon className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-kupon-ink font-semibold mb-1">Sold Out in Minutes:</strong>
                    New bonds only issue a few times a year. Quotas on apps like Bibit or Bareksa vanish within minutes,
                    leaving retail investors empty-handed.
                  </div>
                </li>
              </ul>
            </div>

            {/* The Kupon Way */}
            <div className="p-8 sm:p-10 bg-base-100">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-kupon-emerald" />
                <h3 className="font-serif font-bold text-xl text-kupon-emerald m-0">How It Works With Kupon</h3>
              </div>

              <ul className="space-y-6 text-sm font-sans text-kupon-ink/90 list-none p-0 m-0">
                <li className="flex items-start gap-3.5">
                  <CheckIcon className="w-5 h-5 text-kupon-emerald shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-kupon-emerald font-semibold mb-1">Instant 24/7 Liquidity:</strong>
                    Trade or transfer your bonds peer-to-peer in seconds, day or night, on Base L2 without waiting for
                    banks to open.
                  </div>
                </li>
                <li className="flex items-start gap-3.5">
                  <CheckIcon className="w-5 h-5 text-kupon-emerald shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-kupon-emerald font-semibold mb-1">Automatic Rule Enforcing:</strong>
                    The smart contract autonomously checks citizen eligibility and quota limits before spending any gas
                    fees.
                  </div>
                </li>
                <li className="flex items-start gap-3.5">
                  <CheckIcon className="w-5 h-5 text-kupon-emerald shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-kupon-emerald font-semibold mb-1">
                      Targeted Account Protection:
                    </strong>
                    If an account is flagged for court sanctions or theft, authorities can freeze just that one wallet
                    without stopping the market for honest citizens.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. THE THREE AUTONOMOUS GUARDRAILS */}
      {/* ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F6F0E0] border-t border-b border-kupon-gold/30">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="max-w-3xl mb-16 text-left">
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-kupon-ink tracking-tight mb-4">
              Three rules that protect national wealth.
            </h2>
            <p className="text-base sm:text-lg text-kupon-ink/80 font-sans leading-relaxed">
              No manual compliance officers. No business-hour delays. Three autonomous guardrails running inside the
              token, 24 hours a day.
            </p>
          </div>

          {/* Dynamic 3-Guardrail Layout */}
          <div className="space-y-8">
            {/* Guardrail 1: Verified Citizens First */}
            <div className="bg-base-100 rounded certificate-border shadow-certificate p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-kupon-emerald/10 text-kupon-emerald font-mono text-xs font-semibold mb-3">
                  <GlobeAltIcon className="w-4 h-4" />
                  Identity Gate · R1-RESIDENCY
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-kupon-ink mb-3">
                  Verified Indonesian Residents Only
                </h3>
                <p className="text-sm sm:text-base font-sans text-kupon-ink/80 leading-relaxed max-w-xl mb-4">
                  Sovereign debt yields belong to citizens. Only wallets possessing an authorized identity claim
                  (mirroring the national KSEI SID / e-KTP registry) can receive or hold tokens, preventing unauthorized
                  overseas capital from draining citizen quotas.
                </p>
                <div className="text-xs font-mono text-kupon-ink/50">
                  Statutory Basis: Peraturan Menteri Keuangan (PMK) SBN Ritel
                </div>
              </div>

              {/* Visual Simulation Pill */}
              <div className="lg:col-span-5 bg-[#F5EFE0] p-5 sm:p-6 rounded border border-kupon-gold/40 flex flex-col gap-3">
                <div className="text-[11px] font-mono text-kupon-ink/60 uppercase tracking-wider">
                  Transfer Gate Evaluation
                </div>
                <div className="flex items-center justify-between p-3 rounded bg-base-100 border border-base-300 text-xs font-mono">
                  <span className="flex items-center gap-2 text-kupon-ink/75">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    Unverified Wallet
                  </span>
                  <span className="text-red-700 font-bold">Transfer Blocked</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded bg-base-100 border border-kupon-emerald/40 text-xs font-mono">
                  <span className="flex items-center gap-2 text-kupon-emerald font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    Verified Citizen (WNI)
                  </span>
                  <span className="text-kupon-emerald font-bold">Settles Instantly</span>
                </div>
              </div>
            </div>

            {/* Guardrail 2: Anti-Whale Limit */}
            <div className="bg-base-100 rounded certificate-border shadow-certificate p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-kupon-gold/15 text-kupon-gold font-mono text-xs font-semibold mb-3">
                  <ScaleIcon className="w-4 h-4" />
                  Fair Distribution · R2-CAP
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-kupon-ink mb-3">
                  Strict 5,000 Token Anti-Whale Ceiling
                </h3>
                <p className="text-sm sm:text-base font-sans text-kupon-ink/80 leading-relaxed max-w-xl mb-4">
                  Retail bonds exist for ordinary households, not institutional hedge funds. Every regular citizen
                  wallet has a strict 5,000 token limit. If an account attempts to acquire more than its fair share, the
                  contract reverts instantly at the transfer level.
                </p>
                <div className="text-xs font-mono text-kupon-ink/50">
                  Statutory Basis: Retail Allocation Quota &amp; Maximum Order Limits
                </div>
              </div>

              {/* Visual Quota Ceiling Indicator */}
              <div className="lg:col-span-5 bg-[#F5EFE0] p-5 sm:p-6 rounded border border-kupon-gold/40 flex flex-col gap-3">
                <div className="flex justify-between items-center text-[11px] font-mono text-kupon-ink/70">
                  <span>Per-Wallet Retail Allocation</span>
                  <span className="font-bold text-kupon-gold">5,000 KPON Cap</span>
                </div>
                {/* Visual Progress Meter */}
                <div className="w-full bg-base-100 h-3 rounded-full overflow-hidden border border-base-300 p-0.5 flex">
                  <div className="bg-kupon-emerald h-full rounded-full w-4/5" />
                  <div className="bg-red-700/80 h-full rounded-r-full w-1/5 opacity-50" />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-kupon-ink/60 pt-1">
                  <span className="text-kupon-emerald font-medium">✓ Protected Household Tier</span>
                  <span className="text-red-700 font-medium">✕ Whale Wall Block</span>
                </div>
              </div>
            </div>

            {/* Guardrail 3: Targeted Safety Freeze */}
            <div className="bg-base-100 rounded certificate-border shadow-certificate p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-red-800/10 text-red-800 font-mono text-xs font-semibold mb-3">
                  <LockClosedIcon className="w-4 h-4" />
                  Targeted Enforcement · R3-FROZEN
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-kupon-ink mb-3">
                  Surgical Freeze Without Market Shutdown
                </h3>
                <p className="text-sm sm:text-base font-sans text-kupon-ink/80 leading-relaxed max-w-xl mb-4">
                  If an account is stolen, compromised, or placed under judicial sanctions, compliance authorities can
                  revoke its verified status in seconds. Outgoing transfers from that specific wallet are frozen
                  instantly without halting trading for the rest of the nation.
                </p>
                <div className="text-xs font-mono text-kupon-ink/50">
                  Statutory Basis: Anti-Money Laundering (AML) &amp; CFT Compliance
                </div>
              </div>

              {/* Visual Isolation Comparison */}
              <div className="lg:col-span-5 bg-[#F5EFE0] p-5 sm:p-6 rounded border border-kupon-gold/40 flex flex-col gap-3">
                <div className="text-[11px] font-mono text-kupon-ink/60 uppercase tracking-wider">
                  Enforcement Comparison
                </div>
                <div className="p-3 rounded bg-base-100 border border-base-300 text-xs font-sans">
                  <div className="text-red-800 font-bold text-[11px] font-mono mb-0.5">✕ Traditional Exchange</div>
                  <div className="text-kupon-ink/70 text-[11px]">
                    Halts trading for the entire market, trapping innocent investors.
                  </div>
                </div>
                <div className="p-3 rounded bg-base-100 border border-kupon-emerald/40 text-xs font-sans">
                  <div className="text-kupon-emerald font-bold text-[11px] font-mono mb-0.5">
                    ✓ Kupon Autonomous Asset
                  </div>
                  <div className="text-kupon-ink/80 text-[11px]">
                    Freezes only the flagged address; secondary market continues 24/7.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. MULTI-STAKEHOLDER OPERATIONAL SYSTEM (Impeccable Asymmetric Bento) */}
      {/* ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl mb-16 text-left">
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-kupon-ink tracking-tight mb-4">
            Three portals. One unified bond lifecycle.
          </h2>
          <p className="text-base sm:text-lg text-kupon-ink/80 font-sans leading-relaxed">
            Sovereign debt doesn&apos;t live in isolation. Kupon connects everyday citizens, government debt issuers,
            and regulatory watchdogs into a seamless onchain ecosystem.
          </p>
        </div>

        {/* Asymmetric Bento Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Primary Anchor: Citizen Investor Portal (The Live Interactive App) */}
          <div className="lg:col-span-7 bg-base-100 p-8 sm:p-10 rounded certificate-border shadow-certificate flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-16 -top-16 pointer-events-none opacity-[0.06]">
              <GuillochePattern variant="seal" width={320} height={320} color="emerald" />
            </div>

            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-kupon-emerald/10 text-xs font-mono font-bold text-kupon-emerald uppercase tracking-wider">
                  <UserGroupIcon className="w-4 h-4" />
                  Citizen Portal · Live App
                </span>
                <span className="text-[11px] font-mono text-kupon-emerald bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                  Ready to Test
                </span>
              </div>

              <h3 className="text-2xl sm:text-4xl font-serif font-bold text-kupon-ink mb-3">For Everyday Investors</h3>
              <p className="text-sm sm:text-base font-sans text-kupon-ink/80 leading-relaxed mb-6 max-w-xl">
                Hold government bonds directly in your crypto wallet, earn steady ~6.5% annual returns paid monthly, and
                trade peer-to-peer 24/7. Built-in pre-flight checks tell you if an address is eligible before you waste
                any gas.
              </p>

              {/* Simulated Live Investor Wallet Specimen */}
              <div className="p-5 rounded bg-[#F6F0E0] border border-kupon-gold/40 flex flex-col gap-3.5 mb-6">
                <div className="flex justify-between items-center text-xs font-mono text-kupon-ink/70 pb-2 border-b border-kupon-gold/25">
                  <span>Simulated Citizen Portfolio</span>
                  <span className="text-kupon-emerald font-bold">● Verified Citizen (WNI)</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[10px] uppercase font-mono text-kupon-ink/50">Holding Balance</div>
                    <div className="text-2xl font-mono font-bold text-kupon-emerald">1,500 KPON</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-mono text-kupon-ink/50">Annual Coupon (6.5%)</div>
                    <div className="text-base font-mono font-bold text-kupon-ink">Rp 97,500 / yr</div>
                  </div>
                </div>
                <div className="text-[11px] font-sans text-kupon-ink/75 bg-base-100 p-2.5 rounded border border-base-300 flex items-center justify-between">
                  <span>Pre-Flight Safety Verdict:</span>
                  <span className="font-mono font-semibold text-emerald-800">✓ Transfer Allowed (Within Cap)</span>
                </div>
              </div>
            </div>

            <Link
              href="/app"
              className="btn btn-primary btn-md text-kupon-ivory certificate-border-emerald font-sans tracking-wide self-start flex items-center gap-2"
            >
              <span>Open Investor Portal</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {/* Secondary Stack: Ministry of Finance & OJK Regulator Terminals */}
          <div className="lg:col-span-5 flex flex-col gap-8 justify-between">
            {/* Portal 2: Ministry of Finance (Debt Office) */}
            <div className="bg-base-100 p-7 sm:p-8 rounded certificate-border shadow-sm flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-kupon-gold/15 text-[10px] font-mono font-bold text-kupon-gold uppercase tracking-wider">
                    <BuildingLibraryIcon className="w-3.5 h-3.5" />
                    Issuer Authority
                  </span>
                  <span className="text-[10px] font-mono text-kupon-gold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Issuer Portal
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-kupon-ink mb-2">Debt Management Office</h3>
                <p className="text-xs sm:text-sm font-sans text-kupon-ink/80 leading-relaxed mb-4">
                  For the Ministry of Finance: verify citizen identity claims, authorize new bond tranches under the
                  statutory series cap, and synchronize national registries without manual banking delays.
                </p>
              </div>
              <Link
                href="/registrar"
                className="text-xs font-mono font-semibold text-kupon-emerald hover:text-kupon-gold inline-flex items-center gap-1 self-start"
              >
                <span>Open Registrar Portal</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Portal 3: Financial Watchdog (OJK Regulator) */}
            <div className="bg-base-100 p-7 sm:p-8 rounded certificate-border shadow-sm flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-kupon-emerald/10 text-[10px] font-mono font-bold text-kupon-emerald uppercase tracking-wider">
                    <ShieldCheckIcon className="w-3.5 h-3.5" />
                    Oversight &amp; Audit
                  </span>
                  <span className="text-[10px] font-mono text-kupon-emerald bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Supervisory Terminal
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-kupon-ink mb-2">
                  Regulator Terminal (OJK)
                </h3>
                <p className="text-xs sm:text-sm font-sans text-kupon-ink/80 leading-relaxed mb-4">
                  For market supervisors: monitor holding distributions in real time, verify anti-whale caps, and test
                  live transfer simulations across four sequential compliance scenarios with zero blind spots.
                </p>
              </div>
              <Link
                href="/regulator"
                className="text-xs font-mono font-semibold text-kupon-emerald hover:text-kupon-gold inline-flex items-center gap-1 self-start"
              >
                <span>Open Regulator Terminal</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* ========================================================================= */}
      {/* 6. REGULATORY & STATUTORY FRAMEWORK BRIEF */}
      {/* ========================================================================= */}
      <section className="pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-base-100 p-8 sm:p-10 rounded certificate-border shadow-certificate flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-kupon-emerald/10 text-[10px] font-mono uppercase tracking-widest text-kupon-emerald font-bold mb-2">
              <CheckBadgeIcon className="w-4 h-4" />
              Regulatory &amp; Statutory Architecture
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-kupon-ink mb-2">
              Grounded in Indonesian Law &amp; OJK Sandbox
            </h2>
            <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed m-0">
              Kupon is engineered in accordance with <strong>UU No. 4/2023 (UU P2SK)</strong> and the OJK Digital
              Financial Assets Regulatory Sandbox (<strong>POJK No. 3/2024</strong>). Read our institutional brief, KSEI
              SID mapping, and sovereign debt thesis.
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <Link
              href="/framework"
              className="btn btn-primary text-kupon-ivory certificate-border-emerald font-sans tracking-wide w-full md:w-auto flex items-center justify-center gap-2"
            >
              <span>Read Legal Framework</span>
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
