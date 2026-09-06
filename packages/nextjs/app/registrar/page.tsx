"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Address, AddressInput } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther, isAddress, keccak256, parseEther, toHex } from "viem";
import { useAccount } from "wagmi";
import {
  CheckBadgeIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  KeyIcon,
  PlusCircleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  UserPlusIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { GuillochePattern } from "~~/components/GuillochePattern";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

// Domain constants matching Kupon contracts
const RESIDENCY_ID = keccak256(toHex("RESIDENCY_ID"));
const ACCREDITED = keccak256(toHex("ACCREDITED"));
const REGISTRAR_ROLE = keccak256(toHex("REGISTRAR_ROLE"));
const ISSUER_ROLE = keccak256(toHex("ISSUER_ROLE"));
const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

// Default deployer address for quick authority guidance
const DEPLOYER_AUTHORITY_ADDRESS = "0x2b97bea17da0ff83fd95a73dc60881d5b27a2b9b";

type ClaimType = "RESIDENCY_ID" | "ACCREDITED";

function translateRegistrarError(rawError: unknown): string {
  const parsed = getParsedError(rawError);
  if (/AccessControlUnauthorizedAccount/i.test(parsed) || /unauthorized/i.test(parsed) || /0x4e487b71/i.test(parsed)) {
    return "Unauthorized: Connected wallet does not hold the required authority role (REGISTRAR_ROLE or ISSUER_ROLE).";
  }
  if (/Kupon__SeriesCapExceeded/i.test(parsed)) {
    return "Issuance rejected: Total issuance would breach the series cap of 100,000 KPON.";
  }
  if (/Kupon__RuleViolated/i.test(parsed) || /R1-RESIDENCY/i.test(parsed)) {
    return "Compliance rejected (R1-RESIDENCY): Recipient must be granted an active identity claim before receiving newly issued tokens.";
  }
  if (/R2-CAP/i.test(parsed)) {
    return "Compliance rejected (R2-CAP): Recipient is retail and total balance would exceed the 5,000 KPON cap.";
  }
  if (/Kupon__InvalidClaim/i.test(parsed)) {
    return "Invalid claim type: Claim must be either RESIDENCY_ID or ACCREDITED.";
  }
  if (/execution reverted/i.test(parsed)) {
    return "Transaction reverted by on-chain rule check. Ensure role authorization and compliance parameters are met.";
  }
  return parsed;
}

const RegistrarPage: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  // State: Identity Claim Form
  const [claimTargetAddress, setClaimTargetAddress] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<ClaimType>("RESIDENCY_ID");
  const [isProcessingClaim, setIsProcessingClaim] = useState(false);

  // State: Token Issuance Form
  const [issueRecipientAddress, setIssueRecipientAddress] = useState("");
  const [issueAmount, setIssueAmount] = useState("");
  const [isIssuingTokens, setIsIssuingTokens] = useState(false);

  // State: Live Query Inspector
  const [inspectAddress, setInspectAddress] = useState("");

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

  // Contract Reads: Connected Wallet Authority Roles
  const targetWallet = connectedAddress ?? ZERO_ADDRESS;

  const { data: isRegistrar, isLoading: checkingRegistrar } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasRole",
    args: [REGISTRAR_ROLE, targetWallet],
  });

  const { data: isRegistryAdmin } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasRole",
    args: [DEFAULT_ADMIN_ROLE, targetWallet],
  });

  const { data: isIssuer, isLoading: checkingIssuer } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "hasRole",
    args: [ISSUER_ROLE, targetWallet],
  });

  const hasRegistrarAuthority = Boolean(isRegistrar || isRegistryAdmin);
  const hasIssuerAuthority = Boolean(isIssuer);

  // Contract Writes
  const { writeContractAsync: writeClaimRegistry } = useScaffoldWriteContract({ contractName: "KuponClaimRegistry" });
  const { writeContractAsync: writeToken } = useScaffoldWriteContract({ contractName: "KuponToken" });

  // ---------------------------------------------------------------------------
  // Target Address for Claim Form Queries
  // ---------------------------------------------------------------------------
  const claimTargetValid = isAddress(claimTargetAddress);
  const safeClaimTarget = claimTargetValid ? claimTargetAddress : ZERO_ADDRESS;

  const { data: targetHasResidency, refetch: refetchTargetResidency } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasClaim",
    args: [safeClaimTarget, RESIDENCY_ID],
  });

  const { data: targetHasAccredited, refetch: refetchTargetAccredited } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasClaim",
    args: [safeClaimTarget, ACCREDITED],
  });

  const targetClaimKey = selectedClaim === "RESIDENCY_ID" ? RESIDENCY_ID : ACCREDITED;
  const targetCurrentlyHoldsSelected =
    selectedClaim === "RESIDENCY_ID" ? Boolean(targetHasResidency) : Boolean(targetHasAccredited);

  // ---------------------------------------------------------------------------
  // Recipient Address for Issuance Form Queries & Pre-Flight
  // ---------------------------------------------------------------------------
  const issueRecipientValid = isAddress(issueRecipientAddress);
  const safeIssueRecipient = issueRecipientValid ? issueRecipientAddress : ZERO_ADDRESS;

  const { data: issueRecipientBalance, refetch: refetchIssueRecipientBalance } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "balanceOf",
    args: [safeIssueRecipient],
  });

  const { data: issueRecipientResidency } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasClaim",
    args: [safeIssueRecipient, RESIDENCY_ID],
  });

  const { data: issueRecipientAccredited } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasClaim",
    args: [safeIssueRecipient, ACCREDITED],
  });

  // Pre-flight check for tranche issuance
  const parsedIssueAmount = useMemo(() => {
    try {
      if (!issueAmount.trim()) return undefined;
      return parseEther(issueAmount);
    } catch {
      return undefined;
    }
  }, [issueAmount]);

  const issuancePreFlight = useMemo(() => {
    if (!issueRecipientValid) {
      return { ok: false, message: "Enter a valid recipient EVM address." };
    }
    if (parsedIssueAmount === undefined || parsedIssueAmount <= 0n) {
      return { ok: false, message: "Enter a valid positive tranche amount." };
    }
    if (seriesCap !== undefined && totalSupply !== undefined) {
      if (parsedIssueAmount > seriesCap - totalSupply) {
        return {
          ok: false,
          message: `Exceeds series cap buffer! Max remaining capacity: ${formatEther(seriesCap - totalSupply)} KPON.`,
        };
      }
    }
    if (issueRecipientResidency === undefined || issueRecipientAccredited === undefined) {
      return { ok: false, message: "Reading recipient compliance status..." };
    }
    if (!issueRecipientResidency && !issueRecipientAccredited) {
      return {
        ok: false,
        message: "Blocked by R1-RESIDENCY: Recipient must hold an identity claim before receiving newly minted bonds.",
      };
    }
    const isRetail = issueRecipientResidency && !issueRecipientAccredited;
    if (isRetail && retailCap !== undefined && issueRecipientBalance !== undefined) {
      if (parsedIssueAmount > retailCap || issueRecipientBalance > retailCap - parsedIssueAmount) {
        return {
          ok: false,
          message: `Blocked by R2-CAP: Retail investor balance (${formatEther(issueRecipientBalance)} KPON) + tranche would exceed 5,000 KPON cap.`,
        };
      }
    }
    return {
      ok: true,
      message: "Ready for issuance: Compliance gate and series cap constraints verified.",
    };
  }, [
    issueRecipientValid,
    parsedIssueAmount,
    seriesCap,
    totalSupply,
    issueRecipientResidency,
    issueRecipientAccredited,
    retailCap,
    issueRecipientBalance,
  ]);

  // ---------------------------------------------------------------------------
  // Inspector Queries (Search Any Address)
  // ---------------------------------------------------------------------------
  const inspectValid = isAddress(inspectAddress);
  const safeInspectTarget = inspectValid ? inspectAddress : ZERO_ADDRESS;

  const { data: inspectResidency } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasClaim",
    args: [safeInspectTarget, RESIDENCY_ID],
  });

  const { data: inspectAccredited } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasClaim",
    args: [safeInspectTarget, ACCREDITED],
  });

  const { data: inspectBalance } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "balanceOf",
    args: [safeInspectTarget],
  });

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------
  const handleGrantClaim = async () => {
    if (!claimTargetValid) {
      notification.error("Please provide a valid recipient address.");
      return;
    }
    if (targetCurrentlyHoldsSelected) {
      notification.info(`Target already holds ${selectedClaim} claim.`);
      return;
    }
    setIsProcessingClaim(true);
    try {
      await writeClaimRegistry({
        functionName: "grantClaim",
        args: [claimTargetAddress, targetClaimKey],
      });
      notification.success(`Successfully granted ${selectedClaim} to ${claimTargetAddress.slice(0, 6)}…`);
      await Promise.all([refetchTargetResidency(), refetchTargetAccredited()]);
    } catch (err) {
      notification.error(translateRegistrarError(err), { duration: 8000 });
    } finally {
      setIsProcessingClaim(false);
    }
  };

  const handleRevokeClaim = async () => {
    if (!claimTargetValid) {
      notification.error("Please provide a valid recipient address.");
      return;
    }
    if (!targetCurrentlyHoldsSelected) {
      notification.info(`Target does not hold ${selectedClaim} claim.`);
      return;
    }
    setIsProcessingClaim(true);
    try {
      await writeClaimRegistry({
        functionName: "revokeClaim",
        args: [claimTargetAddress, targetClaimKey],
      });
      notification.success(`Successfully revoked ${selectedClaim} from ${claimTargetAddress.slice(0, 6)}…`);
      await Promise.all([refetchTargetResidency(), refetchTargetAccredited()]);
    } catch (err) {
      notification.error(translateRegistrarError(err), { duration: 8000 });
    } finally {
      setIsProcessingClaim(false);
    }
  };

  const handleIssueTranche = async () => {
    if (!issueRecipientValid) {
      notification.error("Enter a valid recipient address first.");
      return;
    }
    if (!parsedIssueAmount || parsedIssueAmount <= 0n) {
      notification.error("Enter a valid amount in KPON.");
      return;
    }
    if (!issuancePreFlight.ok) {
      notification.error(issuancePreFlight.message, { duration: 8000 });
      return;
    }

    setIsIssuingTokens(true);
    try {
      await writeToken({
        functionName: "issue",
        args: [issueRecipientAddress, parsedIssueAmount],
      });
      notification.success(`Issued ${issueAmount} KPON to ${issueRecipientAddress.slice(0, 6)}…`);
      setIssueAmount("");
      await Promise.all([refetchSupply(), refetchIssueRecipientBalance()]);
    } catch (err) {
      notification.error(translateRegistrarError(err), { duration: 8000 });
    } finally {
      setIsIssuingTokens(false);
    }
  };

  // Safe formatting helpers
  const formattedSupply = totalSupply ? Number(formatEther(totalSupply)).toLocaleString("en-US") : "2,000";
  const formattedSeriesCap = seriesCap ? Number(formatEther(seriesCap)).toLocaleString("en-US") : "100,000";
  const remainingCapacity =
    seriesCap && totalSupply
      ? seriesCap >= totalSupply
        ? Number(formatEther(seriesCap - totalSupply)).toLocaleString("en-US")
        : "0"
      : "98,000";

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EC] text-[#14201C] selection:bg-kupon-gold/30">
      {/* Decorative Guilloche Watermark */}
      <div className="absolute right-0 top-16 pointer-events-none opacity-[0.03] overflow-hidden">
        <GuillochePattern variant="seal" width={600} height={600} color="emerald" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-20 relative z-10 flex flex-col gap-8">
        {/* ===================================================================== */}
        {/* HEADER & AUTHORITY SUMMARY */}
        {/* ===================================================================== */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-kupon-gold/40 pb-6 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#F4EEDC] border border-kupon-gold/60 text-xs font-mono text-kupon-emerald mb-3">
              <ShieldCheckIcon className="w-4 h-4 text-kupon-gold" />
              <span>Identity Registrar & Minting Authority</span>
              <span className="text-kupon-ink/40">·</span>
              <span className="font-semibold">ERC-3643 Simplified</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-kupon-ink tracking-tight">
              Registrar Portal
            </h1>
            <p className="text-sm sm:text-base text-kupon-ink/75 font-sans mt-2 max-w-2xl leading-relaxed">
              Authenticate investor identities into the national claims registry and execute primary tranche issuance
              within strict sovereign series quotas.
            </p>
          </div>

          {/* Connected Authority Indicator */}
          <div className="flex flex-col items-start md:items-end gap-2 bg-[#F3EEDB] p-4 rounded certificate-border-subtle">
            <div className="text-xs font-mono text-kupon-ink/70 flex items-center gap-1.5">
              <span>Authority Session</span>
              {connectedAddress ? (
                <span className="w-2 h-2 rounded-full bg-kupon-emerald animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-kupon-gold" />
              )}
            </div>
            {connectedAddress ? (
              <div className="flex items-center gap-2">
                <Address address={connectedAddress} size="sm" />
              </div>
            ) : (
              <span className="text-xs font-mono text-error">No wallet connected</span>
            )}

            <div className="flex flex-wrap gap-1.5 mt-1">
              {checkingRegistrar || checkingIssuer ? (
                <span className="text-xs font-mono opacity-60">Checking roles...</span>
              ) : (
                <>
                  <span
                    className={`badge badge-sm font-mono ${
                      hasRegistrarAuthority
                        ? "bg-kupon-emerald text-kupon-ivory border-kupon-emerald"
                        : "bg-base-200 text-kupon-ink/50 border-base-300"
                    }`}
                  >
                    {hasRegistrarAuthority ? "✓ REGISTRAR" : "NO REGISTRAR_ROLE"}
                  </span>
                  <span
                    className={`badge badge-sm font-mono ${
                      hasIssuerAuthority
                        ? "bg-kupon-gold text-kupon-ink border-kupon-gold"
                        : "bg-base-200 text-kupon-ink/50 border-base-300"
                    }`}
                  >
                    {hasIssuerAuthority ? "✓ ISSUER" : "NO ISSUER_ROLE"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* ROLE ALERT BANNER (IF WALLET IS NOT REGISTRAR / ISSUER) */}
        {/* ===================================================================== */}
        {connectedAddress && !hasRegistrarAuthority && !hasIssuerAuthority && (
          <div className="p-4 rounded bg-[#FAF1DF] border border-kupon-gold text-kupon-ink text-sm flex items-start gap-3 shadow-sm">
            <ExclamationTriangleIcon className="w-5 h-5 text-kupon-gold shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-kupon-ink">Read-Only / Simulation Mode</p>
              <p className="text-kupon-ink/80 text-xs leading-relaxed">
                Your connected wallet does not hold <code className="font-mono text-xs">REGISTRAR_ROLE</code> or{" "}
                <code className="font-mono text-xs">ISSUER_ROLE</code>. You can search claims and review quotas, but
                on-chain transactions will revert. Switch in your wallet to the deployer authority (
                <code className="font-mono text-xs bg-base-200 px-1 py-0.5 rounded">{DEPLOYER_AUTHORITY_ADDRESS}</code>)
                to execute live state modifications.
              </p>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* EXECUTIVE SERIES QUOTA SUMMARY */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#F8F3E5] p-4 rounded certificate-border-subtle flex flex-col justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-kupon-ink/65">Authorized Series Cap</span>
            <div className="mt-2 text-2xl font-serif font-bold text-kupon-ink">
              {formattedSeriesCap} <span className="text-sm font-sans font-normal text-kupon-ink/70">KPON</span>
            </div>
            <span className="text-[11px] font-sans text-kupon-ink/60 mt-1">Sovereign Debt Quota (100k bonds)</span>
          </div>

          <div className="bg-[#F8F3E5] p-4 rounded certificate-border-subtle flex flex-col justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-kupon-ink/65">Current Total Supply</span>
            <div className="mt-2 text-2xl font-serif font-bold text-kupon-emerald">
              {formattedSupply} <span className="text-sm font-sans font-normal text-kupon-ink/70">KPON</span>
            </div>
            <span className="text-[11px] font-sans text-kupon-ink/60 mt-1">Minted across all tranches</span>
          </div>

          <div className="bg-[#F8F3E5] p-4 rounded certificate-border-subtle flex flex-col justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-kupon-ink/65">Remaining Capacity</span>
            <div className="mt-2 text-2xl font-serif font-bold text-kupon-gold">
              {remainingCapacity} <span className="text-sm font-sans font-normal text-kupon-ink/70">KPON</span>
            </div>
            <span className="text-[11px] font-sans text-kupon-ink/60 mt-1">Available for new issuances</span>
          </div>

          <div className="bg-[#F8F3E5] p-4 rounded certificate-border-subtle flex flex-col justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-kupon-ink/65">Retail Investor Limit</span>
            <div className="mt-2 text-2xl font-serif font-bold text-kupon-ink">
              5,000 <span className="text-sm font-sans font-normal text-kupon-ink/70">KPON</span>
            </div>
            <span className="text-[11px] font-sans text-kupon-ink/60 mt-1">R2 Rule cap per non-accredited wallet</span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* MAIN OPERATIONS: 2-COLUMN BROADSHEET */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* ----------------------------------------------------------------- */}
          {/* COLUMN 1: IDENTITY CLAIM REGISTRATION */}
          {/* ----------------------------------------------------------------- */}
          <div className="bg-[#FAF6EC] p-6 rounded certificate-border flex flex-col gap-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-kupon-gold/30 pb-4">
              <div className="flex items-center gap-2.5">
                <DocumentCheckIcon className="w-6 h-6 text-kupon-emerald" />
                <h2 className="text-xl font-serif font-bold text-kupon-ink m-0">Investor Claim Certification</h2>
              </div>
              <span className="text-xs font-mono text-kupon-gold uppercase tracking-wider">KSEI SID Module</span>
            </div>

            <p className="text-xs sm:text-sm text-kupon-ink/80 font-sans leading-relaxed m-0">
              Grant or revoke verified identity credentials on the sovereign claim registry. Claims reflect instantly
              onchain and govern the compliance module for transfer gates.
            </p>

            {/* Target Address Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono font-medium text-kupon-ink flex items-center justify-between">
                <span>Investor Address (Account to Certify)</span>
                {connectedAddress && (
                  <button
                    type="button"
                    onClick={() => setClaimTargetAddress(connectedAddress)}
                    className="text-[11px] text-kupon-emerald hover:underline font-mono cursor-pointer"
                  >
                    Paste My Address
                  </button>
                )}
              </label>
              <AddressInput
                value={claimTargetAddress}
                onChange={setClaimTargetAddress}
                placeholder="0x... EVM address"
              />
            </div>

            {/* Claim Selection: Radio Tiles */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-mono font-medium text-kupon-ink">Identity Credential Type</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedClaim("RESIDENCY_ID")}
                  className={`p-3.5 rounded text-left border transition-all cursor-pointer ${
                    selectedClaim === "RESIDENCY_ID"
                      ? "bg-[#F3EEDB] border-kupon-emerald shadow-sm"
                      : "bg-[#FAF6EC] border-kupon-gold/30 hover:border-kupon-gold/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-kupon-emerald">RESIDENCY_ID</span>
                    {selectedClaim === "RESIDENCY_ID" && <CheckBadgeIcon className="w-4 h-4 text-kupon-emerald" />}
                  </div>
                  <p className="text-xs text-kupon-ink/75 font-sans m-0 leading-relaxed">
                    Indonesian Citizen (WNI). Unlocks retail tranche and satisfies R1-RESIDENCY rule.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedClaim("ACCREDITED")}
                  className={`p-3.5 rounded text-left border transition-all cursor-pointer ${
                    selectedClaim === "ACCREDITED"
                      ? "bg-[#F3EEDB] border-kupon-gold shadow-sm"
                      : "bg-[#FAF6EC] border-kupon-gold/30 hover:border-kupon-gold/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-kupon-gold">ACCREDITED</span>
                    {selectedClaim === "ACCREDITED" && <CheckBadgeIcon className="w-4 h-4 text-kupon-gold" />}
                  </div>
                  <p className="text-xs text-kupon-ink/75 font-sans m-0 leading-relaxed">
                    Institutional / Accredited. Exempt from the 5,000 KPON retail cap (R2 rule).
                  </p>
                </button>
              </div>
            </div>

            {/* Target Address Current Status Card */}
            {claimTargetValid && (
              <div className="p-3.5 rounded bg-[#F4EEDC] border border-kupon-gold/40 text-xs font-mono flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-kupon-ink/70">
                  <span>Current Onchain State:</span>
                  <span className="font-sans font-medium text-kupon-ink">
                    {targetHasResidency && targetHasAccredited
                      ? "Residency + Accredited (Both Active)"
                      : targetHasAccredited
                        ? "Accredited (Cap-Exempt)"
                        : targetHasResidency
                          ? "Residency (Retail)"
                          : "No Active Claims (Frozen / Unregistered)"}
                  </span>
                </div>
                <div className="flex items-center gap-4 pt-1 border-t border-kupon-gold/20">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${targetHasResidency ? "bg-kupon-emerald" : "bg-base-300"}`}
                    />
                    <span>RESIDENCY_ID: {targetHasResidency ? "Active" : "None"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${targetHasAccredited ? "bg-kupon-gold" : "bg-base-300"}`} />
                    <span>ACCREDITED: {targetHasAccredited ? "Active" : "None"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons: Grant & Revoke */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleGrantClaim}
                disabled={isProcessingClaim || !claimTargetValid || targetCurrentlyHoldsSelected}
                className="btn btn-primary font-sans font-medium text-kupon-ivory flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessingClaim ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <UserPlusIcon className="w-4 h-4" />
                )}
                <span>Grant Claim</span>
              </button>

              <button
                type="button"
                onClick={handleRevokeClaim}
                disabled={isProcessingClaim || !claimTargetValid || !targetCurrentlyHoldsSelected}
                className="btn btn-outline border-error text-error hover:bg-error/10 font-sans font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessingClaim ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <XCircleIcon className="w-4 h-4" />
                )}
                <span>Revoke Claim</span>
              </button>
            </div>

            <p className="text-[11px] text-kupon-ink/60 font-sans m-0 leading-relaxed">
              Note: Revoking all claims from a holder instantly freezes their token transfer capability under rule
              R3-FROZEN. Granting any claim instantly unfreezes the account.
            </p>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* COLUMN 2: PRIMARY TRANCHE ISSUANCE */}
          {/* ----------------------------------------------------------------- */}
          <div className="bg-[#FAF6EC] p-6 rounded certificate-border flex flex-col gap-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-kupon-gold/30 pb-4">
              <div className="flex items-center gap-2.5">
                <PlusCircleIcon className="w-6 h-6 text-kupon-gold" />
                <h2 className="text-xl font-serif font-bold text-kupon-ink m-0">Primary Tranche Issuance</h2>
              </div>
              <span className="text-xs font-mono text-kupon-emerald uppercase tracking-wider">DJPPR Mint Gate</span>
            </div>

            <p className="text-xs sm:text-sm text-kupon-ink/80 font-sans leading-relaxed m-0">
              Issue newly minted sovereign bond tokens to qualified custody or investor accounts. All issuances pass the
              compliance gate and are hard-bounded by the 100,000 series quota.
            </p>

            {/* Recipient Address */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono font-medium text-kupon-ink flex items-center justify-between">
                <span>Recipient Account</span>
                {claimTargetValid && (
                  <button
                    type="button"
                    onClick={() => setIssueRecipientAddress(claimTargetAddress)}
                    className="text-[11px] text-kupon-emerald hover:underline font-mono cursor-pointer"
                  >
                    Use Certified Target
                  </button>
                )}
              </label>
              <AddressInput
                value={issueRecipientAddress}
                onChange={setIssueRecipientAddress}
                placeholder="0x... Recipient address"
              />
            </div>

            {/* Amount & Quick Increments */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-kupon-ink">Tranche Size (KPON)</span>
                <span className="text-kupon-ink/60">1 KPON = 1 Bond (Rp1,000,000)</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={issueAmount}
                  onChange={e => setIssueAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="input input-bordered w-full font-mono text-lg bg-[#F8F3E5] border-kupon-gold/40 text-kupon-ink focus:border-kupon-emerald focus:outline-none pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-kupon-ink/50 pointer-events-none">
                  KPON
                </span>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: "+250", value: "250" },
                  { label: "+500", value: "500" },
                  { label: "+1,000", value: "1000" },
                  { label: "+5,000 (Max Retail)", value: "5000" },
                ].map(chip => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setIssueAmount(chip.value)}
                    className="btn btn-xs btn-outline border-kupon-gold/50 text-kupon-ink font-mono hover:bg-kupon-gold/20"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Issuance Pre-Flight Verdict Box */}
            <div
              className={`p-3.5 rounded border text-xs font-sans leading-relaxed transition-colors ${
                issueRecipientValid && parsedIssueAmount !== undefined && parsedIssueAmount > 0n
                  ? issuancePreFlight.ok
                    ? "bg-[#EEF7F2] border-kupon-emerald text-kupon-emerald"
                    : "bg-[#FDF2F1] border-error text-error"
                  : "bg-[#F3EEDB] border-kupon-gold/40 text-kupon-ink/75"
              }`}
            >
              <div className="font-mono font-semibold flex items-center gap-1.5 mb-1">
                {issueRecipientValid && parsedIssueAmount !== undefined && parsedIssueAmount > 0n ? (
                  issuancePreFlight.ok ? (
                    <>
                      <ShieldCheckIcon className="w-4 h-4 text-kupon-emerald" />
                      <span>Pre-Flight Gate: Pass</span>
                    </>
                  ) : (
                    <>
                      <ShieldExclamationIcon className="w-4 h-4 text-error" />
                      <span>Pre-Flight Gate: Blocked</span>
                    </>
                  )
                ) : (
                  <>
                    <InformationCircleIcon className="w-4 h-4 text-kupon-gold" />
                    <span>Pre-Flight Compliance Preview</span>
                  </>
                )}
              </div>
              <p className="m-0">{issuancePreFlight.message}</p>
            </div>

            {/* Issue Tranche Button */}
            <button
              type="button"
              onClick={handleIssueTranche}
              disabled={isIssuingTokens || !issuancePreFlight.ok}
              className="btn btn-primary font-sans font-medium text-kupon-ivory flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
            >
              {isIssuingTokens ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <KeyIcon className="w-4 h-4" />
              )}
              <span>Authorize & Issue Tranche</span>
            </button>

            <p className="text-[11px] text-kupon-ink/60 font-sans m-0 leading-relaxed">
              Minting is non-custodial and dispatched directly to the recipient wallet. The compliance hook enforces
              that the recipient holds valid KYC credentials at the moment of minting.
            </p>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* LIVE IDENTITY & BALANCE INSPECTOR (FULL WIDTH AUDIT PANE) */}
        {/* ===================================================================== */}
        <div className="bg-[#FAF6EC] p-6 sm:p-8 rounded certificate-border flex flex-col gap-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-kupon-gold/30 pb-4 gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-kupon-ink m-0">Live Registry Inspector</h2>
              <p className="text-xs sm:text-sm text-kupon-ink/75 font-sans m-0 mt-1">
                Direct onchain query across the claim registry and token ledger for any participant address.
              </p>
            </div>
            <span className="text-xs font-mono text-kupon-emerald uppercase tracking-wider">Audit Telemetry</span>
          </div>

          {/* Search Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-9 flex flex-col gap-1.5">
              <label className="text-xs font-mono font-medium text-kupon-ink">Query Target Address</label>
              <AddressInput
                value={inspectAddress}
                onChange={setInspectAddress}
                placeholder="Paste address to inspect claims and balance..."
              />
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (connectedAddress) setInspectAddress(connectedAddress);
                }}
                className="btn btn-outline border-kupon-gold text-kupon-ink btn-block font-sans text-xs"
              >
                Inspect My Wallet
              </button>
            </div>
          </div>

          {/* Inspection Result Card */}
          {inspectValid ? (
            <div className="bg-[#F8F3E5] p-5 sm:p-6 rounded certificate-border-subtle grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Wallet Identity & Tier */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono text-kupon-ink/65 uppercase tracking-wider">Account Overview</span>
                <Address address={inspectAddress} format="long" size="sm" />
                <div className="mt-1">
                  <span className="text-xs font-mono text-kupon-ink/60">Compliance Classification:</span>
                  <div className="font-serif font-semibold text-sm text-kupon-ink mt-0.5">
                    {inspectAccredited
                      ? "Tier A · Institutional / Accredited (Cap-Exempt)"
                      : inspectResidency
                        ? "Tier B · Retail Indonesian Citizen (Max 5,000 KPON)"
                        : "Tier 0 · Uncertified / Inactive (Transfers Frozen)"}
                  </div>
                </div>
              </div>

              {/* Claims Held */}
              <div className="flex flex-col gap-2 border-t md:border-t-0 md:border-l md:border-r border-kupon-gold/30 md:px-6 pt-4 md:pt-0">
                <span className="text-xs font-mono text-kupon-ink/65 uppercase tracking-wider">Identity Claims</span>
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-kupon-ink/80">RESIDENCY_ID (WNI)</span>
                    <span
                      className={`badge badge-sm font-mono ${
                        inspectResidency
                          ? "bg-kupon-emerald text-kupon-ivory"
                          : "bg-base-200 text-kupon-ink/50 border-base-300"
                      }`}
                    >
                      {inspectResidency ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-kupon-ink/80">ACCREDITED (Inst.)</span>
                    <span
                      className={`badge badge-sm font-mono ${
                        inspectAccredited
                          ? "bg-kupon-gold text-kupon-ink"
                          : "bg-base-200 text-kupon-ink/50 border-base-300"
                      }`}
                    >
                      {inspectAccredited ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Onchain KPON Balance */}
              <div className="flex flex-col justify-between h-full border-t md:border-t-0 border-kupon-gold/30 pt-4 md:pt-0">
                <div>
                  <span className="text-xs font-mono text-kupon-ink/65 uppercase tracking-wider">Ledger Holdings</span>
                  <div className="text-2xl font-serif font-bold text-kupon-ink mt-1">
                    {inspectBalance !== undefined ? formatEther(inspectBalance) : "0"}
                    <span className="text-sm font-sans font-normal text-kupon-ink/70 ml-1.5">KPON</span>
                  </div>
                </div>

                {/* Quick actions for inspected wallet */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-kupon-gold/20">
                  <button
                    type="button"
                    onClick={() => {
                      setClaimTargetAddress(inspectAddress);
                      window.scrollTo({ top: 400, behavior: "smooth" });
                    }}
                    className="text-xs font-mono text-kupon-emerald hover:underline cursor-pointer"
                  >
                    → Manage Claims
                  </button>
                  <span className="text-kupon-gold">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIssueRecipientAddress(inspectAddress);
                      window.scrollTo({ top: 400, behavior: "smooth" });
                    }}
                    className="text-xs font-mono text-kupon-gold hover:underline cursor-pointer"
                  >
                    → Issue Tranche
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded bg-[#F8F3E5] border border-dashed border-kupon-gold/40 text-center text-xs font-sans text-kupon-ink/60">
              Enter any EVM address above to inspect its live credentials on KuponClaimRegistry and holding balance on
              KuponToken.
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* NAVIGATION & FOOTER REFERENCES */}
        {/* ===================================================================== */}
        <div className="flex flex-wrap items-center justify-between border-t border-kupon-gold/30 pt-6 text-xs text-kupon-ink/70 font-sans gap-4">
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-kupon-emerald hover:underline font-medium">
              ← Investor Application
            </Link>
            <span>·</span>
            <Link href="/regulator" className="text-kupon-gold hover:underline font-medium">
              Regulator Terminal (4-Act Audit) →
            </Link>
          </div>
          <div className="font-mono text-[11px] text-kupon-ink/60">
            KSEI Registry: <code className="text-kupon-emerald">KuponClaimRegistry.sol</code> · DJPPR Mint:{" "}
            <code className="text-kupon-gold">KuponToken.sol</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrarPage;
