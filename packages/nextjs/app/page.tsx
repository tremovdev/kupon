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
  CheckIcon,
  CommandLineIcon,
  ExclamationTriangleIcon,
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
      {/* 2. THE CONTINUOUS TREASURY LEDGER STRIP (No generic metric boxes) */}
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
      {/* 3. THE MARKET THESIS: EDITORIAL SPLIT (Not identical cards) */}
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
      {/* 4. THE SOVEREIGN CHARTER (Articles of Law, Not Floating Cards) */}
      {/* ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F6F0E0] border-t border-b border-kupon-gold/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-kupon-ink tracking-tight mb-4">
              Three rules that protect national wealth.
            </h2>
            <p className="text-base sm:text-lg text-kupon-ink/80 font-sans leading-relaxed">
              Indonesian retail bond regulations exist to make sure national wealth is shared fairly among citizens.
              Kupon translates these statutory protections into immutable smart contract guarantees.
            </p>
          </div>

          {/* Unified Sovereign Charter Container */}
          <div className="bg-base-100 rounded certificate-border shadow-certificate divide-y divide-kupon-gold/30">
            {/* Provision I */}
            <div className="p-8 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-4 flex flex-col">
                <span className="font-mono text-xs font-bold text-kupon-gold uppercase tracking-wider mb-1">
                  Article I · Sovereignty
                </span>
                <h3 className="font-serif font-bold text-2xl text-kupon-ink">Indonesian Residents Only</h3>
                <span className="text-xs font-mono text-kupon-emerald mt-2">Code: R1-RESIDENCY</span>
              </div>
              <div className="md:col-span-8 text-sm font-sans text-kupon-ink/85 leading-relaxed">
                National bond profits belong to citizens. Only wallets possessing an authorized identity claim
                (mirroring the KSEI Single Investor Identification / e-KTP registry) can receive or hold tokens,
                preventing unauthorized overseas capital from draining citizen quotas.
              </div>
            </div>

            {/* Provision II */}
            <div className="p-8 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-4 flex flex-col">
                <span className="font-mono text-xs font-bold text-kupon-gold uppercase tracking-wider mb-1">
                  Article II · Fairness
                </span>
                <h3 className="font-serif font-bold text-2xl text-kupon-ink">No Giant Whales</h3>
                <span className="text-xs font-mono text-kupon-gold mt-2">Code: R2-CAP (5,000 Max)</span>
              </div>
              <div className="md:col-span-8 text-sm font-sans text-kupon-ink/85 leading-relaxed">
                Retail bonds are meant for everyday families, not giant hedge funds. Every regular citizen wallet has a
                strict 5,000 token ceiling. If an account attempts to acquire more than its share, the smart contract
                reverts instantly, ensuring fair distribution across society.
              </div>
            </div>

            {/* Provision III */}
            <div className="p-8 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-4 flex flex-col">
                <span className="font-mono text-xs font-bold text-kupon-gold uppercase tracking-wider mb-1">
                  Article III · State Control
                </span>
                <h3 className="font-serif font-bold text-2xl text-kupon-ink">Targeted Safety Freezes</h3>
                <span className="text-xs font-mono text-red-800 mt-2">Code: R3-FROZEN</span>
              </div>
              <div className="md:col-span-8 text-sm font-sans text-kupon-ink/85 leading-relaxed">
                If an account is stolen, compromised, or placed under legal sanctions by authorities, compliance
                officers can revoke its identity claim in seconds. Outgoing transfers from that specific wallet are
                immediately frozen without pausing secondary trading for the rest of the nation.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. THE 3-PORTAL ECOSYSTEM (Stepped Workflow, Not Identical Cards) */}
      {/* ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-kupon-ink tracking-tight mb-4">
            Built for real-world governance.
          </h2>
          <p className="text-base sm:text-lg text-kupon-ink/80 font-sans leading-relaxed">
            Three dedicated interfaces designed for the complete sovereign bond lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1: Citizens */}
          <div className="bg-base-100 p-8 rounded certificate-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded bg-kupon-emerald/10 text-kupon-emerald flex items-center justify-center mb-6">
                <UserGroupIcon className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono uppercase tracking-wider text-kupon-emerald font-bold block mb-1">
                Citizen Portal
              </span>
              <h3 className="text-2xl font-serif font-bold text-kupon-ink mb-3">Investor Experience</h3>
              <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed mb-6">
                Check holdings, send tokens, and receive coupon payments with pre-flight compliance feedback before
                spending any gas fees.
              </p>
            </div>
            <Link
              href="/app"
              className="btn btn-primary btn-sm text-kupon-ivory certificate-border-emerald font-sans w-full flex items-center justify-center gap-1.5"
            >
              <span>Launch App</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {/* Step 2: Government */}
          <div className="bg-base-100 p-8 rounded certificate-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded bg-kupon-gold/15 text-kupon-gold flex items-center justify-center mb-6">
                <BuildingLibraryIcon className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono uppercase tracking-wider text-kupon-gold font-bold block mb-1">
                Issuer Authority
              </span>
              <h3 className="text-2xl font-serif font-bold text-kupon-ink mb-3">Debt Management Office</h3>
              <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed mb-6">
                Verify citizen identity claims, issue new bond batches under the official series cap, and manage the
                national registry.
              </p>
            </div>
            <Link
              href="/registrar"
              className="btn btn-outline btn-sm border-kupon-gold text-kupon-ink hover:bg-kupon-gold/15 font-sans w-full flex items-center justify-center gap-1.5"
            >
              <span>Registrar Portal (T7)</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {/* Step 3: Regulator */}
          <div className="bg-base-100 p-8 rounded certificate-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded bg-kupon-emerald/10 text-kupon-emerald flex items-center justify-center mb-6">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono uppercase tracking-wider text-kupon-emerald font-bold block mb-1">
                Market Oversight
              </span>
              <h3 className="text-2xl font-serif font-bold text-kupon-ink mb-3">Regulator Terminal</h3>
              <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed mb-6">
                Monitor bondholder distributions in real time, verify anti-whale caps, and simulate compliance checks
                with zero blind spots.
              </p>
            </div>
            <Link
              href="/regulator"
              className="btn btn-outline btn-sm border-kupon-emerald text-kupon-emerald hover:bg-kupon-emerald/10 font-sans w-full flex items-center justify-center gap-1.5"
            >
              <span>Regulator View (T8)</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TECHNICAL BRIDGE: FOR DEVELOPERS & JUDGES */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-base-100 p-8 sm:p-10 rounded certificate-border shadow-certificate flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-kupon-emerald/10 text-[10px] font-mono uppercase tracking-widest text-kupon-emerald font-bold mb-2">
              <CommandLineIcon className="w-4 h-4" />
              For Smart Contract Auditors &amp; Judges
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-kupon-ink mb-2">
              Want to see the actual smart contracts?
            </h2>
            <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed m-0">
              Inspect decoded rule errors (<code className="font-mono text-xs">Kupon__RuleViolated</code>), test read
              and write methods on verified contracts, and explore block events in our Protocol Debugger.
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <Link
              href="/debugger"
              className="btn btn-primary text-kupon-ivory certificate-border-emerald font-sans tracking-wide w-full md:w-auto flex items-center justify-center gap-2"
            >
              <span>Explore Protocol Debugger</span>
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. REGULATORY SANDBOX & DEMO DISCLAIMER */}
      {/* ========================================================================= */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="p-6 sm:p-8 rounded bg-[#F4EEDC] border border-kupon-gold/40 text-xs font-sans text-kupon-ink/85 leading-relaxed flex flex-col gap-4">
          <div className="flex items-center gap-2 font-serif font-bold text-sm text-kupon-emerald">
            <CheckIcon className="w-4 h-4 text-kupon-emerald" />
            <span>Indonesian Financial Innovation Sandbox Framework</span>
          </div>
          <p className="m-0">
            Designed to fit <strong>UU No. 4/2023 (UU P2SK)</strong>, which places digital financial assets under
            Otoritas Jasa Keuangan (OJK), and <strong>POJK No. 3/2024</strong> on regulatory sandboxes for financial
            technology innovation.
          </p>
          <div className="p-3.5 rounded bg-amber-500/10 border border-amber-600/30 text-amber-900 text-[11px] flex items-start gap-2.5">
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Demonstration Disclaimer:</strong> Kupon is an educational technical project built for the{" "}
              <strong>ETHGlobal ETHOnline 2026</strong> hackathon. It models an Indonesian government retail bond (SBN
              Ritel 2027) and is not an actual government debt offering.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
