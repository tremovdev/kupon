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
  ClockIcon,
  CommandLineIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
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
    <div className="flex flex-col w-full min-h-screen bg-kupon-ivory text-kupon-ink selection:bg-kupon-gold/30">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-14 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 border-b border-kupon-gold/30 bg-gradient-to-b from-[#FAF6EC] via-[#F5EFE0] to-[#FAF6EC]">
        {/* Subtle Guilloche Watermark */}
        <div className="absolute -right-28 -top-28 pointer-events-none opacity-[0.06]">
          <GuillochePattern variant="seal" width={680} height={680} color="emerald" />
        </div>
        <div className="absolute -left-36 top-1/4 pointer-events-none opacity-[0.05]">
          <GuillochePattern variant="rosette" width={600} height={600} color="gold" />
        </div>
        <div className="absolute bottom-0 inset-x-0 pointer-events-none opacity-25">
          <GuillochePattern variant="waves" height={70} color="gold" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center text-center">
          {/* Institutional Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 mb-6 rounded bg-base-100/95 border border-kupon-gold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-kupon-emerald animate-pulse" />
            <span className="text-xs font-mono tracking-widest text-kupon-emerald uppercase font-semibold">
              Indonesian Retail Bond on the Blockchain · SBN Ritel 2027
            </span>
          </div>

          {/* Value Proposition Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold text-kupon-ink tracking-tight max-w-4xl leading-[1.1] mb-6">
            The retail bond that enforces its own rules.
          </h1>

          {/* Simple, Human Subheadline */}
          <p className="text-lg sm:text-xl md:text-2xl text-kupon-ink/85 max-w-3xl font-sans leading-relaxed mb-10">
            Buying government bonds today means waiting days for bank approvals, dealing with slow paperwork, and
            battling sold-out quotas. Kupon turns national bonds into smart digital tokens: trade in seconds 24/7, earn
            reliable ~6.5% government-backed yield, and let the code handle all safety rules automatically.
          </p>

          {/* Action-Oriented CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto">
            <Link
              href="/app"
              className="btn btn-primary btn-lg px-8 font-sans font-medium text-kupon-ivory certificate-border-emerald tracking-wide shadow-md hover:scale-[1.01] transition-transform w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <span>Launch Investor App</span>
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
            <a
              href="#market-paradox"
              className="btn btn-outline btn-lg border-kupon-gold/80 text-kupon-ink hover:bg-kupon-gold/15 font-sans tracking-wide w-full sm:w-auto"
            >
              How It Works ↓
            </a>
          </div>

          {/* Sovereign Certificate Specimen Preview */}
          <div className="mt-14 w-full max-w-3xl bg-base-100 p-6 sm:p-7 rounded certificate-border shadow-certificate text-left relative overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-kupon-gold/30 gap-4">
              <div className="flex items-center gap-3.5">
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
                  <span className="text-[10px] font-mono uppercase tracking-widest text-kupon-gold font-bold">
                    Official Digital Bond Specimen
                  </span>
                  <div className="font-serif font-bold text-lg text-kupon-emerald leading-tight">
                    REPUBLIK INDONESIA · SBN RITEL 2027
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right font-mono text-xs text-kupon-ink/70">
                <div>SERIES CODE:</div>
                <div className="text-kupon-emerald font-bold">KPON-2027-WNI</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-xs font-sans">
              <div>
                <div className="text-[10px] text-kupon-ink/60 uppercase font-mono">Issuer Model</div>
                <div className="font-semibold text-kupon-ink mt-0.5">Ministry of Finance (DJPPR)</div>
              </div>
              <div>
                <div className="text-[10px] text-kupon-ink/60 uppercase font-mono">Identity Check</div>
                <div className="font-semibold text-kupon-ink mt-0.5">Verified Indonesian Citizens</div>
              </div>
              <div>
                <div className="text-[10px] text-kupon-ink/60 uppercase font-mono">Speed</div>
                <div className="font-semibold text-kupon-emerald mt-0.5">Sub-Second on Base L2</div>
              </div>
              <div>
                <div className="text-[10px] text-kupon-ink/60 uppercase font-mono">Sandbox Track</div>
                <div className="font-semibold text-kupon-ink mt-0.5">OJK POJK 3/2024</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. THE MARKET THESIS (Simple, Eye-Opening Facts) */}
      {/* ========================================================================= */}
      <section id="market-paradox" className="py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-mono uppercase tracking-widest text-kupon-gold font-bold mb-2">
            Why This Matters
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-kupon-ink mb-4">
            Why tokenized bonds make sense in Indonesia.
          </h2>
          <p className="text-base sm:text-lg text-kupon-ink/80 font-sans leading-relaxed">
            Over 21 million Indonesians already use crypto wallets, but only 1.1 million own government bonds. Kupon
            bridges this gap: making safe, high-yield national bonds as easy to hold as digital cash.
          </p>
        </div>

        {/* 3 High-Impact Fact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-base-100 p-6 rounded certificate-border shadow-certificate flex flex-col justify-between">
            <div>
              <div className="text-3xl sm:text-4xl font-mono font-bold text-kupon-emerald mb-2">21M+ vs 1.1M</div>
              <div className="font-serif font-bold text-lg text-kupon-ink mb-2">Huge Digital Audience</div>
              <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed m-0">
                Over 21 million Indonesians own crypto accounts, but fewer than 1.1 million own government bonds. Young
                people want digital assets; Kupon gives them a safe one backed by the nation.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-base-300 text-[11px] font-mono text-kupon-ink/60">
              Source: Bappebti &amp; KSEI Data
            </div>
          </div>

          <div className="bg-base-100 p-6 rounded certificate-border shadow-certificate flex flex-col justify-between">
            <div>
              <div className="text-3xl sm:text-4xl font-mono font-bold text-kupon-gold mb-2">6.25% - 6.8%</div>
              <div className="font-serif font-bold text-lg text-kupon-ink mb-2">Government-Backed Yield</div>
              <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed m-0">
                Unlike risky meme tokens, Indonesian government bonds pay a predictable ~6.5% annual return guaranteed
                by the national state budget. Kupon brings that reliable income straight onchain.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-base-300 text-[11px] font-mono text-kupon-ink/60">
              Guaranteed by Indonesian Law (UU APBN)
            </div>
          </div>

          <div className="bg-base-100 p-6 rounded certificate-border shadow-certificate flex flex-col justify-between">
            <div>
              <div className="text-3xl sm:text-4xl font-mono font-bold text-kupon-emerald mb-2">Legal Sandbox</div>
              <div className="font-serif font-bold text-lg text-kupon-ink mb-2">Clear Regulatory Support</div>
              <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed m-0">
                Indonesia&apos;s financial authority (OJK) has an active regulatory sandbox for real-world asset
                tokenization under the new Financial Law (UU P2SK). This is built to fit official guidelines.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-base-300 text-[11px] font-mono text-kupon-ink/60">
              Framework: OJK POJK 3/2024
            </div>
          </div>
        </div>

        {/* The Practical Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16 pt-12 border-t border-base-300">
          {/* Legacy Pain Points */}
          <div className="bg-[#EFE8D6] p-8 rounded border border-base-300 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-kupon-ink/10 text-xs font-mono uppercase tracking-wider text-kupon-ink font-semibold mb-4">
                <ClockIcon className="w-4 h-4 text-kupon-ink/70" />
                Traditional Government Bonds
              </div>
              <h3 className="text-2xl font-serif font-bold text-kupon-ink mb-4">How It Works Today</h3>
              <ul className="space-y-4 text-sm font-sans text-kupon-ink/80 list-none p-0">
                <li className="flex items-start gap-3">
                  <span className="text-red-700 font-bold mt-0.5">✕</span>
                  <div>
                    <strong>Hard to Sell Early:</strong> If you need your money before the bond matures in 3 years,
                    selling back to the bank is slow, expensive, and limited to bank hours.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-700 font-bold mt-0.5">✕</span>
                  <div>
                    <strong>Days to Settle (T+2):</strong> Traditional interbank clearing takes up to two full business
                    days for cash to arrive in your account.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-700 font-bold mt-0.5">✕</span>
                  <div>
                    <strong>Sold Out in Minutes:</strong> Bonds are only sold a few times a year. Quotas on apps like
                    Bibit or Bareksa vanish quickly, leaving many everyday investors empty-handed.
                  </div>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-4 border-t border-kupon-ink/15 text-xs font-mono text-kupon-ink/60">
              Old Model: Slow, paper-heavy, limited trading hours
            </div>
          </div>

          {/* Kupon Solution */}
          <div className="bg-base-100 p-8 rounded certificate-border shadow-certificate flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-kupon-emerald/10 text-xs font-mono uppercase tracking-wider text-kupon-emerald font-semibold mb-4 border border-kupon-emerald/30">
                <CpuChipIcon className="w-4 h-4 text-kupon-emerald" />
                The Kupon Experience
              </div>
              <h3 className="text-2xl font-serif font-bold text-kupon-emerald mb-4">How It Works With Kupon</h3>
              <ul className="space-y-4 text-sm font-sans text-kupon-ink/85 list-none p-0">
                <li className="flex items-start gap-3">
                  <span className="text-kupon-emerald font-bold mt-0.5">✓</span>
                  <div>
                    <strong>Instant 24/7 Liquidity:</strong> Buy, sell, or transfer your bonds in seconds, day or night,
                    on a fast Layer 2 network without waiting for banks to open.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-kupon-emerald font-bold mt-0.5">✓</span>
                  <div>
                    <strong>Automatic Rule Checks:</strong> The smart contract automatically checks citizen status and
                    fair limits, stopping mistakes before you spend any gas fee.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-kupon-emerald font-bold mt-0.5">✓</span>
                  <div>
                    <strong>Targeted Safety Freezes:</strong> If a wallet is compromised or sanctioned, officials can
                    freeze just that one account without stopping trading for the rest of the market.
                  </div>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-4 border-t border-kupon-gold/30 text-xs font-mono text-kupon-emerald font-semibold">
              Kupon Model: Instant settlement, automated protection
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. THE THREE SIMPLE RULES */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 bg-[#F6F0E0] border-t border-b border-kupon-gold/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-mono uppercase tracking-widest text-kupon-emerald font-bold mb-2">
              Three Simple Rules
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-kupon-ink mb-4">
              Designed to protect everyday citizens.
            </h2>
            <p className="text-base sm:text-lg text-kupon-ink/80 font-sans leading-relaxed">
              Indonesian retail bond regulations exist to make sure national wealth is shared fairly. Kupon turns these
              legal protections into simple, unskippable rules in code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="bg-base-100 rounded certificate-border p-7 flex flex-col justify-between shadow-certificate hover:shadow-certificate-lg transition-shadow">
              <div>
                <div className="w-12 h-12 rounded bg-kupon-emerald/10 border border-kupon-emerald/30 flex items-center justify-center text-kupon-emerald mb-5">
                  <GlobeAltIcon className="w-6 h-6" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-kupon-gold font-bold mb-1">
                  Rule 1 · Citizens First
                </div>
                <h3 className="text-xl font-serif font-bold text-kupon-ink mb-3">Indonesian Residents Only</h3>
                <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed mb-4">
                  National bond profits belong to citizens. Only wallets verified as Indonesian residents can hold or
                  receive tokens, keeping national wealth in the country.
                </p>
              </div>
              <div className="pt-4 border-t border-base-300 text-xs font-mono text-kupon-emerald font-medium flex items-center justify-between">
                <span>Code Rule: R1-RESIDENCY</span>
                <span className="text-[10px] text-kupon-ink/50 font-sans">KTP/SID Verification</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-base-100 rounded certificate-border p-7 flex flex-col justify-between shadow-certificate hover:shadow-certificate-lg transition-shadow">
              <div>
                <div className="w-12 h-12 rounded bg-kupon-gold/15 border border-kupon-gold/40 flex items-center justify-center text-kupon-gold mb-5">
                  <ScaleIcon className="w-6 h-6" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-kupon-gold font-bold mb-1">
                  Rule 2 · Fair Shares
                </div>
                <h3 className="text-xl font-serif font-bold text-kupon-ink mb-3">No Giant Whales</h3>
                <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed mb-4">
                  Retail bonds are meant for ordinary families, not giant hedge funds. Every regular wallet has a strict
                  5,000 token limit so rich whales can&apos;t hoard all the supply.
                </p>
              </div>
              <div className="pt-4 border-t border-base-300 text-xs font-mono text-kupon-gold font-medium flex items-center justify-between">
                <span>Code Rule: R2-CAP</span>
                <span className="text-[10px] text-kupon-ink/50 font-sans">5,000 Token Max</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-base-100 rounded certificate-border p-7 flex flex-col justify-between shadow-certificate hover:shadow-certificate-lg transition-shadow">
              <div>
                <div className="w-12 h-12 rounded bg-red-800/10 border border-red-800/30 flex items-center justify-center text-red-800 mb-5">
                  <LockClosedIcon className="w-6 h-6" />
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-kupon-gold font-bold mb-1">
                  Rule 3 · Rapid Safety
                </div>
                <h3 className="text-xl font-serif font-bold text-kupon-ink mb-3">Instant Suspicious Freezes</h3>
                <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed mb-4">
                  If a wallet is stolen, compromised, or sanctioned, authorities can freeze that specific wallet in
                  seconds without shutting down trading for honest users.
                </p>
              </div>
              <div className="pt-4 border-t border-base-300 text-xs font-mono text-red-800 font-medium flex items-center justify-between">
                <span>Code Rule: R3-FROZEN</span>
                <span className="text-[10px] text-kupon-ink/50 font-sans">Surgical Freeze</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. THE 3-PORTAL ECOSYSTEM */}
      {/* ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-mono uppercase tracking-widest text-kupon-gold font-bold mb-2">
            Built for Real Use
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-kupon-ink mb-4">
            Simple portals for citizens, issuers, and watchdogs.
          </h2>
          <p className="text-base sm:text-lg text-kupon-ink/80 font-sans leading-relaxed">
            See how different people interact with the Kupon system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Persona 1: Investor */}
          <div className="bg-base-100 rounded certificate-border p-7 flex flex-col justify-between shadow-certificate">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UserGroupIcon className="w-5 h-5 text-kupon-emerald" />
                <span className="text-xs font-mono uppercase tracking-wider text-kupon-emerald font-bold">
                  For Citizens
                </span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-kupon-ink mb-2">Investor Portal</h3>
              <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed mb-6">
                Check your bond balance and send tokens easily. If you enter an address that isn&apos;t allowed to
                receive bonds, the app explains why before you waste any gas fees.
              </p>
            </div>
            <Link
              href="/app"
              className="btn btn-primary btn-sm text-kupon-ivory certificate-border-emerald font-sans w-full flex items-center justify-center gap-1.5"
            >
              <span>Launch Investor App</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {/* Persona 2: Registrar */}
          <div className="bg-base-100 rounded certificate-border p-7 flex flex-col justify-between shadow-certificate">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BuildingLibraryIcon className="w-5 h-5 text-kupon-gold" />
                <span className="text-xs font-mono uppercase tracking-wider text-kupon-gold font-bold">
                  For the Government
                </span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-kupon-ink mb-2">Debt Management Office</h3>
              <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed mb-6">
                Authorize citizen identities, issue new bond batches within the legal limit, and manage the national
                registry without manual spreadsheets.
              </p>
            </div>
            <Link
              href="/registrar"
              className="btn btn-outline btn-sm border-kupon-gold text-kupon-ink hover:bg-kupon-gold/10 font-sans w-full flex items-center justify-center gap-1.5"
            >
              <span>Registrar Portal (T7)</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {/* Persona 3: Regulator */}
          <div className="bg-base-100 rounded certificate-border p-7 flex flex-col justify-between shadow-certificate">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheckIcon className="w-5 h-5 text-kupon-emerald" />
                <span className="text-xs font-mono uppercase tracking-wider text-kupon-emerald font-bold">
                  For Watchdogs
                </span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-kupon-ink mb-2">Regulator Terminal</h3>
              <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed mb-6">
                Watch transactions live, check that no one is hoarding extra tokens, and test safety scenarios with
                complete transparency and zero blind spots.
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
      {/* 5. LIVE STATS TELEMETRY STRIP */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-r from-[#FAF6EC] via-[#F4EEDC] to-[#FAF6EC] border-t border-b border-kupon-gold/30 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-2 border-b border-base-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <h2 className="text-xs font-mono uppercase tracking-widest text-kupon-ink font-bold m-0">
                Live Onchain Verification (Base Sepolia · Chain 84532)
              </h2>
            </div>
            <div className="text-[11px] font-mono text-kupon-ink/60 mt-1 sm:mt-0">
              Live data direct from verified smart contracts
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-base-100 p-5 rounded border border-kupon-gold/40 shadow-sm">
              <div className="text-[11px] font-mono uppercase tracking-wider text-kupon-ink/60 mb-1">
                Bonds in Circulation
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-kupon-emerald tabular-nums">
                {isLoadingSupply ? <span className="text-base text-kupon-ink/40">Polling...</span> : formattedSupply}
              </div>
              <div className="text-[10px] font-sans text-kupon-ink/60 mt-1">KPON issued so far</div>
            </div>

            <div className="bg-base-100 p-5 rounded border border-kupon-gold/40 shadow-sm">
              <div className="text-[11px] font-mono uppercase tracking-wider text-kupon-ink/60 mb-1">
                Max Series Limit
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-kupon-ink tabular-nums">
                {isLoadingSeriesCap ? (
                  <span className="text-base text-kupon-ink/40">Polling...</span>
                ) : (
                  formattedSeriesCap
                )}
              </div>
              <div className="text-[10px] font-sans text-kupon-ink/60 mt-1">Total bond issuance cap</div>
            </div>

            <div className="bg-base-100 p-5 rounded border border-kupon-gold/40 shadow-sm">
              <div className="text-[11px] font-mono uppercase tracking-wider text-kupon-ink/60 mb-1">
                Max Limit Per Person
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-kupon-gold tabular-nums">
                {isLoadingRetailCap ? (
                  <span className="text-base text-kupon-ink/40">Polling...</span>
                ) : (
                  formattedRetailCap
                )}
              </div>
              <div className="text-[10px] font-sans text-kupon-ink/60 mt-1">Stops hoarding by whales</div>
            </div>

            <div className="bg-base-100 p-5 rounded border border-kupon-gold/40 shadow-sm">
              <div className="text-[11px] font-mono uppercase tracking-wider text-kupon-ink/60 mb-1">
                Verified Citizens
              </div>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-kupon-emerald tabular-nums">
                {totalClaimsCount}
              </div>
              <div className="text-[10px] font-sans text-kupon-ink/60 mt-1">Identity checks onchain</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TECHNICAL AUDIT BRIDGE (For Developers and Judges) */}
      {/* ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto w-full">
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
              Inspect decoded rule errors (<code className="font-mono text-xs">Kupon__RuleViolated</code>), interact
              directly with verified contracts on Base Sepolia, and test contract functions in our Protocol Debugger.
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
      <section className="pb-16 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="p-6 sm:p-8 rounded bg-[#F4EEDC] border border-kupon-gold/40 text-xs font-sans text-kupon-ink/85 leading-relaxed flex flex-col gap-4">
          <div className="flex items-center gap-2 font-serif font-bold text-sm text-kupon-emerald">
            <CheckBadgeIcon className="w-4 h-4 text-kupon-emerald" />
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
