"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Address, AddressInput } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther, isAddress, keccak256, parseEther, toHex } from "viem";
import { useAccount } from "wagmi";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  KeyIcon,
  MinusCircleIcon,
  UserPlusIcon,
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

// Preset accounts for testing & review
const DEMO_PRESETS = [
  { label: "Alice (Retail Demo)", address: "0x1111111111111111111111111111111111111111" },
  { label: "Bob (Institutional Demo)", address: "0x2222222222222222222222222222222222222222" },
] as const;

type ClaimType = "RESIDENCY_ID" | "ACCREDITED";
type ActiveTab = "verify" | "issue";

function translateRegistrarError(rawError: unknown): string {
  const parsed = getParsedError(rawError);
  if (/AccessControlUnauthorizedAccount/i.test(parsed) || /unauthorized/i.test(parsed) || /0x4e487b71/i.test(parsed)) {
    return "Access Denied: Connected wallet lacks REGISTRAR_ROLE or ISSUER_ROLE authorization.";
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
  const [activeTab, setActiveTab] = useState<ActiveTab>("verify");

  // Tab 1 state: Verification
  const [selectedClaim, setSelectedClaim] = useState<ClaimType>("RESIDENCY_ID");
  const [isProcessingClaim, setIsProcessingClaim] = useState(false);

  // Tab 2 state: Issuance
  const [issueAmount, setIssueAmount] = useState<string>("");
  const [isIssuingTokens, setIsIssuingTokens] = useState(false);

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
  const isCurrentActionAuthorized = activeTab === "verify" ? hasRegistrarAuthority : hasIssuerAuthority;

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
        text: "Blocked by R1-RESIDENCY: Investor holds no active identity credential. Grant citizenship in the Verify tab before issuing bonds.",
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
      notification.success(`Successfully issued ${issueAmount} KPON to investor wallet.`);
      setIssueAmount("");
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

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-10 pb-24 relative z-10 flex flex-col gap-10">
        {/* ===================================================================== */}
        {/* 1. EDITORIAL HEADER & METRICS (EXPANSIVE, CLEAN, NO BORDER OVERKILL) */}
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
            <div className="inline-flex items-center gap-3 bg-[#F4EEDC] px-4 py-2.5 rounded-full text-xs font-sans self-start lg:self-auto">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isCurrentActionAuthorized ? "bg-kupon-emerald animate-pulse" : "bg-kupon-gold"
                }`}
              />
              <span className="font-semibold text-kupon-ink">
                {isCurrentActionAuthorized ? "Authorized Session" : "Observer Mode"}
              </span>
              <span className="text-kupon-ink/40">|</span>
              <span className="font-mono text-kupon-ink/70">
                {connectedAddress ? `${connectedAddress.slice(0, 6)}…${connectedAddress.slice(-4)}` : "Disconnected"}
              </span>
            </div>
          </div>

          {/* Series Quota Strip: Tonal Surface instead of heavy borders */}
          <div className="bg-[#F4EEDC]/60 px-6 py-4 rounded-xl flex flex-col gap-2.5">
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

          {/* Polite notice for guest/observer accounts */}
          {connectedAddress && !hasRegistrarAuthority && (
            <div className="bg-[#FAF1DF] px-4 py-3 rounded-lg text-xs text-kupon-ink/85 flex items-center gap-2.5">
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
        {/* 2. 2-COLUMN ASYMMETRIC WORKBENCH (5 : 7 RATIO, BROAD & CALM) */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ----------------------------------------------------------------- */}
          {/* LEFT COLUMN: INVESTOR SELECTION & IDENTITY DOSSIER (5 COLS) */}
          {/* ----------------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="space-y-1">
              <h2 className="text-xl font-serif font-bold text-kupon-ink m-0">Select Investor Account</h2>
              <p className="text-xs text-kupon-ink/70 font-sans m-0">
                Inspect compliance credentials and live token holdings for any participant.
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
                <span className="text-kupon-ink/50 text-[11px]">Presets:</span>
                {connectedAddress && (
                  <button
                    type="button"
                    onClick={() => setInvestorAddress(connectedAddress)}
                    className="px-2 py-0.5 rounded bg-[#F4EEDC] hover:bg-[#EAE2C8] text-kupon-emerald font-mono text-[11px] cursor-pointer transition-colors"
                  >
                    My Wallet
                  </button>
                )}
                {DEMO_PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setInvestorAddress(preset.address)}
                    className="px-2 py-0.5 rounded bg-[#F4EEDC] hover:bg-[#EAE2C8] text-kupon-ink/80 text-[11px] cursor-pointer transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Investor Identity Dossier (Clean Tonal Surface, No Nested Box Clutter) */}
            {isAddressValid ? (
              <div className="bg-[#F8F3E5] p-6 rounded-2xl flex flex-col gap-5">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-kupon-ink/50">
                    Selected Account
                  </span>
                  <div className="pt-0.5">
                    <Address address={investorAddress} format="long" size="sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#E5DEC7]">
                  {/* Verification Tier */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-kupon-ink/50">Credential Tier</span>
                    <div className="font-sans font-semibold text-xs text-kupon-ink flex items-center gap-1.5">
                      {hasAccredited ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-kupon-gold" />
                          <span>Accredited / Institutional</span>
                        </>
                      ) : hasResidency ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-kupon-emerald" />
                          <span>Indonesian Citizen (WNI)</span>
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
                    <span className="text-[11px] font-mono text-kupon-ink/50">Current Holdings</span>
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

                {/* Practical Advice Note */}
                <div className="text-xs font-sans leading-relaxed text-kupon-ink/75 bg-[#FAF6EC] p-3.5 rounded-lg">
                  {!hasResidency && !hasAccredited ? (
                    <span className="text-kupon-ink/80">
                      This account holds no active identity credential. Use the action desk on the right to grant KYC
                      verification before issuing bond tokens.
                    </span>
                  ) : hasResidency && !hasAccredited ? (
                    <span className="text-kupon-ink/80">
                      Certified as <strong>Retail Indonesian Citizen</strong>. Transfers and issuances are capped at
                      5,000 KPON (Rp5 Billion) under statutory rules.
                    </span>
                  ) : (
                    <span className="text-kupon-ink/80">
                      Certified as <strong>Institutional / Accredited</strong>. Exempt from retail investor quota caps.
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-[#F8F3E5]/60 p-8 rounded-2xl text-center text-xs font-sans text-kupon-ink/60 space-y-1">
                <p className="m-0 font-medium text-kupon-ink/70">No account selected</p>
                <p className="m-0">Enter an address or click a preset above to inspect compliance status.</p>
              </div>
            )}
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* RIGHT COLUMN: ACTION WORKBENCH (7 COLS) */}
          {/* ----------------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col gap-6 bg-[#F8F3E5] p-6 sm:p-8 rounded-2xl">
            {/* Minimal Segmented Tab Switcher */}
            <div className="flex items-center gap-2 p-1 bg-[#EAE2C8]/70 rounded-xl self-start text-xs font-sans">
              <button
                type="button"
                onClick={() => setActiveTab("verify")}
                className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === "verify"
                    ? "bg-[#FAF6EC] text-kupon-ink shadow-sm"
                    : "text-kupon-ink/70 hover:text-kupon-ink"
                }`}
              >
                1. Verify Identity (KYC)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("issue")}
                className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                  activeTab === "issue"
                    ? "bg-[#FAF6EC] text-kupon-ink shadow-sm"
                    : "text-kupon-ink/70 hover:text-kupon-ink"
                }`}
              >
                2. Issue Bond Tokens (Mint)
              </button>
            </div>

            {/* =============================================================== */}
            {/* TAB 1: IDENTITY CERTIFICATION DESK */}
            {/* =============================================================== */}
            {activeTab === "verify" && (
              <div className="flex flex-col gap-6 pt-2">
                <div className="space-y-1">
                  <h3 className="text-xl font-serif font-bold text-kupon-ink m-0">Investor Identity Certification</h3>
                  <p className="text-xs text-kupon-ink/75 font-sans m-0 leading-relaxed">
                    Investors must hold an authenticated identity claim on the registry to satisfy transfer and issuance
                    compliance gates.
                  </p>
                </div>

                {/* Claim Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedClaim("RESIDENCY_ID")}
                    className={`p-4 rounded-xl text-left transition-all cursor-pointer ${
                      selectedClaim === "RESIDENCY_ID"
                        ? "bg-[#FAF6EC] ring-2 ring-kupon-emerald shadow-sm"
                        : "bg-[#FAF6EC]/60 hover:bg-[#FAF6EC]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-serif font-bold text-sm text-kupon-emerald">Indonesian Citizen (WNI)</span>
                      <span className="text-[10px] font-mono text-kupon-ink/40">RESIDENCY_ID</span>
                    </div>
                    <p className="text-xs text-kupon-ink/70 font-sans m-0 leading-relaxed">
                      Natural persons with verified national identity. Eligible for retail tranches subject to the 5,000
                      KPON cap.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedClaim("ACCREDITED")}
                    className={`p-4 rounded-xl text-left transition-all cursor-pointer ${
                      selectedClaim === "ACCREDITED"
                        ? "bg-[#FAF6EC] ring-2 ring-kupon-gold shadow-sm"
                        : "bg-[#FAF6EC]/60 hover:bg-[#FAF6EC]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-serif font-bold text-sm text-kupon-gold">Accredited / Institutional</span>
                      <span className="text-[10px] font-mono text-kupon-ink/40">ACCREDITED</span>
                    </div>
                    <p className="text-xs text-kupon-ink/70 font-sans m-0 leading-relaxed">
                      Financial institutions, funds, and qualified corporate entities. Exempt from retail quota caps.
                    </p>
                  </button>
                </div>

                {/* Status Indicator */}
                {isAddressValid && (
                  <div className="text-xs font-sans text-kupon-ink/80 bg-[#FAF6EC] px-4 py-3 rounded-lg flex items-center justify-between">
                    <span>
                      {selectedClaim === "RESIDENCY_ID" ? "Indonesian Residency" : "Accreditation"} status for this
                      account:
                    </span>
                    <span className="font-semibold text-kupon-ink">
                      {currentClaimActive ? "✓ Active Claim" : "✗ Not Granted"}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleGrantClaim}
                    disabled={isProcessingClaim || !isAddressValid || currentClaimActive}
                    className="btn btn-primary font-sans font-medium text-kupon-ivory flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {isProcessingClaim ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <UserPlusIcon className="w-4 h-4" />
                    )}
                    <span>Grant Claim ({selectedClaim === "RESIDENCY_ID" ? "WNI Citizen" : "Accredited"})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRevokeClaim}
                    disabled={isProcessingClaim || !isAddressValid || !currentClaimActive}
                    className="btn btn-outline border-error/50 text-error hover:bg-error/10 font-sans font-medium flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    {isProcessingClaim ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <MinusCircleIcon className="w-4 h-4" />
                    )}
                    <span>Revoke Claim (Freeze Transfers)</span>
                  </button>
                </div>

                <p className="text-[11px] text-kupon-ink/60 font-sans m-0 leading-relaxed">
                  Regulatory Notice: Revoking all credentials instantly freezes the investor&apos;s outgoing transfers
                  (Compliance Rule R3). Balances remain secure in custody but cannot be transferred until re-certified.
                </p>
              </div>
            )}

            {/* =============================================================== */}
            {/* TAB 2: TRANCHE ISSUANCE DESK */}
            {/* =============================================================== */}
            {activeTab === "issue" && (
              <div className="flex flex-col gap-6 pt-2">
                <div className="space-y-1">
                  <h3 className="text-xl font-serif font-bold text-kupon-ink m-0">Primary Tranche Issuance</h3>
                  <p className="text-xs text-kupon-ink/75 font-sans m-0 leading-relaxed">
                    Mint newly authorized debt tokens directly to the verified investor wallet within the series quota.
                  </p>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="font-medium text-kupon-ink">Tranche Volume (KPON)</span>
                    <span className="text-kupon-ink/60 font-mono">1 KPON = Rp1,000,000 Par Value</span>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={issueAmount}
                      onChange={e => setIssueAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className="input w-full font-mono text-lg bg-[#FAF6EC] text-kupon-ink focus:outline-none pr-16"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-kupon-ink/50 pointer-events-none">
                      KPON
                    </span>
                  </div>

                  {/* Nominal Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-sans">
                    <span className="text-kupon-ink/50 text-[11px]">Quick Amounts:</span>
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
                        className="px-2.5 py-1 rounded bg-[#FAF6EC] hover:bg-[#FAF6EC]/80 text-kupon-ink text-xs cursor-pointer transition-colors font-mono"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Pre-Flight Feedback */}
                <div
                  className={`p-4 rounded-xl text-xs font-sans leading-relaxed flex items-start gap-3 transition-colors ${
                    isAddressValid && parsedIssueAmount !== undefined && parsedIssueAmount > 0n
                      ? issuanceValidation.ok
                        ? "bg-[#EEF7F2] text-kupon-emerald"
                        : "bg-[#FDF2F1] text-error"
                      : "bg-[#FAF6EC] text-kupon-ink/75"
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
                          ? "Issuance Requirements Satisfied"
                          : "Issuance Pre-Flight Blocked"
                        : "Compliance Verification Status"}
                    </div>
                    <p className="m-0 text-kupon-ink/80">{issuanceValidation.text}</p>
                  </div>
                </div>

                {/* Primary Issue Button */}
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
                  <span>Authorize & Issue {issueAmount ? `${issueAmount} KPON` : "Tranche"}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 3. CLEAN FOOTER LINKS */}
        {/* ===================================================================== */}
        <footer className="flex flex-wrap items-center justify-between pt-8 text-xs text-kupon-ink/70 font-sans gap-4 border-t border-[#E5DEC7]">
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
