"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Address, AddressInput } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther, isAddress, keccak256, parseEther, toHex } from "viem";
import { useAccount } from "wagmi";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  KeyIcon,
  MinusCircleIcon,
  SparklesIcon,
  UserPlusIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { GuillochePattern } from "~~/components/GuillochePattern";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

// Smart contract identifiers
const RESIDENCY_ID = keccak256(toHex("RESIDENCY_ID"));
const ACCREDITED = keccak256(toHex("ACCREDITED"));
const REGISTRAR_ROLE = keccak256(toHex("REGISTRAR_ROLE"));
const ISSUER_ROLE = keccak256(toHex("ISSUER_ROLE"));
const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

const DEPLOYER_AUTHORITY_ADDRESS = "0x2b97bea17da0ff83fd95a73dc60881d5b27a2b9b";

// Preset accounts for testing & demonstration
const DEMO_PRESETS = [
  { label: "Alice (Retail Demo)", address: "0x1111111111111111111111111111111111111111" },
  { label: "Bob (Institutional Demo)", address: "0x2222222222222222222222222222222222222222" },
] as const;

export type SBNSeries = {
  id: string;
  code: string;
  name: string;
  alias: string;
  category: "Conventional" | "Sharia";
  tenorYears: number;
  tenorLabel: string;
  maturityDate: string;
  couponRate: number; // in percent p.a.
  couponType: "Fixed Rate" | "Floating with Floor";
  payoutSchedule: string;
  tradable: boolean;
  minPurchaseKPON: number;
  maxPurchaseRetailKPON: number;
  isBenchmark: boolean;
  description: string;
};

// Modeled from real Indonesian Ministry of Finance (DJPPR) 2026/2027 retail issuance schedule
export const SBN_SERIES_CATALOG: SBNSeries[] = [
  {
    id: "ori026-t3",
    code: "ORI026-T3",
    name: "Obligasi Negara Ritel Seri 026 (Tenor 3 Tahun)",
    alias: "Sovereign Retail Fixed Benchmark",
    category: "Conventional",
    tenorYears: 3,
    tenorLabel: "3 Years (2026 – 2029)",
    maturityDate: "15 Oct 2029",
    couponRate: 6.4,
    couponType: "Fixed Rate",
    payoutSchedule: "Monthly (every 15th)",
    tradable: true,
    minPurchaseKPON: 1,
    maxPurchaseRetailKPON: 5000,
    isBenchmark: true,
    description: "Benchmark sovereign retail bond. 24/7 onchain secondary trading enabled via Kupon compliance hook.",
  },
  {
    id: "ori026-t6",
    code: "ORI026-T6",
    name: "Obligasi Negara Ritel Seri 026 (Tenor 6 Tahun)",
    alias: "Long-Horizon Sovereign Yield",
    category: "Conventional",
    tenorYears: 6,
    tenorLabel: "6 Years (2026 – 2032)",
    maturityDate: "15 Oct 2032",
    couponRate: 6.65,
    couponType: "Fixed Rate",
    payoutSchedule: "Monthly (every 15th)",
    tradable: true,
    minPurchaseKPON: 1,
    maxPurchaseRetailKPON: 10000,
    isBenchmark: false,
    description: "Extended maturity offering premium sovereign yield. Tradable post minimum holding period.",
  },
  {
    id: "sr021-t3",
    code: "SR021-T3",
    name: "Sukuk Ritel Seri 021 (Tenor 3 Tahun)",
    alias: "Sovereign Sharia Ijarah Sukuk",
    category: "Sharia",
    tenorYears: 3,
    tenorLabel: "3 Years (2026 – 2029)",
    maturityDate: "10 Sep 2029",
    couponRate: 6.45,
    couponType: "Fixed Rate",
    payoutSchedule: "Monthly (every 10th)",
    tradable: true,
    minPurchaseKPON: 1,
    maxPurchaseRetailKPON: 5000,
    isBenchmark: false,
    description: "100% Sharia-compliant sovereign debt backed by state asset leases (Ijarah Asset to be Leased).",
  },
  {
    id: "sbr013-t2",
    code: "SBR013-T2",
    name: "Savings Bond Ritel Seri 013 (Tenor 2 Tahun)",
    alias: "Floating with Floor Inflation Shield",
    category: "Conventional",
    tenorYears: 2,
    tenorLabel: "2 Years (2026 – 2028)",
    maturityDate: "10 Jul 2028",
    couponRate: 6.5,
    couponType: "Floating with Floor",
    payoutSchedule: "Monthly (every 10th)",
    tradable: false,
    minPurchaseKPON: 1,
    maxPurchaseRetailKPON: 5000,
    isBenchmark: false,
    description:
      "Floating coupon linked to BI-Rate with guaranteed 6.50% floor. Non-tradable with 50% early redemption option.",
  },
  {
    id: "st013-t4",
    code: "ST013-T4",
    name: "Sukuk Tabungan Seri 013 (Tenor 4 Tahun)",
    alias: "Green Sukuk Renewable Energy",
    category: "Sharia",
    tenorYears: 4,
    tenorLabel: "4 Years (2026 – 2030)",
    maturityDate: "10 Nov 2030",
    couponRate: 6.75,
    couponType: "Floating with Floor",
    payoutSchedule: "Monthly (every 10th)",
    tradable: false,
    minPurchaseKPON: 1,
    maxPurchaseRetailKPON: 10000,
    isBenchmark: false,
    description:
      "Funds green infrastructure projects (solar, geothermal, eco-transport) under national APBN Green Framework.",
  },
];

type ClaimType = "RESIDENCY_ID" | "ACCREDITED";
type StepMode = 1 | 2;

function translateRegistrarError(rawError: unknown): string {
  const parsed = getParsedError(rawError);
  if (/AccessControlUnauthorizedAccount/i.test(parsed) || /unauthorized/i.test(parsed) || /0x4e487b71/i.test(parsed)) {
    return "Access Denied: Connected wallet lacks REGISTRAR_ROLE or ISSUER_ROLE authority.";
  }
  if (/Kupon__SeriesCapExceeded/i.test(parsed)) {
    return "Issuance Rejected: Proposed tranche exceeds the remaining series cap of 100,000 KPON.";
  }
  if (/Kupon__RuleViolated/i.test(parsed) || /R1-RESIDENCY/i.test(parsed)) {
    return "Compliance Violation (R1-RESIDENCY): Investor must hold an active identity claim before receiving bond tokens.";
  }
  if (/R2-CAP/i.test(parsed)) {
    return "Compliance Violation (R2-CAP): Retail holdings cannot exceed the 5,000 KPON statutory cap.";
  }
  if (/Kupon__InvalidClaim/i.test(parsed)) {
    return "Invalid claim type. Must be either RESIDENCY_ID or ACCREDITED.";
  }
  if (/execution reverted/i.test(parsed)) {
    return "Transaction reverted onchain. Ensure target identity credentials and balance constraints are met.";
  }
  return parsed;
}

const RegistrarPage: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  // Active workspace state: single investor address drives all actions
  const [investorAddress, setInvestorAddress] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<StepMode>(1);

  // Step 1 state: Verification
  const [selectedClaim, setSelectedClaim] = useState<ClaimType>("RESIDENCY_ID");
  const [isProcessingClaim, setIsProcessingClaim] = useState(false);

  // Step 2 state: Selected Bond Series & Issuance Amount
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("ori026-t3");
  const [issueAmount, setIssueAmount] = useState<string>("500");
  const [isIssuingTokens, setIsIssuingTokens] = useState(false);

  const selectedBond = useMemo(
    () => SBN_SERIES_CATALOG.find(b => b.id === selectedSeriesId) ?? SBN_SERIES_CATALOG[0],
    [selectedSeriesId],
  );

  // Contract Reads: Authority checks on connected wallet
  const targetWallet = connectedAddress ?? ZERO_ADDRESS;

  const { data: isRegistrar } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasRole",
    args: [REGISTRAR_ROLE, targetWallet],
  });

  const { data: isRegistryAdmin } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasRole",
    args: [DEFAULT_ADMIN_ROLE, targetWallet],
  });

  const { data: isIssuer } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "hasRole",
    args: [ISSUER_ROLE, targetWallet],
  });

  const hasRegistrarAuthority = Boolean(isRegistrar || isRegistryAdmin);
  const hasIssuerAuthority = Boolean(isIssuer);
  const isCurrentActionAuthorized = currentStep === 1 ? hasRegistrarAuthority : hasIssuerAuthority;

  // Contract Reads: Global Token Metrics
  const { data: totalSupply, refetch: refetchSupply } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "totalSupply",
  });

  const { data: seriesCap } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "SERIES_CAP",
  });

  const { data: retailCap } = useScaffoldReadContract({
    contractName: "KuponComplianceModule",
    functionName: "cap",
  });

  // Contract Writes
  const { writeContractAsync: writeClaimRegistry } = useScaffoldWriteContract({ contractName: "KuponClaimRegistry" });
  const { writeContractAsync: writeToken } = useScaffoldWriteContract({ contractName: "KuponToken" });

  // ---------------------------------------------------------------------------
  // Queries for current investor address
  // ---------------------------------------------------------------------------
  const isAddressValid = isAddress(investorAddress);
  const safeTarget = isAddressValid ? investorAddress : ZERO_ADDRESS;

  const { data: hasResidency, refetch: refetchResidency } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasClaim",
    args: [safeTarget, RESIDENCY_ID],
  });

  const { data: hasAccredited, refetch: refetchAccredited } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasClaim",
    args: [safeTarget, ACCREDITED],
  });

  const { data: investorBalance, refetch: refetchBalance } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "balanceOf",
    args: [safeTarget],
  });

  const isInvestorVerified = Boolean(hasResidency || hasAccredited);
  const currentClaimActive = selectedClaim === "RESIDENCY_ID" ? Boolean(hasResidency) : Boolean(hasAccredited);

  // Pre-flight check for tranche issuance
  const parsedIssueAmount = useMemo(() => {
    try {
      if (!issueAmount.trim()) return undefined;
      return parseEther(issueAmount);
    } catch {
      return undefined;
    }
  }, [issueAmount]);

  const issuanceValidation = useMemo(() => {
    if (!isAddressValid) {
      return { ok: false, text: "Select or input a target investor address first." };
    }
    if (parsedIssueAmount === undefined || parsedIssueAmount <= 0n) {
      return { ok: false, text: "Specify a valid positive bond amount to issue." };
    }
    if (seriesCap !== undefined && totalSupply !== undefined) {
      if (parsedIssueAmount > seriesCap - totalSupply) {
        return {
          ok: false,
          text: `Tranche exceeds series quota. Remaining capacity: ${Number(formatEther(seriesCap - totalSupply)).toLocaleString("en-US")} KPON.`,
        };
      }
    }
    if (hasResidency === undefined || hasAccredited === undefined) {
      return { ok: false, text: "Checking investor compliance credentials..." };
    }
    if (!hasResidency && !hasAccredited) {
      return {
        ok: false,
        text: "Blocked by R1-RESIDENCY: Investor holds no active identity credential. Grant citizenship in Step 1 before issuing bonds.",
      };
    }
    const isRetail = hasResidency && !hasAccredited;
    if (isRetail && retailCap !== undefined && investorBalance !== undefined) {
      if (parsedIssueAmount > retailCap || investorBalance > retailCap - parsedIssueAmount) {
        return {
          ok: false,
          text: `Blocked by R2-CAP: Retail investor holding cap is 5,000 KPON. Current balance is ${formatEther(investorBalance)} KPON.`,
        };
      }
    }
    return {
      ok: true,
      text: "Compliance approved: Investor credentials verified and series quota capacity available.",
    };
  }, [
    isAddressValid,
    parsedIssueAmount,
    seriesCap,
    totalSupply,
    hasResidency,
    hasAccredited,
    retailCap,
    investorBalance,
  ]);

  // Yield & Profit Calculation
  const financialForecast = useMemo(() => {
    const rawUnits = Number(issueAmount.trim());
    if (isNaN(rawUnits) || rawUnits <= 0) return null;

    const principalIDR = rawUnits * 1_000_000;
    const annualRate = selectedBond.couponRate / 100;
    const annualCouponIDR = principalIDR * annualRate;
    const monthlyCouponIDR = annualCouponIDR / 12;
    const totalCouponProfitIDR = annualCouponIDR * selectedBond.tenorYears;
    const totalMaturityPayoutIDR = principalIDR + totalCouponProfitIDR;
    const totalProfitPercentage = (selectedBond.couponRate * selectedBond.tenorYears).toFixed(2);

    return {
      principalIDR,
      annualCouponIDR,
      monthlyCouponIDR,
      totalCouponProfitIDR,
      totalMaturityPayoutIDR,
      totalProfitPercentage,
    };
  }, [issueAmount, selectedBond]);

  // Actions
  const handleGrantClaim = async () => {
    if (!isAddressValid) {
      notification.error("Please enter a valid investor address.");
      return;
    }
    setIsProcessingClaim(true);
    try {
      await writeClaimRegistry({
        functionName: "grantClaim",
        args: [investorAddress, selectedClaim === "RESIDENCY_ID" ? RESIDENCY_ID : ACCREDITED],
      });
      notification.success(
        `Successfully granted ${selectedClaim === "RESIDENCY_ID" ? "Indonesian Residency" : "Accreditation"} to ${investorAddress.slice(0, 6)}…`,
      );
      await Promise.all([refetchResidency(), refetchAccredited()]);
    } catch (err) {
      notification.error(translateRegistrarError(err), { duration: 7000 });
    } finally {
      setIsProcessingClaim(false);
    }
  };

  const handleRevokeClaim = async () => {
    if (!isAddressValid) {
      notification.error("Please enter a valid investor address.");
      return;
    }
    setIsProcessingClaim(true);
    try {
      await writeClaimRegistry({
        functionName: "revokeClaim",
        args: [investorAddress, selectedClaim === "RESIDENCY_ID" ? RESIDENCY_ID : ACCREDITED],
      });
      notification.success(
        `Revoked ${selectedClaim === "RESIDENCY_ID" ? "Indonesian Residency" : "Accreditation"} from ${investorAddress.slice(0, 6)}…`,
      );
      await Promise.all([refetchResidency(), refetchAccredited()]);
    } catch (err) {
      notification.error(translateRegistrarError(err), { duration: 7000 });
    } finally {
      setIsProcessingClaim(false);
    }
  };

  const handleIssueTranche = async () => {
    if (!isAddressValid || !parsedIssueAmount || !issuanceValidation.ok) {
      notification.error(issuanceValidation.text);
      return;
    }
    setIsIssuingTokens(true);
    try {
      await writeToken({
        functionName: "issue",
        args: [investorAddress, parsedIssueAmount],
      });
      notification.success(
        `Successfully allocated ${issueAmount} KPON (${selectedBond.code}) to ${investorAddress.slice(0, 6)}…`,
      );
      await Promise.all([refetchSupply(), refetchBalance()]);
    } catch (err) {
      notification.error(translateRegistrarError(err), { duration: 7000 });
    } finally {
      setIsIssuingTokens(false);
    }
  };

  // Metric numbers
  const currentSupplyNum = totalSupply ? Number(formatEther(totalSupply)) : 2000;
  const seriesCapNum = seriesCap ? Number(formatEther(seriesCap)) : 100000;
  const remainingNum = Math.max(0, seriesCapNum - currentSupplyNum);
  const percentageIssued = Math.min(100, (currentSupplyNum / seriesCapNum) * 100);

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EC] text-[#14201C] selection:bg-kupon-gold/30">
      {/* Subtle Background Guilloche Watermark */}
      <div className="absolute right-6 top-20 pointer-events-none opacity-[0.03] overflow-hidden">
        <GuillochePattern variant="seal" width={680} height={680} color="emerald" />
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-10 pb-24 relative z-10 flex flex-col gap-8">
        {/* ===================================================================== */}
        {/* 1. EDITORIAL HEADER & METRICS STRIP (SINGLE BORDER) */}
        {/* ===================================================================== */}
        <header className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-serif font-bold text-kupon-ink tracking-tight m-0">
                Registrar Portal
              </h1>
              <p className="text-base text-kupon-ink/75 font-sans max-w-2xl leading-relaxed m-0">
                National identity certification (KSEI SID) and primary debt issuance desk for qualified sovereign bond
                tranches.
              </p>
            </div>

            {/* Authority Status Pill */}
            <div className="inline-flex items-center gap-3 bg-[#F4EEDC] px-4 py-2.5 rounded-full text-xs font-sans self-start lg:self-auto border border-kupon-gold/30">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isCurrentActionAuthorized ? "bg-kupon-emerald animate-pulse" : "bg-kupon-gold"
                }`}
              />
              <span className="font-semibold text-kupon-ink">
                {isCurrentActionAuthorized ? "Authorized Authority" : "Observer Mode"}
              </span>
              <span className="text-kupon-ink/40">|</span>
              <span className="font-mono text-kupon-ink/70">
                {connectedAddress ? `${connectedAddress.slice(0, 6)}…${connectedAddress.slice(-4)}` : "Disconnected"}
              </span>
            </div>
          </div>

          {/* Series Quota Strip (Single Border) */}
          <div className="bg-[#F8F3E5] px-6 py-4 rounded-xl border border-kupon-gold/30 flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between text-xs font-sans text-kupon-ink/80 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-kupon-ink/60">Issued Volume:</span>
                <strong className="text-kupon-emerald font-mono text-sm">
                  {currentSupplyNum.toLocaleString("en-US")} KPON
                </strong>
                <span className="text-kupon-ink/60">(Rp{currentSupplyNum.toLocaleString("en-US")} Million)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-kupon-ink/60">Available Quota:</span>
                <strong className="text-kupon-gold font-mono text-sm">
                  {remainingNum.toLocaleString("en-US")} KPON
                </strong>
                <span className="text-kupon-ink/60">of 100,000 KPON Authorized</span>
              </div>
            </div>
            <div className="w-full bg-[#E5DEC7] h-2 rounded-full overflow-hidden">
              <div
                className="bg-kupon-emerald h-full transition-all duration-500 rounded-full"
                style={{ width: `${percentageIssued}%` }}
              />
            </div>
          </div>

          {/* Observer Notification Banner */}
          {connectedAddress && !hasRegistrarAuthority && (
            <div className="bg-[#FAF1DF] px-4 py-3 rounded-lg border border-kupon-gold/30 text-xs text-kupon-ink/85 flex items-center gap-2.5">
              <InformationCircleIcon className="w-4 h-4 text-kupon-gold shrink-0" />
              <span>
                You are viewing in read-only mode. Connect the deployer authority wallet (
                <code className="font-mono text-[11px] bg-[#F4EEDC] px-1 py-0.5 rounded">
                  {DEPLOYER_AUTHORITY_ADDRESS}
                </code>
                ) to sign on-chain certification and issuance transactions.
              </span>
            </div>
          )}
        </header>

        {/* ===================================================================== */}
        {/* 2. ASYMMETRIC WORKBENCH (5 : 7 RATIO, SINGLE BORDER CONTAINERS) */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ----------------------------------------------------------------- */}
          {/* LEFT COLUMN: INVESTOR ACCOUNT DOSSIER (5 COLS, SINGLE BORDER) */}
          {/* ----------------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="space-y-1">
              <h2 className="text-xl font-serif font-bold text-kupon-ink m-0">Target Investor</h2>
              <p className="text-xs text-kupon-ink/70 font-sans m-0">
                Input an address to query live credentials and ledger holdings.
              </p>
            </div>

            {/* Address Input */}
            <div className="space-y-2">
              <AddressInput
                value={investorAddress}
                onChange={setInvestorAddress}
                placeholder="Investor address (0x...)"
              />

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-sans">
                <span className="text-kupon-ink/50 text-[11px]">Quick presets:</span>
                {connectedAddress && (
                  <button
                    type="button"
                    onClick={() => setInvestorAddress(connectedAddress)}
                    className="px-2 py-0.5 rounded bg-[#F4EEDC] hover:bg-[#EAE2C8] text-kupon-emerald font-mono text-[11px] cursor-pointer transition-colors border border-kupon-gold/20"
                  >
                    My Wallet
                  </button>
                )}
                {DEMO_PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setInvestorAddress(preset.address)}
                    className="px-2 py-0.5 rounded bg-[#F4EEDC] hover:bg-[#EAE2C8] text-kupon-ink/80 text-[11px] cursor-pointer transition-colors border border-kupon-gold/20"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Investor Dossier Card (Single Clean Border) */}
            {isAddressValid ? (
              <div className="bg-[#F8F3E5] p-6 rounded-xl border border-kupon-gold/30 flex flex-col gap-5">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-kupon-ink/50">
                    Selected Investor
                  </span>
                  <div className="pt-0.5">
                    <Address address={investorAddress} format="long" size="sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-kupon-gold/20">
                  {/* Status Overview */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-kupon-ink/50">Classification</span>
                    <div className="font-sans font-semibold text-xs text-kupon-ink flex items-center gap-1.5">
                      {hasAccredited ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-kupon-gold" />
                          <span>Accredited Entity</span>
                        </>
                      ) : hasResidency ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-kupon-emerald" />
                          <span>WNI Retail Citizen</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-base-300" />
                          <span className="text-kupon-ink/60">Uncertified</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Balance Holdings */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-kupon-ink/50">Current Balance</span>
                    <div className="font-serif font-bold text-lg text-kupon-ink leading-none">
                      {investorBalance !== undefined ? formatEther(investorBalance) : "0"}{" "}
                      <span className="text-xs font-sans font-normal text-kupon-ink/60">KPON</span>
                    </div>
                    <div className="text-[11px] text-kupon-ink/50 font-sans">
                      ≈ Rp
                      {investorBalance !== undefined
                        ? Number(formatEther(investorBalance)).toLocaleString("id-ID")
                        : "0"}{" "}
                      Million
                    </div>
                  </div>
                </div>

                {/* Practical Rule Note */}
                <div className="text-xs font-sans leading-relaxed text-kupon-ink/75 bg-[#FAF6EC] p-3.5 rounded-lg border border-kupon-gold/20">
                  {!hasResidency && !hasAccredited ? (
                    <span className="text-kupon-ink/80">
                      This wallet holds no verified identity claims. Outgoing and incoming transfers are blocked under
                      rule R1 until certified.
                    </span>
                  ) : hasResidency && !hasAccredited ? (
                    <span className="text-kupon-ink/80">
                      Verified as <strong>Retail Indonesian Citizen</strong>. Holding cap of 5,000 KPON (Rp5 Billion) is
                      enforced by rule R2.
                    </span>
                  ) : (
                    <span className="text-kupon-ink/80">
                      Verified as <strong>Institutional / Accredited</strong>. Exempt from the retail cap for primary
                      liquidity operations.
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#F8F3E5] p-8 rounded-xl border border-dashed border-kupon-gold/30 text-center text-xs font-sans text-kupon-ink/60 space-y-1">
                <p className="m-0 font-medium text-kupon-ink/70">No investor address selected</p>
                <p className="m-0">Type an address or pick one of the presets above to inspect live on-chain status.</p>
              </div>
            )}
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* RIGHT COLUMN: ACTION WORKBENCH (7 COLS, SINGLE BORDER) */}
          {/* ----------------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col gap-6 bg-[#F8F3E5] p-6 sm:p-8 rounded-xl border border-kupon-gold/30">
            {/* Step Guided Header */}
            <div className="flex items-center justify-between border-b border-kupon-gold/20 pb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className={`flex items-center gap-2 text-xs font-sans font-semibold cursor-pointer transition-colors ${
                    currentStep === 1 ? "text-kupon-emerald" : "text-kupon-ink/50 hover:text-kupon-ink"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs ${
                      currentStep === 1 ? "bg-kupon-emerald text-kupon-ivory" : "bg-[#EAE2C8] text-kupon-ink/70"
                    }`}
                  >
                    1
                  </span>
                  <span>Identity Verification</span>
                </button>

                <span className="text-kupon-ink/30">→</span>

                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className={`flex items-center gap-2 text-xs font-sans font-semibold cursor-pointer transition-colors ${
                    currentStep === 2 ? "text-kupon-gold" : "text-kupon-ink/50 hover:text-kupon-ink"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs ${
                      currentStep === 2 ? "bg-kupon-gold text-kupon-ink" : "bg-[#EAE2C8] text-kupon-ink/70"
                    }`}
                  >
                    2
                  </span>
                  <span>Bond Series Issuance</span>
                </button>
              </div>

              <span className="text-[11px] font-mono text-kupon-ink/50 uppercase tracking-wider hidden sm:inline">
                {currentStep === 1 ? "Step 1 of 2" : "Step 2 of 2"}
              </span>
            </div>

            {/* =============================================================== */}
            {/* STEP 1: IDENTITY CERTIFICATION & CLEAR STATUS DISPLAY */}
            {/* =============================================================== */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-6">
                <div className="space-y-1">
                  <h3 className="text-xl font-serif font-bold text-kupon-ink m-0">Identity Claims Verification</h3>
                  <p className="text-xs text-kupon-ink/75 font-sans m-0 leading-relaxed">
                    Query and update on-chain identity credentials in KuponClaimRegistry before bond tokens can be
                    issued or received.
                  </p>
                </div>

                {/* Clear, Dedicated Status Display */}
                <div className="bg-[#FAF6EC] p-4 rounded-lg border border-kupon-gold/30 flex flex-col gap-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-kupon-ink/60">
                    On-Chain Credentials Status
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Residency Claim Status */}
                    <div className="bg-[#F8F3E5] p-3.5 rounded-lg border border-kupon-gold/20 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-kupon-ink font-sans">Indonesian Citizen (WNI)</span>
                        {hasResidency ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-kupon-emerald bg-kupon-emerald/10 px-2 py-0.5 rounded">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-kupon-ink/50 bg-base-200 px-2 py-0.5 rounded">
                            <XCircleIcon className="w-3.5 h-3.5" />
                            NOT GRANTED
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-kupon-ink/65 font-sans">
                        RESIDENCY_ID · Required for retail tranche (5,000 KPON cap).
                      </span>
                    </div>

                    {/* Accredited Claim Status */}
                    <div className="bg-[#F8F3E5] p-3.5 rounded-lg border border-kupon-gold/20 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-kupon-ink font-sans">
                          Institutional / Accredited
                        </span>
                        {hasAccredited ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-kupon-gold bg-kupon-gold/10 px-2 py-0.5 rounded">
                            <CheckCircleIcon className="w-3.5 h-3.5" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-kupon-ink/50 bg-base-200 px-2 py-0.5 rounded">
                            <XCircleIcon className="w-3.5 h-3.5" />
                            NOT GRANTED
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-kupon-ink/65 font-sans">
                        ACCREDITED · Exempts holder from retail per-investor cap.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form to Grant / Select Credential */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-mono font-medium text-kupon-ink">Select Credential to Issue:</label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      className={`p-3.5 rounded-lg border cursor-pointer flex items-start gap-3 transition-colors ${
                        selectedClaim === "RESIDENCY_ID"
                          ? "bg-[#FAF6EC] border-kupon-emerald"
                          : "bg-[#FAF6EC]/60 border-kupon-gold/20 hover:border-kupon-gold/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="claimSelection"
                        checked={selectedClaim === "RESIDENCY_ID"}
                        onChange={() => setSelectedClaim("RESIDENCY_ID")}
                        className="radio radio-primary radio-sm mt-0.5"
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-kupon-ink">Indonesian Citizen (WNI)</div>
                        <div className="text-[11px] text-kupon-ink/65 mt-0.5">
                          Unlocks retail tranche up to Rp5 Billion limit
                        </div>
                      </div>
                    </label>

                    <label
                      className={`p-3.5 rounded-lg border cursor-pointer flex items-start gap-3 transition-colors ${
                        selectedClaim === "ACCREDITED"
                          ? "bg-[#FAF6EC] border-kupon-gold"
                          : "bg-[#FAF6EC]/60 border-kupon-gold/20 hover:border-kupon-gold/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="claimSelection"
                        checked={selectedClaim === "ACCREDITED"}
                        onChange={() => setSelectedClaim("ACCREDITED")}
                        className="radio radio-primary radio-sm mt-0.5"
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-kupon-ink">Accredited / Institutional</div>
                        <div className="text-[11px] text-kupon-ink/65 mt-0.5">
                          Exempt from retail cap for qualified entities
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Primary Grant Button (Dominant) */}
                  <button
                    type="button"
                    onClick={handleGrantClaim}
                    disabled={isProcessingClaim || !isAddressValid || currentClaimActive}
                    className="btn btn-primary font-sans font-medium text-kupon-ivory flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 mt-1"
                  >
                    {isProcessingClaim ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <UserPlusIcon className="w-4 h-4" />
                    )}
                    <span>
                      {currentClaimActive
                        ? `Already Holds ${selectedClaim === "RESIDENCY_ID" ? "Residency" : "Accreditation"}`
                        : `Grant ${selectedClaim === "RESIDENCY_ID" ? "Indonesian Residency" : "Accreditation"} Claim`}
                    </span>
                  </button>

                  {/* Subdued Revoke Button (Non-Dominant, Subtle Secondary Action) */}
                  {currentClaimActive && (
                    <div className="flex items-center justify-between pt-2 border-t border-kupon-gold/20 text-xs font-sans">
                      <span className="text-kupon-ink/65 text-[11px]">Administrative Override:</span>
                      <button
                        type="button"
                        onClick={handleRevokeClaim}
                        disabled={isProcessingClaim}
                        className="text-error hover:underline flex items-center gap-1 font-medium cursor-pointer text-[11px]"
                      >
                        <MinusCircleIcon className="w-3.5 h-3.5" />
                        <span>Revoke this claim (Freezes Account)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Transition Action to Step 2 if Verified */}
                {isInvestorVerified && (
                  <div className="bg-[#EEF7F2] p-4 rounded-lg border border-kupon-emerald/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
                    <div className="flex items-center gap-2 text-xs font-sans text-kupon-emerald">
                      <CheckCircleIcon className="w-5 h-5 shrink-0" />
                      <span>Investor is verified! Ready to select bond series and issue tokens.</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="btn btn-sm bg-kupon-emerald hover:bg-kupon-emerald/90 text-kupon-ivory border-none font-sans flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <span>Proceed to Issue Bonds</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* =============================================================== */}
            {/* STEP 2: TRANCHE ISSUANCE & SBN SERIES SELECTION */}
            {/* =============================================================== */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-serif font-bold text-kupon-ink m-0">Primary Tranche Issuance</h3>
                    <p className="text-xs text-kupon-ink/75 font-sans m-0 leading-relaxed">
                      Select sovereign bond instrument, configure tranche size, and mint tokens to the verified
                      investor.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-sans text-kupon-emerald hover:underline flex items-center gap-1 self-start cursor-pointer"
                  >
                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                    <span>Back to Step 1</span>
                  </button>
                </div>

                {/* 1. SBN Series Catalog Selector */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <label className="font-semibold text-kupon-ink flex items-center gap-1.5">
                      <BanknotesIcon className="w-4 h-4 text-kupon-emerald" />
                      <span>Choose Sovereign Bond (SBN) Series:</span>
                    </label>
                    <span className="text-[11px] font-mono text-kupon-ink/60">Reference: DJPPR 2026/2027</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {SBN_SERIES_CATALOG.map(series => {
                      const isSelected = selectedSeriesId === series.id;
                      return (
                        <button
                          key={series.id}
                          type="button"
                          onClick={() => setSelectedSeriesId(series.id)}
                          className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                            isSelected
                              ? "bg-[#FAF6EC] border-kupon-emerald ring-1 ring-kupon-emerald"
                              : "bg-[#FAF6EC]/60 border-kupon-gold/20 hover:border-kupon-gold/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-xs font-mono text-kupon-ink flex items-center gap-1.5">
                                <span>{series.code}</span>
                                {series.isBenchmark && (
                                  <span className="text-[9px] font-mono uppercase bg-kupon-emerald/15 text-kupon-emerald px-1.5 py-0.2 rounded">
                                    Benchmark
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-sans text-kupon-ink/75 mt-0.5 line-clamp-1">
                                {series.alias}
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                                series.category === "Sharia"
                                  ? "bg-kupon-gold/15 text-kupon-gold font-semibold"
                                  : "bg-base-200 text-kupon-ink/60"
                              }`}
                            >
                              {series.category}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-kupon-gold/15">
                            <span className="text-kupon-emerald font-semibold">{series.couponRate}% p.a.</span>
                            <span className="text-kupon-ink/60">
                              {series.tenorYears} Yrs ({series.maturityDate.slice(-4)})
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Volume Input & Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="font-medium text-kupon-ink">Tranche Volume (KPON)</span>
                    <span className="text-kupon-ink/60 font-mono">1 KPON = 1 Bond Unit (Rp1,000,000)</span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={issueAmount}
                      onChange={e => setIssueAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className="input w-full font-mono text-lg bg-[#FAF6EC] border border-kupon-gold/30 text-kupon-ink focus:outline-none pr-16 rounded-lg"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-kupon-ink/50 pointer-events-none">
                      KPON
                    </span>
                  </div>

                  {/* Nominal Quick Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-sans">
                    <span className="text-kupon-ink/50 text-[11px]">Quick presets:</span>
                    {[
                      { label: "100 (Rp100M)", val: "100" },
                      { label: "500 (Rp500M)", val: "500" },
                      { label: "1,000 (Rp1B)", val: "1000" },
                      { label: "5,000 (Retail Max)", val: "5000" },
                    ].map(chip => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => setIssueAmount(chip.val)}
                        className="px-2.5 py-1 rounded bg-[#FAF6EC] hover:bg-[#FAF6EC]/80 border border-kupon-gold/20 text-kupon-ink text-xs cursor-pointer transition-colors font-mono"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Comprehensive Profit & Maturity Return Card */}
                {financialForecast && (
                  <div className="bg-[#FAF6EC] p-4 sm:p-5 rounded-xl border border-kupon-gold/30 flex flex-col gap-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-kupon-gold/20 gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-kupon-emerald">
                          <SparklesIcon className="w-4 h-4 text-kupon-gold" />
                          <span>{selectedBond.code} · Yield & Maturity Projection</span>
                        </div>
                        <div className="text-xs text-kupon-ink/70 font-sans mt-0.5">
                          {selectedBond.couponType} · Payout: {selectedBond.payoutSchedule}
                        </div>
                      </div>

                      <div className="text-xs font-sans text-right sm:self-auto">
                        <span className="text-kupon-ink/60">Tenor Maturity: </span>
                        <strong className="text-kupon-ink font-mono">{selectedBond.maturityDate}</strong>
                      </div>
                    </div>

                    {/* Financial Numbers Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {/* Principal */}
                      <div className="space-y-0.5">
                        <span className="text-kupon-ink/60 font-sans text-[11px]">Principal Capital</span>
                        <div className="font-serif font-bold text-sm text-kupon-ink">
                          Rp{financialForecast.principalIDR.toLocaleString("id-ID")}
                        </div>
                        <span className="text-[10px] font-mono text-kupon-ink/50">{issueAmount} KPON</span>
                      </div>

                      {/* Coupon Rate */}
                      <div className="space-y-0.5">
                        <span className="text-kupon-ink/60 font-sans text-[11px]">Coupon Yield</span>
                        <div className="font-serif font-bold text-sm text-kupon-emerald">
                          {selectedBond.couponRate}% p.a.
                        </div>
                        <span className="text-[10px] font-sans text-kupon-ink/50">Gross annual return</span>
                      </div>

                      {/* Monthly Payout */}
                      <div className="space-y-0.5">
                        <span className="text-kupon-ink/60 font-sans text-[11px]">Monthly Payout</span>
                        <div className="font-serif font-bold text-sm text-kupon-ink">
                          Rp{Math.round(financialForecast.monthlyCouponIDR).toLocaleString("id-ID")}
                        </div>
                        <span className="text-[10px] font-sans text-kupon-ink/50">Cashflow / month</span>
                      </div>

                      {/* Cumulative Total Profit */}
                      <div className="space-y-0.5">
                        <span className="text-kupon-ink/60 font-sans text-[11px]">
                          Total Profit ({selectedBond.tenorYears}Y)
                        </span>
                        <div className="font-serif font-bold text-sm text-kupon-gold">
                          +Rp{financialForecast.totalCouponProfitIDR.toLocaleString("id-ID")}
                        </div>
                        <span className="text-[10px] font-mono text-kupon-gold/80 font-semibold">
                          +{financialForecast.totalProfitPercentage}% Cumulative
                        </span>
                      </div>
                    </div>

                    {/* Final Payout Banner */}
                    <div className="bg-[#F8F3E5] p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-xs font-sans border border-kupon-gold/20 gap-2">
                      <div className="flex items-center gap-2">
                        <CalendarDaysIcon className="w-4 h-4 text-kupon-emerald shrink-0" />
                        <span className="text-kupon-ink/80">
                          Total Liquidity Received at Maturity (Principal + Profit):
                        </span>
                      </div>
                      <div className="font-mono font-bold text-sm text-kupon-emerald">
                        Rp{financialForecast.totalMaturityPayoutIDR.toLocaleString("id-ID")}
                      </div>
                    </div>

                    <div className="text-[11px] font-sans text-kupon-ink/60 flex items-center justify-between">
                      <span>{selectedBond.description}</span>
                      <span className="font-mono text-kupon-ink/50 shrink-0 ml-2">
                        {selectedBond.tradable ? "24/7 Tradable Secondary Market" : "50% Early Redemption Facility"}
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. Pre-Flight Compliance Feedback */}
                <div
                  className={`p-4 rounded-lg border text-xs font-sans leading-relaxed flex items-start gap-3 transition-colors ${
                    isAddressValid && parsedIssueAmount !== undefined && parsedIssueAmount > 0n
                      ? issuanceValidation.ok
                        ? "bg-[#EEF7F2] border-kupon-emerald/30 text-kupon-emerald"
                        : "bg-[#FDF2F1] border-error/30 text-error"
                      : "bg-[#FAF6EC] border-kupon-gold/20 text-kupon-ink/75"
                  }`}
                >
                  {isAddressValid && parsedIssueAmount !== undefined && parsedIssueAmount > 0n ? (
                    issuanceValidation.ok ? (
                      <CheckCircleIcon className="w-5 h-5 text-kupon-emerald shrink-0 mt-0.5" />
                    ) : (
                      <ExclamationCircleIcon className="w-5 h-5 text-error shrink-0 mt-0.5" />
                    )
                  ) : (
                    <InformationCircleIcon className="w-5 h-5 text-kupon-gold shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold mb-0.5">
                      {isAddressValid && parsedIssueAmount !== undefined && parsedIssueAmount > 0n
                        ? issuanceValidation.ok
                          ? "Issuance Gate Passed"
                          : "Issuance Pre-Flight Blocked"
                        : "Compliance Rule Evaluation"}
                    </div>
                    <p className="m-0 text-kupon-ink/80">{issuanceValidation.text}</p>
                  </div>
                </div>

                {/* 5. Primary Issue Button */}
                <button
                  type="button"
                  onClick={handleIssueTranche}
                  disabled={isIssuingTokens || !issuanceValidation.ok}
                  className="btn btn-primary font-sans font-medium text-kupon-ivory flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {isIssuingTokens ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <KeyIcon className="w-4 h-4" />
                  )}
                  <span>
                    Authorize & Issue {issueAmount ? `${issueAmount} KPON` : "Tranche"} ({selectedBond.code})
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 3. CLEAN FOOTER LINKS (SINGLE BORDER DIVIDER) */}
        {/* ===================================================================== */}
        <footer className="flex flex-wrap items-center justify-between pt-8 text-xs text-kupon-ink/70 font-sans gap-4 border-t border-kupon-gold/30">
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-kupon-emerald hover:underline font-medium">
              ← Return to Investor Application
            </Link>
            <span>·</span>
            <Link href="/regulator" className="text-kupon-gold hover:underline font-medium">
              Open Regulator Terminal →
            </Link>
          </div>
          <div className="font-mono text-[11px] text-kupon-ink/50">
            Identity Registry: <code className="text-kupon-emerald">KuponClaimRegistry.sol</code> · Mint Gate:{" "}
            <code className="text-kupon-gold">KuponToken.sol</code>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default RegistrarPage;
