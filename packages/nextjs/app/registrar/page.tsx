"use client";

import { useState } from "react";
import Link from "next/link";
import { Address, AddressInput } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther, isAddress, keccak256, toHex } from "viem";
import { useAccount } from "wagmi";
import {
  CheckCircleIcon,
  InformationCircleIcon,
  MinusCircleIcon,
  UserPlusIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { GuillochePattern } from "~~/components/GuillochePattern";
import { WorldIDVerificationButton } from "~~/components/registrar/WorldIDVerificationButton";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

// Smart contract identifiers
const RESIDENCY_ID = keccak256(toHex("RESIDENCY_ID"));
const ACCREDITED = keccak256(toHex("ACCREDITED"));
const REGISTRAR_ROLE = keccak256(toHex("REGISTRAR_ROLE"));
const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

const DEPLOYER_AUTHORITY_ADDRESS = "0x2b97bea17da0ff83fd95a73dc60881d5b27a2b9b";

// Preset accounts for testing & demonstration
const DEMO_PRESETS = [
  { label: "Alice (Retail Demo)", address: "0x1111111111111111111111111111111111111111" },
  { label: "Bob (Institutional Demo)", address: "0x2222222222222222222222222222222222222222" },
] as const;

type ClaimType = "RESIDENCY_ID" | "ACCREDITED";

function translateRegistrarError(rawError: unknown): string {
  const parsed = getParsedError(rawError);
  if (/AccessControlUnauthorizedAccount/i.test(parsed) || /unauthorized/i.test(parsed) || /0x4e487b71/i.test(parsed)) {
    return "Access Denied: Connected wallet lacks REGISTRAR_ROLE authority.";
  }
  if (/Kupon__InvalidClaim/i.test(parsed)) {
    return "Invalid claim type. Must be either RESIDENCY_ID or ACCREDITED.";
  }
  if (/execution reverted/i.test(parsed)) {
    return "Transaction reverted onchain. Ensure authority role permissions are active.";
  }
  return parsed;
}

const RegistrarPage: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  // Active workspace state: single investor address drives all actions
  const [investorAddress, setInvestorAddress] = useState<string>("");

  // Certification state
  const [selectedClaim, setSelectedClaim] = useState<ClaimType>("RESIDENCY_ID");
  const [isProcessingClaim, setIsProcessingClaim] = useState(false);
  const [isWorldIdVerified, setIsWorldIdVerified] = useState(false);

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

  const hasRegistrarAuthority = Boolean(isRegistrar || isRegistryAdmin);

  // Contract Reads: Global Token Metrics for macro overview
  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "totalSupply",
  });

  const { data: seriesCap } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "SERIES_CAP",
  });

  // Contract Writes: Claim Registry
  const { writeContractAsync: writeClaimRegistry } = useScaffoldWriteContract({ contractName: "KuponClaimRegistry" });

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

  const { data: investorBalance } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "balanceOf",
    args: [safeTarget],
  });

  const currentClaimActive = selectedClaim === "RESIDENCY_ID" ? Boolean(hasResidency) : Boolean(hasAccredited);

  // Actions
  const handleGrantClaim = async () => {
    if (!isAddressValid) {
      notification.error("Please enter a valid citizen address.");
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
      notification.error("Please enter a valid citizen address.");
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
        {/* 1. EDITORIAL HEADER & MACRO QUOTA OVERVIEW (SINGLE BORDER) */}
        {/* ===================================================================== */}
        <header className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-serif font-bold text-kupon-ink tracking-tight m-0">
                Registrar Desk
              </h1>
              <p className="text-base text-kupon-ink/75 font-sans max-w-2xl leading-relaxed m-0">
                National investor identity registry (KSEI SID). Authenticate citizen credentials to unlock sovereign
                retail bond participation.
              </p>
            </div>

            {/* Authority Status Pill */}
            <div className="inline-flex items-center gap-3 bg-[#F4EEDC] px-4 py-2.5 rounded-full text-xs font-sans self-start lg:self-auto border border-kupon-gold/30">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  hasRegistrarAuthority ? "bg-kupon-emerald animate-pulse" : "bg-kupon-gold"
                }`}
              />
              <span className="font-semibold text-kupon-ink">
                {hasRegistrarAuthority ? "Registrar Authority" : "Observer Mode"}
              </span>
              <span className="text-kupon-ink/40">|</span>
              <span className="font-mono text-kupon-ink/70">
                {connectedAddress ? `${connectedAddress.slice(0, 6)}…${connectedAddress.slice(-4)}` : "Disconnected"}
              </span>
            </div>
          </div>

          {/* Macro Series Quota Strip (Single Border) */}
          <div className="bg-[#F8F3E5] px-6 py-4 rounded-xl border border-kupon-gold/30 flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between text-xs font-sans text-kupon-ink/80 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-kupon-ink/60">Active Benchmark Series:</span>
                <strong className="text-kupon-emerald font-mono text-sm">ORI026 (SBN Ritel 2026/2027)</strong>
                <span className="text-kupon-ink/60">· 6.40% p.a. Fixed Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-kupon-ink/60">National Series Absorption:</span>
                <strong className="text-kupon-gold font-mono text-sm">
                  {currentSupplyNum.toLocaleString("en-US")} / {seriesCapNum.toLocaleString("en-US")} KPON
                </strong>
                <span className="text-kupon-ink/60">({remainingNum.toLocaleString("en-US")} KPON unissued)</span>
              </div>
            </div>
            <div className="w-full bg-[#E5DEC7] h-2 rounded-full overflow-hidden">
              <div
                className="bg-kupon-emerald h-full transition-all duration-500 rounded-full"
                style={{ width: `${percentageIssued}%` }}
              />
            </div>
          </div>

          {/* Observer Guidance Banner */}
          {connectedAddress && !hasRegistrarAuthority && (
            <div className="bg-[#FAF1DF] px-4 py-3 rounded-lg border border-kupon-gold/30 text-xs text-kupon-ink/85 flex items-center gap-2.5">
              <InformationCircleIcon className="w-4 h-4 text-kupon-gold shrink-0" />
              <span>
                You are viewing in observer mode. Connect the deployer authority wallet (
                <code className="font-mono text-[11px] bg-[#F4EEDC] px-1 py-0.5 rounded">
                  {DEPLOYER_AUTHORITY_ADDRESS}
                </code>
                ) to sign official identity grants or revoke credentials on-chain.
              </span>
            </div>
          )}
        </header>

        {/* ===================================================================== */}
        {/* 2. ASYMMETRIC WORKBENCH (5 : 7 RATIO, SINGLE BORDER) */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ----------------------------------------------------------------- */}
          {/* LEFT COLUMN: INVESTOR ACCOUNT DOSSIER (5 COLS, SINGLE BORDER) */}
          {/* ----------------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="space-y-1">
              <h2 className="text-xl font-serif font-bold text-kupon-ink m-0">Target Citizen / Investor</h2>
              <p className="text-xs text-kupon-ink/70 font-sans m-0">
                Search an address to query live KSEI SID credentials and bond holdings.
              </p>
            </div>

            {/* Address Input */}
            <div className="space-y-2">
              <AddressInput
                value={investorAddress}
                onChange={setInvestorAddress}
                placeholder="Citizen address (0x...)"
              />

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-sans">
                <span className="text-kupon-ink/50 text-[11px]">Presets:</span>
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
                    Selected Investor Profile
                  </span>
                  <div className="pt-0.5">
                    <Address address={investorAddress} format="long" size="sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-kupon-gold/20">
                  {/* Status Overview */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-kupon-ink/50">Registry Status</span>
                    <div className="font-sans font-semibold text-xs text-kupon-ink flex items-center gap-1.5">
                      {hasAccredited ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-kupon-gold" />
                          <span>Accredited Entity</span>
                        </>
                      ) : hasResidency ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-kupon-emerald" />
                          <span>Verified WNI Citizen</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-base-300" />
                          <span className="text-kupon-ink/60">Unregistered</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Balance Holdings */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono text-kupon-ink/50">Total Holdings</span>
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
                      Certified as <strong>Retail Indonesian Citizen</strong>. Permitted to purchase and trade SBN Ritel
                      bonds up to 5,000 KPON (Rp5 Billion).
                    </span>
                  ) : (
                    <span className="text-kupon-ink/80">
                      Certified as <strong>Institutional / Accredited</strong>. Exempt from the retail holding cap for
                      institutional market operations.
                    </span>
                  )}
                </div>

                {/* Regulatory Framework Reference */}
                <div className="pt-2 border-t border-kupon-gold/20 flex items-center justify-between text-xs font-sans">
                  <span className="text-kupon-ink/50 text-[11px]">Regulatory Standard:</span>
                  <Link href="/framework" className="text-kupon-emerald hover:underline font-medium">
                    KSEI SID & POJK 3/2024 Rules →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-[#F8F3E5] p-8 rounded-xl border border-dashed border-kupon-gold/30 text-center text-xs font-sans text-kupon-ink/60 space-y-1">
                <p className="m-0 font-medium text-kupon-ink/70">No citizen address selected</p>
                <p className="m-0">Type an address or pick one of the presets above to certify identity credentials.</p>
              </div>
            )}
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* RIGHT COLUMN: REGISTRAR CERTIFICATION WORKBENCH (7 COLS, SINGLE BORDER) */}
          {/* ----------------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col gap-6 bg-[#F8F3E5] p-6 sm:p-8 rounded-xl border border-kupon-gold/30">
            <div className="space-y-1 border-b border-kupon-gold/20 pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-serif font-bold text-kupon-ink m-0">
                  Investor Identity Certification Desk
                </h3>
                <span className="text-[11px] font-mono text-kupon-emerald bg-kupon-emerald/10 px-2 py-0.5 rounded border border-kupon-emerald/20">
                  KSEI SID Authority
                </span>
              </div>
              <p className="text-xs text-kupon-ink/75 font-sans m-0 leading-relaxed">
                Authenticate citizen national identity (KSEI SID) in KuponClaimRegistry so the investor can order SBN
                bonds and execute transfers.
              </p>
            </div>

            {/* On-Chain Credentials Status */}
            <div className="bg-[#FAF6EC] p-4 rounded-lg border border-kupon-gold/30 flex flex-col gap-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-kupon-ink/60">
                Live Registry Status for Target Wallet
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
                    <span className="text-xs font-semibold text-kupon-ink font-sans">Institutional / Accredited</span>
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
              <label className="text-xs font-mono font-medium text-kupon-ink">Select Credential to Grant:</label>

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

              {/* World ID Proof of Personhood Verification */}
              {selectedClaim === "RESIDENCY_ID" && (
                <WorldIDVerificationButton
                  investorAddress={investorAddress}
                  onVerified={() => setIsWorldIdVerified(true)}
                />
              )}

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
                <span className="flex items-center gap-1.5">
                  {currentClaimActive
                    ? `Already Holds ${selectedClaim === "RESIDENCY_ID" ? "Residency" : "Accreditation"}`
                    : `Grant ${selectedClaim === "RESIDENCY_ID" ? "Indonesian Residency" : "Accreditation"} Claim`}
                  {isWorldIdVerified && selectedClaim === "RESIDENCY_ID" && (
                    <span className="text-[10px] bg-kupon-emerald/20 text-kupon-ivory px-1 rounded">
                      World ID Verified
                    </span>
                  )}
                </span>
              </button>

              {/* Subdued Revoke Button (Administrative Override) */}
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
                    <span>Revoke this claim (Freezes Account Transfers)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 3. CLEAN FOOTER LINKS (SINGLE BORDER DIVIDER) */}
        {/* ===================================================================== */}
        <footer className="flex flex-wrap items-center justify-between pt-8 text-xs text-kupon-ink/70 font-sans gap-4 border-t border-kupon-gold/30">
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-kupon-emerald hover:underline font-medium">
              ← Open Investor Portal (SBN Market & Secondary Trading)
            </Link>
            <span>·</span>
            <Link href="/regulator" className="text-kupon-gold hover:underline font-medium">
              Open Regulator Terminal →
            </Link>
          </div>
          <div className="font-mono text-[11px] text-kupon-ink/50">
            Identity Registry: <code className="text-kupon-emerald">KuponClaimRegistry.sol</code> · Transfer Hook:{" "}
            <code className="text-kupon-gold">KuponComplianceModule.sol</code>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default RegistrarPage;
