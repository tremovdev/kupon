"use client";

import { useState } from "react";
import Link from "next/link";
import { Address, AddressInput } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther, isAddress, keccak256, parseEther, toHex } from "viem";
import { useAccount } from "wagmi";
import {
  BanknotesIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  LockClosedIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { GuillochePattern } from "~~/components/GuillochePattern";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const RESIDENCY_ID = keccak256(toHex("RESIDENCY_ID"));
const ACCREDITED = keccak256(toHex("ACCREDITED"));
const CAP = 5_000n * 10n ** 18n; // 5,000 KPON retail cap (Rp5 Billion)

// Preset accounts for frictionless testing & demo
const DEMO_PRESETS = [
  { label: "Alice (Retail Demo)", address: "0x1111111111111111111111111111111111111111" },
  { label: "Bob (Institutional Demo)", address: "0x2222222222222222222222222222222222222222" },
] as const;

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
  const ruleId = extractRuleViolatedId(rawError);
  if (ruleId === RULE_IDS.r1)
    return "Blocked by Rule R1-RESIDENCY: The recipient wallet holds no verified residency credential. Grant citizenship in Registrar Portal before transferring.";
  if (ruleId === RULE_IDS.r2)
    return "Blocked by Rule R2-CAP: Retail wallets cannot hold more than 5,000 KPON (Rp5 Billion). Recipient cap would be breached.";
  if (ruleId === RULE_IDS.r3)
    return "Blocked by Rule R3-FROZEN: Your wallet holds zero active credentials. Its balance is frozen for transfers until re-certified.";

  const raw = getParsedError(rawError);
  if (/execution reverted/i.test(raw))
    return "Transfer reverted by onchain compliance hook. Check recipient credentials and statutory limits.";
  return raw;
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
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [isSending, setIsSending] = useState(false);

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

  const { writeContractAsync: transferKpon } = useScaffoldWriteContract({ contractName: "KuponToken" });

  const senderHasClaim =
    hasResidency === undefined || hasAccredited === undefined ? undefined : hasResidency || hasAccredited;

  let parsedAmount: bigint | undefined;
  try {
    parsedAmount = sendAmount.trim() === "" ? undefined : parseEther(sendAmount);
  } catch {
    parsedAmount = undefined;
  }

  const verdict = sendToIsValid
    ? evaluateSend({
        senderHasClaim,
        recipientHasResidency: sendToHasResidency,
        recipientHasAccredited: sendToHasAccredited,
        recipientBalance: sendToBalance,
        amount: parsedAmount,
        cap: CAP,
      })
    : null;

  const handleSend = async () => {
    if (!sendTo || !sendAmount) {
      notification.error("Please enter recipient address and amount.");
      return;
    }
    if (verdict && !verdict.ok) {
      notification.error(verdict.text, { duration: 8000 });
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
      await transferKpon({
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
                Hold, earn sovereign fixed yield, and execute 24/7 compliant secondary market transfers under Indonesian
                retail debt rules.
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
                <span className="text-xs font-mono uppercase tracking-wider text-kupon-ink/60">Your KPON Holdings</span>
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
                <span className="text-xs text-kupon-ink/65 font-sans">Gross cashflow / month (6.40% p.a.)</span>
              </div>

              {/* Benchmark Fixed Yield */}
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-wider text-kupon-ink/60">
                  Sovereign Coupon Yield
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
                <h2 className="text-xl font-serif font-bold text-kupon-ink m-0">Custody & Deposit Desk</h2>
                <p className="text-xs text-kupon-ink/70 font-sans m-0">
                  Receive sovereign bonds and manage your on-chain government debt portfolio.
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
                        Principal and coupons are legally backed by the Indonesian National State Budget.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CalendarDaysIcon className="w-4 h-4 text-kupon-gold shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-kupon-ink">Automated Monthly Coupons</strong>
                      <p className="m-0 text-[11px] text-kupon-ink/70 mt-0.5">
                        Yield payouts are credited automatically on the payout date without manual redemption.
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
                    <strong>Account Unverified:</strong> Your wallet currently holds no identity claim. You cannot
                    receive or transfer KPON until certified by the Registrar.
                  </div>
                )}

                {/* Useful Links */}
                <div className="pt-2 border-t border-kupon-gold/20 flex items-center justify-between text-xs font-sans">
                  <Link href="/framework" className="text-kupon-emerald hover:underline font-medium">
                    Read Legal Framework (UU P2SK) →
                  </Link>
                  <Link href="/registrar" className="text-kupon-gold hover:underline font-medium">
                    Registrar Desk →
                  </Link>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* RIGHT COLUMN: 24/7 SECONDARY MARKET TRANSFER DESK (7 COLS) */}
            {/* ----------------------------------------------------------------- */}
            <div className="lg:col-span-7 flex flex-col gap-6 bg-[#F8F3E5] p-6 sm:p-8 rounded-xl border border-kupon-gold/30">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-serif font-bold text-kupon-ink m-0">24/7 Secondary Market Transfer</h3>
                  <span className="text-[11px] font-mono text-kupon-emerald bg-kupon-emerald/10 px-2 py-0.5 rounded border border-kupon-emerald/20">
                    Instant DvP Settlement
                  </span>
                </div>
                <p className="text-xs text-kupon-ink/75 font-sans m-0 leading-relaxed">
                  Transfer bonds directly to any verified Indonesian citizen or institutional account. Compliance rules
                  are enforced autonomously at the smart contract level.
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
              {verdict && (
                <div
                  className={`p-4 rounded-lg border text-xs font-sans leading-relaxed flex items-start gap-3 transition-colors ${
                    verdict.ok
                      ? "bg-[#EEF7F2] border-kupon-emerald/30 text-kupon-emerald"
                      : "bg-[#FDF2F1] border-error/30 text-error"
                  }`}
                >
                  {verdict.ok ? (
                    <CheckCircleIcon className="w-5 h-5 text-kupon-emerald shrink-0 mt-0.5" />
                  ) : (
                    <ExclamationCircleIcon className="w-5 h-5 text-error shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold mb-0.5">
                      {verdict.ok ? "Pre-Flight Gate: Pass" : "Pre-Flight Gate: Blocked by Rule"}
                    </div>
                    <p className="m-0 text-kupon-ink/80">{verdict.text}</p>
                  </div>
                </div>
              )}

              {/* Primary Transfer Action */}
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || (verdict !== null && !verdict.ok)}
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
                Transfers settle onchain with sub-second finality. If the recipient violates residency rules or exceeds
                the retail cap, the smart contract reverts the transaction deterministically without loss of funds.
              </p>
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
              Registrar Portal (Claims & Issuance) →
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
