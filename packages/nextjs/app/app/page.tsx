"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Address, AddressInput } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther, isAddress, keccak256, parseEther, toHex } from "viem";
import { useAccount } from "wagmi";
import {
  ArrowRightIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  KeyIcon,
  LockClosedIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { GuillochePattern } from "~~/components/GuillochePattern";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const RESIDENCY_ID = keccak256(toHex("RESIDENCY_ID"));
const ACCREDITED = keccak256(toHex("ACCREDITED"));
const CAP = 5_000n * 10n ** 18n; // 5,000 KPON retail cap (Rp5 Billion)

// Preset accounts for testing & demo
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
  couponRate: number; // percent p.a.
  couponType: "Fixed Rate" | "Floating with Floor";
  payoutSchedule: string;
  tradable: boolean;
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
    isBenchmark: false,
    description:
      "Funds green infrastructure projects (solar, geothermal, eco-transport) under national APBN Green Framework.",
  },
];

const RULE_IDS = {
  r1: keccak256(toHex("R1-RESIDENCY")),
  r2: keccak256(toHex("R2-CAP")),
  r3: keccak256(toHex("R3-FROZEN")),
} as const;

type ViemErrorLike = {
  data?: { errorName?: string; args?: readonly unknown[] };
  cause?: unknown;
  error?: unknown;
  walk?: () => unknown;
};

function asErrorLike(value: unknown): ViemErrorLike | null {
  if (value && typeof value === "object" && ("data" in value || "cause" in value || "walk" in value)) {
    return value as ViemErrorLike;
  }
  return null;
}

/** Walks viem error tree to extract decoded Kupon__RuleViolated ruleId */
function extractRuleViolatedId(error: unknown): string | null {
  let current: unknown = error;
  for (let depth = 0; depth < 6; depth++) {
    const node = asErrorLike(current);
    if (node?.data && node.data.errorName === "Kupon__RuleViolated") {
      const arg = Array.isArray(node.data.args) ? node.data.args[0] : node.data.args;
      if (typeof arg === "string" && /^0x[0-9a-fA-F]{64}$/.test(arg)) return arg;
    }
    if (!node) break;
    const next = node.cause ?? node.error ?? (typeof node.walk === "function" ? node.walk() : undefined);
    if (next === undefined || next === current) break;
    current = next;
  }
  const text = typeof error === "string" ? error : getParsedError(error);
  const match = text.match(/Kupon__RuleViolated\(0x([0-9a-fA-F]{64})\)/);
  return match ? `0x${match[1]}` : null;
}

function translateRevert(rawError: unknown): string {
  const parsed = getParsedError(rawError);
  if (/AccessControlUnauthorizedAccount/i.test(parsed) || /unauthorized/i.test(parsed) || /0x4e487b71/i.test(parsed)) {
    return "Primary Issuance Gate: In this testnet demo, official bond tranches are issued by the national authority. To mint live onchain, connect the authority wallet (0x2b97...) or request certification at the Registrar Desk.";
  }
  if (/Kupon__SeriesCapExceeded/i.test(parsed)) {
    return "Issuance Rejected: Proposed purchase exceeds the remaining series cap of 100,000 KPON.";
  }

  const ruleId = extractRuleViolatedId(rawError);
  if (ruleId === RULE_IDS.r1)
    return "Blocked by Rule R1-RESIDENCY: Investor wallet holds no verified identity claim. Verify your Indonesian citizenship (KSEI SID) in the Registrar Desk before ordering SBN.";
  if (ruleId === RULE_IDS.r2)
    return "Blocked by Rule R2-CAP: Retail wallets cannot hold more than 5,000 KPON (Rp5 Billion). Total holdings would exceed the statutory cap.";
  if (ruleId === RULE_IDS.r3)
    return "Blocked by Rule R3-FROZEN: Your wallet holds zero active identity claims. Outgoing transfers are frozen until re-certified.";

  if (/execution reverted/i.test(parsed))
    return "Transaction reverted by onchain compliance hook. Check identity credentials and statutory limits.";
  return parsed;
}

type SendVerdict = { ok: boolean; text: string };

function evaluateSend(input: {
  senderHasClaim: boolean | undefined;
  recipientHasResidency: boolean | undefined;
  recipientHasAccredited: boolean | undefined;
  recipientBalance: bigint | undefined;
  amount: bigint | undefined;
  cap: bigint;
}): SendVerdict | null {
  const { senderHasClaim, recipientHasResidency, recipientHasAccredited, recipientBalance, amount, cap } = input;

  if (senderHasClaim === undefined) return null;
  if (!senderHasClaim)
    return {
      ok: false,
      text: "Blocked by R3-FROZEN: Your wallet holds no active identity claims. Outgoing transfers are frozen.",
    };

  if (recipientHasResidency === undefined || recipientHasAccredited === undefined) return null;
  if (!recipientHasResidency && !recipientHasAccredited)
    return {
      ok: false,
      text: "Blocked by R1-RESIDENCY: Recipient holds no verified Indonesian residency claim. Ask Registrar to certify them first.",
    };

  const recipientIsRetail = recipientHasResidency && !recipientHasAccredited;
  if (recipientIsRetail && amount !== undefined && recipientBalance !== undefined) {
    if (amount > cap || recipientBalance > cap - amount)
      return {
        ok: false,
        text: "Blocked by R2-CAP: Retail wallets hold at most 5,000 KPON (Rp5 Billion). This transfer would exceed the cap.",
      };
  }

  return {
    ok: true,
    text: "Compliance approved: Transfer satisfies all residency and holding limits. Settle instantly.",
  };
}

const InvestorPage: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  // Mode: Primary Market (Buy SBN) vs Secondary Market (Transfer P2P)
  const [activeMarketMode, setActiveMarketMode] = useState<"primary" | "secondary">("primary");

  // Primary Market Subscription State
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("ori026-t3");
  const [orderAmount, setOrderAmount] = useState<string>("50");
  const [isOrdering, setIsOrdering] = useState(false);

  // Secondary Market Transfer State
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [isSending, setIsSending] = useState(false);

  const selectedBond = useMemo(
    () => SBN_SERIES_CATALOG.find(b => b.id === selectedSeriesId) ?? SBN_SERIES_CATALOG[0],
    [selectedSeriesId],
  );

  // Contract Reads for Connected Investor
  const { data: balance, refetch: refetchBalance } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "balanceOf",
    args: [connectedAddress ?? ZERO_ADDRESS],
  });

  const { data: hasResidency } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasClaim",
    args: [connectedAddress ?? ZERO_ADDRESS, RESIDENCY_ID],
  });

  const { data: hasAccredited } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasClaim",
    args: [connectedAddress ?? ZERO_ADDRESS, ACCREDITED],
  });

  const { data: totalSupply, refetch: refetchSupply } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "totalSupply",
  });

  const { data: seriesCap } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "SERIES_CAP",
  });

  // Contract Reads for Recipient Target
  const sendToIsValid = isAddress(sendTo);
  const sendTarget = sendToIsValid ? sendTo : ZERO_ADDRESS;

  const { data: sendToHasResidency } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasClaim",
    args: [sendTarget, RESIDENCY_ID],
  });

  const { data: sendToHasAccredited } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasClaim",
    args: [sendTarget, ACCREDITED],
  });

  const { data: sendToBalance } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "balanceOf",
    args: [sendTarget],
  });

  const { writeContractAsync: writeToken } = useScaffoldWriteContract({ contractName: "KuponToken" });

  const senderHasClaim =
    hasResidency === undefined || hasAccredited === undefined ? undefined : hasResidency || hasAccredited;

  // Primary Market Subscription Validation
  const parsedOrderAmount = useMemo(() => {
    try {
      if (!orderAmount.trim()) return undefined;
      return parseEther(orderAmount);
    } catch {
      return undefined;
    }
  }, [orderAmount]);

  const subscriptionValidation = useMemo(() => {
    if (!connectedAddress) {
      return { ok: false, text: "Connect your Web3 wallet to order SBN bonds." };
    }
    if (parsedOrderAmount === undefined || parsedOrderAmount <= 0n) {
      return { ok: false, text: "Enter a positive bond volume to subscribe." };
    }
    if (seriesCap !== undefined && totalSupply !== undefined) {
      if (parsedOrderAmount > seriesCap - totalSupply) {
        return {
          ok: false,
          text: `Order exceeds available national series quota (${Number(formatEther(seriesCap - totalSupply)).toLocaleString("en-US")} KPON remaining).`,
        };
      }
    }
    if (hasResidency === undefined || hasAccredited === undefined) {
      return { ok: false, text: "Checking investor compliance credentials..." };
    }
    if (!hasResidency && !hasAccredited) {
      return {
        ok: false,
        text: "Identity Certification Required: Your wallet has no active KSEI SID identity claim. Visit the Registrar Desk to verify your Indonesian citizenship before subscribing.",
      };
    }
    const isRetail = hasResidency && !hasAccredited;
    if (isRetail && balance !== undefined) {
      if (parsedOrderAmount > CAP || balance > CAP - parsedOrderAmount) {
        return {
          ok: false,
          text: `Retail Cap Exceeded: Retail investors hold at most 5,000 KPON (Rp5 Billion). Your balance is ${formatEther(balance)} KPON.`,
        };
      }
    }
    return {
      ok: true,
      text: "Compliance Approved: You are verified and eligible to receive this sovereign bond allocation.",
    };
  }, [connectedAddress, parsedOrderAmount, seriesCap, totalSupply, hasResidency, hasAccredited, balance]);

  // Primary Market Financial Projection
  const subscriptionForecast = useMemo(() => {
    const rawUnits = Number(orderAmount.trim());
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
  }, [orderAmount, selectedBond]);

  // Handle Primary Market Order
  const handleSubscribeSBN = async () => {
    if (!connectedAddress || !parsedOrderAmount || !subscriptionValidation.ok) {
      notification.error(subscriptionValidation.text);
      return;
    }

    setIsOrdering(true);
    try {
      // In KuponToken, issuing is gated by ISSUER_ROLE
      await writeToken({
        functionName: "issue",
        args: [connectedAddress, parsedOrderAmount],
      });
      notification.success(`Successfully subscribed to ${orderAmount} KPON (${selectedBond.code})!`);
      await Promise.all([refetchBalance(), refetchSupply()]);
    } catch (e) {
      notification.error(translateRevert(e), { duration: 9000 });
    } finally {
      setIsOrdering(false);
    }
  };

  // Secondary Market Validation
  let parsedSendAmount: bigint | undefined;
  try {
    parsedSendAmount = sendAmount.trim() === "" ? undefined : parseEther(sendAmount);
  } catch {
    parsedSendAmount = undefined;
  }

  const sendVerdict = sendToIsValid
    ? evaluateSend({
        senderHasClaim,
        recipientHasResidency: sendToHasResidency,
        recipientHasAccredited: sendToHasAccredited,
        recipientBalance: sendToBalance,
        amount: parsedSendAmount,
        cap: CAP,
      })
    : null;

  const handleSend = async () => {
    if (!sendTo || !sendAmount) {
      notification.error("Please enter recipient address and amount.");
      return;
    }
    if (sendVerdict && !sendVerdict.ok) {
      notification.error(sendVerdict.text, { duration: 8000 });
      return;
    }
    let validAmount: bigint;
    try {
      validAmount = parseEther(sendAmount);
    } catch {
      notification.error("Invalid amount — use decimal KPON, e.g. 10 or 0.5.");
      return;
    }
    setIsSending(true);
    try {
      await writeToken({
        functionName: "transfer",
        args: [sendTo, validAmount],
      });
      notification.success(`Successfully sent ${sendAmount} KPON to ${sendTo.slice(0, 6)}…${sendTo.slice(-4)}`);
      setSendAmount("");
      await refetchBalance();
    } catch (e) {
      notification.error(translateRevert(e), { duration: 8000 });
    } finally {
      setIsSending(false);
    }
  };

  // Portfolio calculations
  const balanceNum = balance !== undefined ? Number(formatEther(balance)) : 0;
  const balanceIDR = balanceNum * 1_000_000;
  const benchmarkRate = 0.064; // 6.40% p.a. benchmark
  const annualIncomeIDR = balanceIDR * benchmarkRate;
  const monthlyIncomeIDR = annualIncomeIDR / 12;
  const capProgressPercent = Math.min(100, (balanceNum / 5000) * 100);

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EC] text-[#14201C] selection:bg-kupon-gold/30">
      {/* Delicate Guilloche Watermark */}
      <div className="absolute right-6 top-20 pointer-events-none opacity-[0.03] overflow-hidden">
        <GuillochePattern variant="seal" width={680} height={680} color="emerald" />
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-10 pb-24 relative z-10 flex flex-col gap-8">
        {/* ===================================================================== */}
        {/* 1. EDITORIAL HEADER & COMPLIANCE STATUS */}
        {/* ===================================================================== */}
        <header className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-serif font-bold text-kupon-ink tracking-tight m-0">
                Investor Portal
              </h1>
              <p className="text-base text-kupon-ink/75 font-sans max-w-2xl leading-relaxed m-0">
                Select and subscribe to sovereign retail bonds (SBN Ritel 2026/2027), earn guaranteed monthly yield, and
                trade 24/7 onchain.
              </p>
            </div>

            {/* Live Compliance Identity Pill */}
            {connectedAddress && (
              <div className="inline-flex items-center gap-3 bg-[#F4EEDC] px-4 py-2.5 rounded-full text-xs font-sans self-start lg:self-auto border border-kupon-gold/30">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    hasAccredited ? "bg-kupon-gold" : hasResidency ? "bg-kupon-emerald animate-pulse" : "bg-error"
                  }`}
                />
                <span className="font-semibold text-kupon-ink">
                  {hasAccredited
                    ? "Accredited Investor"
                    : hasResidency
                      ? "Indonesian Citizen (WNI)"
                      : "Unregistered (Frozen)"}
                </span>
                <span className="text-kupon-ink/40">|</span>
                <span className="font-mono text-kupon-ink/70">
                  {connectedAddress.slice(0, 6)}…{connectedAddress.slice(-4)}
                </span>
              </div>
            )}
          </div>

          {/* Portfolio Wealth & Yield Strip (Single Clean Border) */}
          {connectedAddress && (
            <div className="bg-[#F8F3E5] p-6 rounded-xl border border-kupon-gold/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Holdings */}
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-wider text-kupon-ink/60">
                  Your KPON Portfolio
                </span>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-kupon-ink">
                  {balance !== undefined ? Number(formatEther(balance)).toLocaleString("en-US") : "0"}{" "}
                  <span className="text-sm font-sans font-normal text-kupon-ink/60">KPON</span>
                </div>
                <span className="text-xs text-kupon-ink/65 font-sans">
                  ≈ Rp{balanceIDR.toLocaleString("id-ID")} Par Value
                </span>
              </div>

              {/* Monthly Yield Cashflow */}
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-wider text-kupon-ink/60">
                  Estimated Monthly Coupon
                </span>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-kupon-emerald">
                  Rp{Math.round(monthlyIncomeIDR).toLocaleString("id-ID")}
                </div>
                <span className="text-xs text-kupon-ink/65 font-sans">Auto-credited / month (6.40% p.a.)</span>
              </div>

              {/* Benchmark Fixed Yield */}
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-wider text-kupon-ink/60">
                  Sovereign Coupon Rate
                </span>
                <div className="text-2xl sm:text-3xl font-serif font-bold text-kupon-gold">
                  6.40% <span className="text-sm font-sans font-normal text-kupon-ink/60">p.a.</span>
                </div>
                <span className="text-xs text-kupon-ink/65 font-sans">Zero default risk · UU APBN Guaranteed</span>
              </div>

              {/* Holding Cap Headroom */}
              <div className="space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="text-kupon-ink/60 font-mono">Retail Quota Headroom:</span>
                  <span className="font-semibold text-kupon-ink">
                    {hasAccredited ? "Cap-Exempt" : `${balanceNum.toLocaleString("en-US")} / 5,000`}
                  </span>
                </div>
                <div className="w-full bg-[#E5DEC7] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      capProgressPercent >= 95 ? "bg-error" : "bg-kupon-emerald"
                    }`}
                    style={{ width: `${hasAccredited ? 0 : capProgressPercent}%` }}
                  />
                </div>
                <span className="text-[11px] text-kupon-ink/60 font-sans">
                  {hasAccredited
                    ? "Institutional account exempt from statutory cap"
                    : `Remaining: ${(5000 - balanceNum).toLocaleString("en-US")} KPON allowed`}
                </span>
              </div>
            </div>
          )}
        </header>

        {/* ===================================================================== */}
        {/* 2. MAIN 2-COLUMN ASYMMETRIC WORKBENCH (5 : 7 RATIO) */}
        {/* ===================================================================== */}
        {connectedAddress ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ----------------------------------------------------------------- */}
            {/* LEFT COLUMN: CUSTODY & RECEIVE DESK (5 COLS, SINGLE BORDER) */}
            {/* ----------------------------------------------------------------- */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="space-y-1">
                <h2 className="text-xl font-serif font-bold text-kupon-ink m-0">Investor Custody Desk</h2>
                <p className="text-xs text-kupon-ink/70 font-sans m-0">
                  Manage self-custody sovereign bonds and receive automated coupon cashflows.
                </p>
              </div>

              {/* Receive Card (Single Border) */}
              <div className="bg-[#F8F3E5] p-6 rounded-xl border border-kupon-gold/30 flex flex-col gap-5">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-kupon-ink/50">
                    Your Registered Wallet
                  </span>
                  <div className="pt-0.5">
                    <Address address={connectedAddress} format="long" size="sm" />
                  </div>
                </div>

                {/* Sovereign Guarantees Matrix */}
                <div className="flex flex-col gap-3 pt-3 border-t border-kupon-gold/20 text-xs font-sans">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheckIcon className="w-4 h-4 text-kupon-emerald shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-kupon-ink">Zero Default Risk (UU APBN)</strong>
                      <p className="m-0 text-[11px] text-kupon-ink/70 mt-0.5">
                        Principal and coupons are backed 100% by the Indonesian National State Budget.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CalendarDaysIcon className="w-4 h-4 text-kupon-gold shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-kupon-ink">Automated Monthly Coupons</strong>
                      <p className="m-0 text-[11px] text-kupon-ink/70 mt-0.5">
                        Monthly coupons flow directly to your registered wallet on payout dates.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <BanknotesIcon className="w-4 h-4 text-kupon-emerald shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-kupon-ink">Self-Custody Ownership</strong>
                      <p className="m-0 text-[11px] text-kupon-ink/70 mt-0.5">
                        Bonds are held directly in your Web3 wallet, eliminating intermediary custodian fees.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Identity Alert */}
                {!hasResidency && !hasAccredited && (
                  <div className="bg-[#FDF2F1] p-3.5 rounded-lg border border-error/30 text-xs font-sans text-error leading-relaxed">
                    <strong>Identity Verification Needed:</strong> Your wallet holds no KSEI SID claim. You must be
                    certified in the Registrar Desk before purchasing or receiving SBN bonds.
                  </div>
                )}

                {/* Navigation Link to Registrar */}
                <div className="pt-2 border-t border-kupon-gold/20 flex items-center justify-between text-xs font-sans">
                  <Link
                    href="/registrar"
                    className="text-kupon-emerald hover:underline font-medium flex items-center gap-1"
                  >
                    <span>Verify Identity at Registrar Desk</span>
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </Link>
                  <Link href="/framework" className="text-kupon-gold hover:underline font-medium">
                    Legal Framework →
                  </Link>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* RIGHT COLUMN: MARKET WORKBENCH (PRIMARY BUY OR SECONDARY TRANSFER) */}
            {/* ----------------------------------------------------------------- */}
            <div className="lg:col-span-7 flex flex-col gap-6 bg-[#F8F3E5] p-6 sm:p-8 rounded-xl border border-kupon-gold/30">
              {/* Market Mode Switcher (Clean Single Border / Pills) */}
              <div className="flex items-center justify-between border-b border-kupon-gold/20 pb-4">
                <div className="flex items-center gap-2 p-1 bg-[#EAE2C8]/70 rounded-xl text-xs font-sans">
                  <button
                    type="button"
                    onClick={() => setActiveMarketMode("primary")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                      activeMarketMode === "primary"
                        ? "bg-[#FAF6EC] text-kupon-ink shadow-sm"
                        : "text-kupon-ink/70 hover:text-kupon-ink"
                    }`}
                  >
                    1. Primary Market (Subscribe SBN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMarketMode("secondary")}
                    className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                      activeMarketMode === "secondary"
                        ? "bg-[#FAF6EC] text-kupon-ink shadow-sm"
                        : "text-kupon-ink/70 hover:text-kupon-ink"
                    }`}
                  >
                    2. Secondary Market (Transfer P2P)
                  </button>
                </div>

                <span className="text-[11px] font-mono text-kupon-emerald bg-kupon-emerald/10 px-2 py-0.5 rounded hidden sm:inline">
                  {activeMarketMode === "primary" ? "Direct Issuance" : "24/7 P2P Trading"}
                </span>
              </div>

              {/* =============================================================== */}
              {/* 1. PRIMARY MARKET: SELECT & BUY SOVEREIGN BONDS */}
              {/* =============================================================== */}
              {activeMarketMode === "primary" && (
                <div className="flex flex-col gap-6">
                  <div className="space-y-1">
                    <h3 className="text-xl font-serif font-bold text-kupon-ink m-0">
                      Select Sovereign Bond (SBN Ritel)
                    </h3>
                    <p className="text-xs text-kupon-ink/75 font-sans m-0 leading-relaxed">
                      Choose an active government debt series, calculate your guaranteed monthly payout, and order an
                      on-chain tranche allocation.
                    </p>
                  </div>

                  {/* SBN Series Selector */}
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

                  {/* Volume Input & Presets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="font-medium text-kupon-ink">Subscription Volume (KPON)</span>
                      <span className="text-kupon-ink/60 font-mono">1 KPON = 1 Bond (Rp1,000,000)</span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={orderAmount}
                        onChange={e => setOrderAmount(e.target.value)}
                        placeholder="e.g. 50"
                        className="input w-full font-mono text-lg bg-[#FAF6EC] border border-kupon-gold/30 text-kupon-ink focus:outline-none pr-16 rounded-lg"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-kupon-ink/50 pointer-events-none">
                        KPON
                      </span>
                    </div>

                    {/* Quick Amount Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-sans">
                      <span className="text-kupon-ink/50 text-[11px]">Quick amounts:</span>
                      {[
                        { label: "10 (Rp10M)", val: "10" },
                        { label: "50 (Rp50M)", val: "50" },
                        { label: "100 (Rp100M)", val: "100" },
                        { label: "500 (Rp500M)", val: "500" },
                      ].map(chip => (
                        <button
                          key={chip.label}
                          type="button"
                          onClick={() => setOrderAmount(chip.val)}
                          className="px-2.5 py-1 rounded bg-[#FAF6EC] hover:bg-[#FAF6EC]/80 border border-kupon-gold/20 text-kupon-ink text-xs cursor-pointer transition-colors font-mono"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Financial Maturity & Profit Forecast Card */}
                  {subscriptionForecast && (
                    <div className="bg-[#FAF6EC] p-4 sm:p-5 rounded-xl border border-kupon-gold/30 flex flex-col gap-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-kupon-gold/20 gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-kupon-emerald">
                            <SparklesIcon className="w-4 h-4 text-kupon-gold" />
                            <span>{selectedBond.code} · Yield & Cashflow Projection</span>
                          </div>
                          <div className="text-xs text-kupon-ink/70 font-sans mt-0.5">
                            {selectedBond.couponType} · Payout: {selectedBond.payoutSchedule}
                          </div>
                        </div>

                        <div className="text-xs font-sans text-right sm:self-auto">
                          <span className="text-kupon-ink/60">Maturity Date: </span>
                          <strong className="text-kupon-ink font-mono">{selectedBond.maturityDate}</strong>
                        </div>
                      </div>

                      {/* Financial Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-kupon-ink/60 font-sans text-[11px]">Investment Capital</span>
                          <div className="font-serif font-bold text-sm text-kupon-ink">
                            Rp{subscriptionForecast.principalIDR.toLocaleString("id-ID")}
                          </div>
                          <span className="text-[10px] font-mono text-kupon-ink/50">{orderAmount} KPON</span>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-kupon-ink/60 font-sans text-[11px]">Coupon Yield</span>
                          <div className="font-serif font-bold text-sm text-kupon-emerald">
                            {selectedBond.couponRate}% p.a.
                          </div>
                          <span className="text-[10px] font-sans text-kupon-ink/50">Gross annual return</span>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-kupon-ink/60 font-sans text-[11px]">Monthly Payout</span>
                          <div className="font-serif font-bold text-sm text-kupon-ink">
                            Rp{Math.round(subscriptionForecast.monthlyCouponIDR).toLocaleString("id-ID")}
                          </div>
                          <span className="text-[10px] font-sans text-kupon-ink/50">Cashflow / month</span>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-kupon-ink/60 font-sans text-[11px]">
                            Cumulative Profit ({selectedBond.tenorYears}Y)
                          </span>
                          <div className="font-serif font-bold text-sm text-kupon-gold">
                            +Rp{subscriptionForecast.totalCouponProfitIDR.toLocaleString("id-ID")}
                          </div>
                          <span className="text-[10px] font-mono text-kupon-gold/80 font-semibold">
                            +{subscriptionForecast.totalProfitPercentage}% Total Return
                          </span>
                        </div>
                      </div>

                      {/* Total Payout Banner */}
                      <div className="bg-[#F8F3E5] p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-xs font-sans border border-kupon-gold/20 gap-2">
                        <div className="flex items-center gap-2">
                          <CalendarDaysIcon className="w-4 h-4 text-kupon-emerald shrink-0" />
                          <span className="text-kupon-ink/80">
                            Total Liquidity Received at Maturity (Principal + Profit):
                          </span>
                        </div>
                        <div className="font-mono font-bold text-sm text-kupon-emerald">
                          Rp{subscriptionForecast.totalMaturityPayoutIDR.toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Eligibility Feedback */}
                  <div
                    className={`p-4 rounded-lg border text-xs font-sans leading-relaxed flex items-start gap-3 transition-colors ${
                      subscriptionValidation.ok
                        ? "bg-[#EEF7F2] border-kupon-emerald/30 text-kupon-emerald"
                        : "bg-[#FDF2F1] border-error/30 text-error"
                    }`}
                  >
                    {subscriptionValidation.ok ? (
                      <CheckCircleIcon className="w-5 h-5 text-kupon-emerald shrink-0 mt-0.5" />
                    ) : (
                      <ExclamationCircleIcon className="w-5 h-5 text-error shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold mb-0.5">
                        {subscriptionValidation.ok
                          ? "Eligibility Status: Approved"
                          : "Eligibility Verification Required"}
                      </div>
                      <p className="m-0 text-kupon-ink/80">{subscriptionValidation.text}</p>
                    </div>
                  </div>

                  {/* Subscribe Action Button */}
                  <button
                    type="button"
                    onClick={handleSubscribeSBN}
                    disabled={isOrdering || !subscriptionValidation.ok}
                    className="btn btn-primary font-sans font-medium text-kupon-ivory flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {isOrdering ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <KeyIcon className="w-4 h-4" />
                    )}
                    <span>
                      Subscribe to {orderAmount ? `${orderAmount} KPON` : "SBN"} ({selectedBond.code})
                    </span>
                  </button>
                </div>
              )}

              {/* =============================================================== */}
              {/* 2. SECONDARY MARKET: 24/7 P2P COMPLIANT TRANSFERS */}
              {/* =============================================================== */}
              {activeMarketMode === "secondary" && (
                <div className="flex flex-col gap-6">
                  <div className="space-y-1">
                    <h3 className="text-xl font-serif font-bold text-kupon-ink m-0">24/7 Secondary Market Transfer</h3>
                    <p className="text-xs text-kupon-ink/75 font-sans m-0 leading-relaxed">
                      Transfer bonds directly to any verified Indonesian citizen or institutional account with atomic
                      on-chain settlement.
                    </p>
                  </div>

                  {/* Recipient Address */}
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-medium text-kupon-ink flex items-center justify-between">
                      <span>Recipient Address (Target)</span>
                      <span className="text-[11px] text-kupon-ink/50">Must hold RESIDENCY_ID or ACCREDITED</span>
                    </label>
                    <AddressInput value={sendTo} onChange={setSendTo} placeholder="Recipient address (0x...)" />

                    {/* Quick Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-sans">
                      <span className="text-kupon-ink/50 text-[11px]">Quick presets:</span>
                      {DEMO_PRESETS.map(preset => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setSendTo(preset.address)}
                          className="px-2 py-0.5 rounded bg-[#FAF6EC] hover:bg-[#F4EEDC] text-kupon-ink/80 text-[11px] cursor-pointer transition-colors border border-kupon-gold/20"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="font-medium text-kupon-ink">Transfer Volume (KPON)</span>
                      <span className="text-kupon-ink/60 font-mono">
                        Available: {balance !== undefined ? formatEther(balance) : "0"} KPON
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={sendAmount}
                        onChange={e => setSendAmount(e.target.value)}
                        placeholder="e.g. 25"
                        className="input w-full font-mono text-lg bg-[#FAF6EC] border border-kupon-gold/30 text-kupon-ink focus:outline-none pr-16 rounded-lg"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-kupon-ink/50 pointer-events-none">
                        KPON
                      </span>
                    </div>

                    {/* Quick Amount Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-sans">
                      <span className="text-kupon-ink/50 text-[11px]">Quick amounts:</span>
                      {[
                        { label: "10 (Rp10M)", val: "10" },
                        { label: "50 (Rp50M)", val: "50" },
                        { label: "100 (Rp100M)", val: "100" },
                        {
                          label: "Max Balance",
                          val: balance !== undefined ? formatEther(balance) : "0",
                        },
                      ].map(chip => (
                        <button
                          key={chip.label}
                          type="button"
                          onClick={() => setSendAmount(chip.val)}
                          className="px-2.5 py-1 rounded bg-[#FAF6EC] hover:bg-[#FAF6EC]/80 border border-kupon-gold/20 text-kupon-ink text-xs cursor-pointer transition-colors font-mono"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Pre-Flight Compliance Verdict */}
                  {sendVerdict && (
                    <div
                      className={`p-4 rounded-lg border text-xs font-sans leading-relaxed flex items-start gap-3 transition-colors ${
                        sendVerdict.ok
                          ? "bg-[#EEF7F2] border-kupon-emerald/30 text-kupon-emerald"
                          : "bg-[#FDF2F1] border-error/30 text-error"
                      }`}
                    >
                      {sendVerdict.ok ? (
                        <CheckCircleIcon className="w-5 h-5 text-kupon-emerald shrink-0 mt-0.5" />
                      ) : (
                        <ExclamationCircleIcon className="w-5 h-5 text-error shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold mb-0.5">
                          {sendVerdict.ok ? "Pre-Flight Gate: Pass" : "Pre-Flight Gate: Blocked by Rule"}
                        </div>
                        <p className="m-0 text-kupon-ink/80">{sendVerdict.text}</p>
                      </div>
                    </div>
                  )}

                  {/* Primary Transfer Action */}
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isSending || (sendVerdict !== null && !sendVerdict.ok)}
                    className="btn btn-primary font-sans font-medium text-kupon-ivory flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {isSending ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <PaperAirplaneIcon className="w-4 h-4" />
                    )}
                    <span>Execute Secondary Transfer {sendAmount ? `(${sendAmount} KPON)` : ""}</span>
                  </button>

                  <p className="text-[11px] text-kupon-ink/60 font-sans m-0 leading-relaxed">
                    Transfers settle onchain with sub-second finality. If the recipient violates residency rules or
                    exceeds the retail cap, the smart contract reverts the transaction deterministically without loss of
                    funds.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ===================================================================== */
          /* 3. DISCONNECTED STATE (INVITATION TO CONNECT WALLET) */
          /* ===================================================================== */
          <div className="bg-[#F8F3E5] p-12 rounded-2xl border border-kupon-gold/30 text-center max-w-2xl mx-auto flex flex-col items-center gap-4 shadow-sm my-8">
            <div className="w-12 h-12 rounded-full bg-[#FAF6EC] border border-kupon-gold/40 flex items-center justify-center text-kupon-emerald">
              <LockClosedIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-serif font-bold text-kupon-ink m-0">Connect Wallet to Access Holdings</h2>
              <p className="text-sm text-kupon-ink/75 font-sans m-0 max-w-md mx-auto leading-relaxed">
                Connect your Web3 wallet to inspect your verified investor credentials, view live SBN Ritel bond
                balances, and trade in the secondary market.
              </p>
            </div>

            <div className="pt-2">
              <Link href="/framework" className="btn btn-outline border-kupon-gold text-kupon-ink font-sans btn-sm">
                Explore Legal & Technical Framework →
              </Link>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 4. CLEAN FOOTER LINKS (SINGLE BORDER DIVIDER) */}
        {/* ===================================================================== */}
        <footer className="flex flex-wrap items-center justify-between pt-8 text-xs text-kupon-ink/70 font-sans gap-4 border-t border-kupon-gold/30">
          <div className="flex items-center gap-4">
            <Link href="/registrar" className="text-kupon-emerald hover:underline font-medium">
              Registrar Portal (Claims & Certification Desk) →
            </Link>
            <span>·</span>
            <Link href="/regulator" className="text-kupon-gold hover:underline font-medium">
              Regulator Terminal (OJK Telemetry) →
            </Link>
          </div>
          <div className="font-mono text-[11px] text-kupon-ink/50">
            Kupon Token: <code className="text-kupon-emerald">KuponToken.sol</code> · Transfer Hook:{" "}
            <code className="text-kupon-gold">KuponComplianceModule.sol</code>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default InvestorPage;
