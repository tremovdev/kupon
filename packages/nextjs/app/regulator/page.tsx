"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Address, AddressInput } from "@scaffold-ui/components";
import { useQuery } from "@tanstack/react-query";
import type { NextPage } from "next";
import { formatEther, isAddress, keccak256, parseEther, toHex } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import {
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  DocumentMagnifyingGlassIcon,
  EyeIcon,
  InformationCircleIcon,
  PlayIcon,
  ScaleIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { GuillochePattern } from "~~/components/GuillochePattern";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

// Canonical Claim and Rule Identifiers matching Kupon smart contracts
const RESIDENCY_ID = keccak256(toHex("RESIDENCY_ID"));
const ACCREDITED = keccak256(toHex("ACCREDITED"));

const RULE_KEYS = {
  R1: keccak256(toHex("R1-RESIDENCY")),
  R2: keccak256(toHex("R2-CAP")),
  R3: keccak256(toHex("R3-FROZEN")),
} as const;

// Standard demo EOA addresses for the 4-act scenario
const DEMO_ACCOUNTS = {
  authority: "0x2b97bea17da0ff83fd95a73dc60881d5b27a2b9b",
  alice: "0x1111111111111111111111111111111111111111",
  bob: "0x2222222222222222222222222222222222222222",
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
type ClaimEventArgs = {
  account: string;
  claim: string;
};

function parseClaimEventArgs(args: unknown): ClaimEventArgs {
  if (args && typeof args === "object") {
    const acc = "account" in args && typeof args.account === "string" ? args.account : "";
    const clm = "claim" in args && typeof args.claim === "string" ? args.claim : "";
    return { account: acc, claim: clm };
  }
  return { account: "", claim: "" };
}

type SimulationResult = {
  evaluated: boolean;
  compliant: boolean;
  violatedRule: "R1-RESIDENCY" | "R2-CAP" | "R3-FROZEN" | null;
  policyExplanation: string;
  senderClaims: { residency: boolean; accredited: boolean };
  recipientClaims: { residency: boolean; accredited: boolean };
  recipientBalance: bigint;
  projectedBalance: bigint;
};

const RegulatorPage: NextPage = () => {
  const publicClient = usePublicClient();
  const { address: connectedAddress } = useAccount();

  // Contract Metadata
  const { data: registryInfo } = useDeployedContractInfo({ contractName: "KuponClaimRegistry" });
  const { data: complianceInfo } = useDeployedContractInfo({ contractName: "KuponComplianceModule" });
  const { data: tokenInfo } = useDeployedContractInfo({ contractName: "KuponToken" });

  const { writeContractAsync: writeClaimRegistry } = useScaffoldWriteContract({ contractName: "KuponClaimRegistry" });

  // Global Parameters
  const { data: retailCap } = useScaffoldReadContract({
    contractName: "KuponComplianceModule",
    functionName: "cap",
  });

  const { data: seriesCap } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "SERIES_CAP",
  });

  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "totalSupply",
  });

  // ---------------------------------------------------------------------------
  // 1. LIVE EVENT FEED (ClaimGranted & ClaimRevoked)
  // ---------------------------------------------------------------------------
  const {
    data: auditEvents,
    isLoading: isLoadingEvents,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["regulatorAuditEvents", registryInfo?.address],
    queryFn: async () => {
      if (!publicClient || !registryInfo?.address || !registryInfo?.abi) return [];

      try {
        const [grantedLogs, revokedLogs] = await Promise.all([
          publicClient.getContractEvents({
            address: registryInfo.address,
            abi: registryInfo.abi,
            eventName: "ClaimGranted",
            fromBlock: 0n,
          }),
          publicClient.getContractEvents({
            address: registryInfo.address,
            abi: registryInfo.abi,
            eventName: "ClaimRevoked",
            fromBlock: 0n,
          }),
        ]);

        const mappedGranted = grantedLogs.map(log => {
          const { account, claim } = parseClaimEventArgs(log.args);
          return {
            type: "GRANTED" as const,
            account,
            claim,
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            logIndex: log.logIndex,
          };
        });

        const mappedRevoked = revokedLogs.map(log => {
          const { account, claim } = parseClaimEventArgs(log.args);
          return {
            type: "REVOKED" as const,
            account,
            claim,
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            logIndex: log.logIndex,
          };
        });

        const combined = [...mappedGranted, ...mappedRevoked];
        combined.sort((a, b) => {
          if (b.blockNumber !== a.blockNumber) {
            return Number(b.blockNumber - a.blockNumber);
          }
          return b.logIndex - a.logIndex;
        });

        return combined;
      } catch (err) {
        console.error("Failed to query audit logs:", err);
        return [];
      }
    },
    enabled: Boolean(publicClient && registryInfo?.address),
    refetchInterval: 12000,
  });

  // ---------------------------------------------------------------------------
  // 2. SIMULATION CONTROLLER (eth_call view invocation)
  // ---------------------------------------------------------------------------
  const [simSender, setSimSender] = useState<string>(DEMO_ACCOUNTS.authority);
  const [simRecipient, setSimRecipient] = useState<string>(DEMO_ACCOUNTS.alice);
  const [simAmount, setSimAmount] = useState<string>("1000");
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const simSenderValid = isAddress(simSender);
  const simRecipientValid = isAddress(simRecipient);

  const runTransferSimulation = async (sender: string, recipient: string, amountStr: string) => {
    if (!publicClient || !complianceInfo?.address || !complianceInfo?.abi || !registryInfo?.abi || !tokenInfo?.abi) {
      notification.error("Contract interfaces loading. Please retry in a moment.");
      return;
    }

    if (!isAddress(sender) || !isAddress(recipient)) {
      notification.error("Provide valid sender and recipient addresses.");
      return;
    }

    let parsedVal: bigint;
    try {
      parsedVal = parseEther(amountStr);
    } catch {
      notification.error("Invalid amount input. Enter decimal value.");
      return;
    }

    setSimulating(true);

    try {
      // 1. Fetch current on-chain states for context
      const [senderResidency, senderAccredited, recResidency, recAccredited, recBalance] = await Promise.all([
        publicClient.readContract({
          address: registryInfo.address,
          abi: registryInfo.abi,
          functionName: "hasClaim",
          args: [sender, RESIDENCY_ID],
        }) as Promise<boolean>,
        publicClient.readContract({
          address: registryInfo.address,
          abi: registryInfo.abi,
          functionName: "hasClaim",
          args: [sender, ACCREDITED],
        }) as Promise<boolean>,
        publicClient.readContract({
          address: registryInfo.address,
          abi: registryInfo.abi,
          functionName: "hasClaim",
          args: [recipient, RESIDENCY_ID],
        }) as Promise<boolean>,
        publicClient.readContract({
          address: registryInfo.address,
          abi: registryInfo.abi,
          functionName: "hasClaim",
          args: [recipient, ACCREDITED],
        }) as Promise<boolean>,
        publicClient.readContract({
          address: tokenInfo.address,
          abi: tokenInfo.abi,
          functionName: "balanceOf",
          args: [recipient],
        }) as Promise<bigint>,
      ]);

      // 2. Perform live eth_call into enforceTransfer
      let isCompliant = true;
      let violatedRule: "R1-RESIDENCY" | "R2-CAP" | "R3-FROZEN" | null = null;
      let policyExplanation =
        "Compliant: Transfer satisfies residency credentialing, per-wallet retail cap, and non-frozen sender criteria.";

      try {
        await publicClient.readContract({
          address: complianceInfo.address,
          abi: complianceInfo.abi,
          functionName: "enforceTransfer",
          args: [sender, recipient, parsedVal, recBalance],
        });
      } catch (callErr) {
        isCompliant = false;
        const ruleId = extractRuleViolatedId(callErr);

        if (ruleId === RULE_KEYS.R1 || (!recResidency && !recAccredited)) {
          violatedRule = "R1-RESIDENCY";
          policyExplanation =
            "Blocked by Rule R1-RESIDENCY: Recipient holds no verified Indonesian residency claim (WNI) nor institutional accreditation on KuponClaimRegistry.";
        } else if (ruleId === RULE_KEYS.R3 || (sender !== ZERO_ADDRESS && !senderResidency && !senderAccredited)) {
          violatedRule = "R3-FROZEN";
          policyExplanation =
            "Blocked by Rule R3-FROZEN: Sender holds zero active identity claims. The account is frozen and barred from transmitting bond holdings.";
        } else if (ruleId === RULE_KEYS.R2 || (recResidency && !recAccredited)) {
          violatedRule = "R2-CAP";
          policyExplanation =
            "Blocked by Rule R2-CAP: Recipient is a retail investor and the proposed transfer would cause total holdings to exceed the statutory 5,000 KPON cap.";
        } else {
          policyExplanation = `Transfer reverted onchain: ${getParsedError(callErr)}`;
        }
      }

      setSimulationResult({
        evaluated: true,
        compliant: isCompliant,
        violatedRule,
        policyExplanation,
        senderClaims: { residency: senderResidency, accredited: senderAccredited },
        recipientClaims: { residency: recResidency, accredited: recAccredited },
        recipientBalance: recBalance,
        projectedBalance: recBalance + parsedVal,
      });
    } catch (err) {
      console.error("Simulation failure:", err);
      notification.error("Failed to query onchain contract simulation.");
    } finally {
      setSimulating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 3. INTERACTIVE 4-ACT DEMO CONTROLLER
  // ---------------------------------------------------------------------------
  const [activeAct, setActiveAct] = useState<1 | 2 | 3 | 4>(1);
  const [isExecutingLiveAct, setIsExecutingLiveAct] = useState<boolean>(false);

  const actDetails = useMemo(
    () => ({
      1: {
        title: "Act I · Non-WNI Transfer Blocked",
        rule: "R1-RESIDENCY",
        narrative:
          "An unregistered foreign or uncertified account attempts to receive KPON bonds. The transaction reverts deterministically under UU P2SK residency mandate.",
        sender: DEMO_ACCOUNTS.authority,
        recipient: DEMO_ACCOUNTS.alice,
        amount: "500",
        expected: "REVERT (R1-RESIDENCY)",
        regulatoryBasis: "UU P2SK Art. 34 & KSEI SID Requirement (WNI Retail Gate)",
      },
      2: {
        title: "Act II · Registrar Issues Residency Claim",
        rule: "R1 SATISFIED",
        narrative:
          "The Registrar authenticates Alice's National Identity (NIK) and grants RESIDENCY_ID. The exact same 500 KPON transfer now settles instantly.",
        sender: DEMO_ACCOUNTS.authority,
        recipient: DEMO_ACCOUNTS.alice,
        amount: "500",
        expected: "SETTLED (DvP Compliant)",
        regulatoryBasis: "POJK 3/2024 Sandbox Settlement & Instant Onchain DvP",
      },
      3: {
        title: "Act III · Statutory Retail Cap Enforced",
        rule: "R2-CAP",
        narrative:
          "Alice attempts to purchase 5,001 KPON (Rp5.001 Miliar). Because she is classified as Retail WNI (non-accredited), compliance blocks the tranche automatically.",
        sender: DEMO_ACCOUNTS.authority,
        recipient: DEMO_ACCOUNTS.alice,
        amount: "5001",
        expected: "REVERT (R2-CAP)",
        regulatoryBasis: "DJPPR Retail Investor Quota (Max Rp5 Miliar / Investor)",
      },
      4: {
        title: "Act IV · Emergency Freeze via Revocation",
        rule: "R3-FROZEN",
        narrative:
          "Regulatory authorities revoke Alice's claim due to legal sanctions. Her balance remains intact in custody, but all outward transfers are frozen onchain.",
        sender: DEMO_ACCOUNTS.alice,
        recipient: DEMO_ACCOUNTS.bob,
        amount: "100",
        expected: "REVERT (R3-FROZEN)",
        regulatoryBasis: "PPATK Sanction Order & Instant Sovereign Circuit Breaker",
      },
    }),
    [],
  );

  const currentAct = actDetails[activeAct];

  const handleApplyActPreset = (actNum: 1 | 2 | 3 | 4) => {
    setActiveAct(actNum);
    const act = actDetails[actNum];
    setSimSender(act.sender);
    setSimRecipient(act.recipient);
    setSimAmount(act.amount);
    runTransferSimulation(act.sender, act.recipient, act.amount);
  };

  // Quick authority actions to modify testnet state for the scenario
  const handleExecuteActOnchain = async () => {
    setIsExecutingLiveAct(true);
    try {
      if (activeAct === 1) {
        // Ensure Alice has NO claim
        await writeClaimRegistry({
          functionName: "revokeClaim",
          args: [DEMO_ACCOUNTS.alice, RESIDENCY_ID],
        });
        notification.success("Alice claim revoked onchain. Ready to simulate Act 1!");
      } else if (activeAct === 2) {
        // Grant Alice Residency claim
        await writeClaimRegistry({
          functionName: "grantClaim",
          args: [DEMO_ACCOUNTS.alice, RESIDENCY_ID],
        });
        notification.success("Alice granted RESIDENCY_ID onchain. Ready to simulate Act 2!");
      } else if (activeAct === 3) {
        // Ensure Alice has Residency (Retail)
        await writeClaimRegistry({
          functionName: "grantClaim",
          args: [DEMO_ACCOUNTS.alice, RESIDENCY_ID],
        });
        notification.success("Alice verified as Retail. Ready to simulate Act 3 cap!");
      } else if (activeAct === 4) {
        // Revoke Alice Residency to trigger Freeze
        await writeClaimRegistry({
          functionName: "revokeClaim",
          args: [DEMO_ACCOUNTS.alice, RESIDENCY_ID],
        });
        notification.success("Alice claim revoked onchain (Frozen). Ready to simulate Act 4!");
      }
      await refetchEvents();
      await runTransferSimulation(currentAct.sender, currentAct.recipient, currentAct.amount);
    } catch (err) {
      notification.error(getParsedError(err));
    } finally {
      setIsExecutingLiveAct(false);
    }
  };

  // Safe formatting
  const formattedSupply = totalSupply ? Number(formatEther(totalSupply)).toLocaleString("en-US") : "2,000";
  const formattedSeriesCap = seriesCap ? Number(formatEther(seriesCap)).toLocaleString("en-US") : "100,000";
  const formattedRetailCap = retailCap ? Number(formatEther(retailCap)).toLocaleString("en-US") : "5,000";

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EC] text-[#14201C] selection:bg-kupon-gold/30">
      {/* Sovereign Guilloche Watermark */}
      <div className="absolute left-0 top-20 pointer-events-none opacity-[0.03] overflow-hidden">
        <GuillochePattern variant="seal" width={650} height={650} color="emerald" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-20 relative z-10 flex flex-col gap-8">
        {/* ===================================================================== */}
        {/* HEADER: SOVEREIGN REGULATOR TERMINAL */}
        {/* ===================================================================== */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-kupon-gold/40 pb-6 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#F4EEDC] border border-kupon-gold/60 text-xs font-mono text-kupon-emerald mb-3">
              <ScaleIcon className="w-4 h-4 text-kupon-emerald" />
              <span>Oversight & Compliance Terminal</span>
              <span className="text-kupon-ink/40">·</span>
              <span className="font-semibold">OJK / DJPPR / KSEI</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-kupon-ink tracking-tight">
              Regulator Terminal
            </h1>
            <p className="text-sm sm:text-base text-kupon-ink/75 font-sans mt-2 max-w-2xl leading-relaxed">
              Supervise real-time bond compliance telemetry, simulate transfer validity via deterministic{" "}
              <code className="font-mono text-xs bg-base-200 px-1 py-0.5 rounded">eth_call</code> evaluations, and audit
              the 4-Act sovereign rule narrative.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#F3EEDB] px-4 py-3 rounded certificate-border-subtle text-xs font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-kupon-emerald animate-pulse" />
            <span className="text-kupon-ink font-semibold">Live Audit Node</span>
            <span className="text-kupon-ink/40">|</span>
            <span className="text-kupon-ink/70">Zero Gas Telemetry</span>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* TOP TELEMETRY STRIP */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#F8F3E5] p-4 rounded certificate-border-subtle">
            <span className="text-xs font-mono uppercase tracking-wider text-kupon-ink/65">R1 · Identity Gate</span>
            <div className="mt-1 text-lg font-serif font-bold text-kupon-emerald">RESIDENCY_ID</div>
            <p className="text-[11px] font-sans text-kupon-ink/65 mt-1 m-0">WNI Retail or Accredited required</p>
          </div>

          <div className="bg-[#F8F3E5] p-4 rounded certificate-border-subtle">
            <span className="text-xs font-mono uppercase tracking-wider text-kupon-ink/65">
              R2 · Retail Holding Cap
            </span>
            <div className="mt-1 text-lg font-serif font-bold text-kupon-ink">{formattedRetailCap} KPON</div>
            <p className="text-[11px] font-sans text-kupon-ink/65 mt-1 m-0">Statutory limit (Rp5 Miliar per wallet)</p>
          </div>

          <div className="bg-[#F8F3E5] p-4 rounded certificate-border-subtle">
            <span className="text-xs font-mono uppercase tracking-wider text-kupon-ink/65">R3 · Freeze Mechanism</span>
            <div className="mt-1 text-lg font-serif font-bold text-kupon-gold">Live Zero-Claim</div>
            <p className="text-[11px] font-sans text-kupon-ink/65 mt-1 m-0">
              Revocation instantly freezes outgoing transfers
            </p>
          </div>

          <div className="bg-[#F8F3E5] p-4 rounded certificate-border-subtle">
            <span className="text-xs font-mono uppercase tracking-wider text-kupon-ink/65">
              Series Quota Utilization
            </span>
            <div className="mt-1 text-lg font-serif font-bold text-kupon-emerald">
              {formattedSupply} / {formattedSeriesCap}
            </div>
            <p className="text-[11px] font-sans text-kupon-ink/65 mt-1 m-0">KPON Sovereign SBN Ritel 2027</p>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SECTION 1: INTERACTIVE 4-ACT DEMO CONTROLLER */}
        {/* ===================================================================== */}
        <div className="bg-[#FAF6EC] p-6 sm:p-8 rounded certificate-border flex flex-col gap-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-kupon-gold/30 pb-4 gap-2">
            <div className="flex items-center gap-2.5">
              <BoltIcon className="w-6 h-6 text-kupon-gold" />
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-kupon-ink m-0">
                Interactive 4-Act Compliance Narrative
              </h2>
            </div>
            <span className="text-xs font-mono text-kupon-emerald uppercase tracking-wider">
              Hackathon Demonstration Suite
            </span>
          </div>

          <p className="text-xs sm:text-sm text-kupon-ink/80 font-sans leading-relaxed m-0">
            Follow the complete institutional lifecycle of sovereign retail debt onchain. Each act isolates and
            exercises an explicit regulatory invariant without offchain dependencies.
          </p>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(actNum => {
              const act = actDetails[actNum as 1 | 2 | 3 | 4];
              const isSelected = activeAct === actNum;
              return (
                <button
                  key={actNum}
                  type="button"
                  onClick={() => handleApplyActPreset(actNum as 1 | 2 | 3 | 4)}
                  className={`p-3.5 rounded text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-[#F3EEDB] border-kupon-emerald shadow-sm ring-1 ring-kupon-emerald"
                      : "bg-[#FAF6EC] border-kupon-gold/30 hover:border-kupon-gold/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-kupon-gold">ACT {actNum}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        act.rule.includes("BLOCKED") || act.rule.includes("CAP") || act.rule.includes("FROZEN")
                          ? "bg-error/15 text-error"
                          : "bg-kupon-emerald/15 text-kupon-emerald"
                      }`}
                    >
                      {act.rule}
                    </span>
                  </div>
                  <span className="font-serif font-semibold text-xs sm:text-sm text-kupon-ink line-clamp-2">
                    {act.title.split("·")[1]?.trim() ?? act.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Act Focus Card */}
          <div className="bg-[#F8F3E5] p-6 rounded certificate-border-subtle flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-kupon-gold/30 pb-3">
              <div>
                <span className="text-xs font-mono text-kupon-gold uppercase tracking-wider">Active Scenario</span>
                <h3 className="text-lg sm:text-xl font-serif font-bold text-kupon-ink m-0 mt-0.5">
                  {currentAct.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-kupon-ink/65">Expected Result:</span>
                <span className="font-mono font-bold text-xs bg-[#FAF6EC] px-2.5 py-1 rounded border border-kupon-gold/50 text-kupon-ink">
                  {currentAct.expected}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-kupon-ink/80 font-sans leading-relaxed m-0">{currentAct.narrative}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono bg-[#FAF6EC] p-3.5 rounded border border-kupon-gold/30">
              <div>
                <span className="text-kupon-ink/60">Sender:</span>
                <div className="font-semibold text-kupon-ink truncate">
                  {currentAct.sender === DEMO_ACCOUNTS.authority ? "Deployer Authority" : "Alice (Retail)"}
                </div>
              </div>
              <div>
                <span className="text-kupon-ink/60">Recipient:</span>
                <div className="font-semibold text-kupon-ink truncate">
                  {currentAct.recipient === DEMO_ACCOUNTS.alice ? "Alice (Target)" : "Bob (External)"}
                </div>
              </div>
              <div>
                <span className="text-kupon-ink/60">Proposed Value:</span>
                <div className="font-semibold text-kupon-emerald">{currentAct.amount} KPON</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <div className="text-[11px] font-sans text-kupon-ink/65 flex items-center gap-1.5">
                <InformationCircleIcon className="w-4 h-4 text-kupon-gold shrink-0" />
                <span>Regulatory Grounding: {currentAct.regulatoryBasis}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {connectedAddress && (
                  <button
                    type="button"
                    onClick={handleExecuteActOnchain}
                    disabled={isExecutingLiveAct}
                    className="btn btn-xs btn-outline border-kupon-gold text-kupon-ink hover:bg-kupon-gold/20 font-sans"
                  >
                    {isExecutingLiveAct ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <ArrowPathIcon className="w-3.5 h-3.5" />
                    )}
                    <span>Sync Live Registry State</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => runTransferSimulation(currentAct.sender, currentAct.recipient, currentAct.amount)}
                  disabled={simulating}
                  className="btn btn-primary btn-sm font-sans font-medium text-kupon-ivory flex items-center gap-1.5 cursor-pointer"
                >
                  {simulating ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <PlayIcon className="w-4 h-4" />
                  )}
                  <span>Evaluate Act Simulation</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SECTION 2: SIMULATION CONTROLLER (eth_call ENGINE) */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Simulation Inputs */}
          <div className="lg:col-span-6 bg-[#FAF6EC] p-6 rounded certificate-border flex flex-col gap-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-kupon-gold/30 pb-3">
              <div className="flex items-center gap-2">
                <DocumentMagnifyingGlassIcon className="w-5 h-5 text-kupon-emerald" />
                <h3 className="text-lg font-serif font-bold text-kupon-ink m-0">Transfer Simulation Engine</h3>
              </div>
              <span className="text-xs font-mono text-kupon-gold uppercase">eth_call Sandbox</span>
            </div>

            <p className="text-xs text-kupon-ink/75 font-sans leading-relaxed m-0">
              Directly query <code className="font-mono text-xs">KuponComplianceModule.enforceTransfer()</code> against
              live onchain state. Test arbitrary wallet pairs without gas expenditure or state mutations.
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-mono font-medium text-kupon-ink mb-1 block">Sender Address (From)</label>
                <AddressInput value={simSender} onChange={setSimSender} placeholder="0x... Sender" />
              </div>

              <div>
                <label className="text-xs font-mono font-medium text-kupon-ink mb-1 block">
                  Recipient Address (To)
                </label>
                <AddressInput value={simRecipient} onChange={setSimRecipient} placeholder="0x... Recipient" />
              </div>

              <div>
                <label className="text-xs font-mono font-medium text-kupon-ink mb-1 block">
                  Transfer Amount (KPON)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={simAmount}
                  onChange={e => setSimAmount(e.target.value)}
                  placeholder="e.g. 1000"
                  className="input input-bordered w-full font-mono text-sm bg-[#F8F3E5] border-kupon-gold/40 text-kupon-ink focus:border-kupon-emerald focus:outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => runTransferSimulation(simSender, simRecipient, simAmount)}
              disabled={simulating || !simSenderValid || !simRecipientValid}
              className="btn btn-primary font-sans font-medium text-kupon-ivory flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {simulating ? <span className="loading loading-spinner loading-xs" /> : <EyeIcon className="w-4 h-4" />}
              <span>Simulate Onchain Transfer (0 Gas)</span>
            </button>
          </div>

          {/* Right Column: Simulation Telemetry Verdict */}
          <div className="lg:col-span-6 bg-[#FAF6EC] p-6 rounded certificate-border flex flex-col gap-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-kupon-gold/30 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-kupon-gold" />
                <h3 className="text-lg font-serif font-bold text-kupon-ink m-0">Deterministic Verdict</h3>
              </div>
              <span className="text-xs font-mono text-kupon-emerald uppercase">Live Audit Result</span>
            </div>

            {simulationResult ? (
              <div className="flex flex-col gap-4">
                {/* Status Banner */}
                <div
                  className={`p-4 rounded border flex items-start gap-3 ${
                    simulationResult.compliant
                      ? "bg-[#EEF7F2] border-kupon-emerald text-kupon-emerald"
                      : "bg-[#FDF2F1] border-error text-error"
                  }`}
                >
                  {simulationResult.compliant ? (
                    <CheckCircleIcon className="w-6 h-6 text-kupon-emerald shrink-0 mt-0.5" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-error shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-serif font-bold text-base">
                      {simulationResult.compliant ? "TRANSFER PERMITTED (DvP CLEAR)" : "TRANSFER BLOCKED ONCHAIN"}
                    </div>
                    <p className="text-xs font-sans leading-relaxed m-0 text-kupon-ink/80">
                      {simulationResult.policyExplanation}
                    </p>
                  </div>
                </div>

                {/* Identity & Rule Matrix */}
                <div className="bg-[#F8F3E5] p-4 rounded certificate-border-subtle flex flex-col gap-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-kupon-ink/65 border-b border-kupon-gold/20 pb-1.5">
                    <span>Audit Invariant</span>
                    <span>Evaluation Result</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-kupon-ink/80">R1 · Recipient KYC / SID</span>
                    <span
                      className={`badge badge-sm font-mono ${
                        simulationResult.recipientClaims.residency || simulationResult.recipientClaims.accredited
                          ? "bg-kupon-emerald text-kupon-ivory"
                          : "bg-error text-white"
                      }`}
                    >
                      {simulationResult.recipientClaims.residency || simulationResult.recipientClaims.accredited
                        ? "VERIFIED (PASS)"
                        : "NO CLAIM (REVERT)"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-kupon-ink/80">R2 · Retail 5,000 KPON Cap</span>
                    <span
                      className={`badge badge-sm font-mono ${
                        simulationResult.violatedRule === "R2-CAP"
                          ? "bg-error text-white"
                          : "bg-kupon-emerald text-kupon-ivory"
                      }`}
                    >
                      {simulationResult.violatedRule === "R2-CAP" ? "CAP BREACHED (REVERT)" : "WITHIN CAP (PASS)"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-kupon-ink/80">R3 · Sender Non-Frozen</span>
                    <span
                      className={`badge badge-sm font-mono ${
                        simulationResult.violatedRule === "R3-FROZEN"
                          ? "bg-error text-white"
                          : "bg-kupon-emerald text-kupon-ivory"
                      }`}
                    >
                      {simulationResult.violatedRule === "R3-FROZEN" ? "FROZEN (REVERT)" : "ACTIVE (PASS)"}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-kupon-gold/20 flex items-center justify-between text-[11px]">
                    <span className="text-kupon-ink/60">Recipient Holdings (Post-Transfer):</span>
                    <span className="font-semibold text-kupon-ink">
                      {formatEther(simulationResult.projectedBalance)} KPON
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 rounded bg-[#F8F3E5] border border-dashed border-kupon-gold/40 text-center text-xs font-sans text-kupon-ink/65 flex flex-col items-center justify-center gap-2">
                <DocumentMagnifyingGlassIcon className="w-8 h-8 text-kupon-gold/60" />
                <p className="m-0">Run a simulation from the left panel or click any 4-Act scenario above.</p>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SECTION 3: LIVE AUDIT FEED (CLAIM EVENTS ONCHAIN) */}
        {/* ===================================================================== */}
        <div className="bg-[#FAF6EC] p-6 sm:p-8 rounded certificate-border flex flex-col gap-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-kupon-gold/30 pb-4 gap-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-kupon-ink m-0">
                Live Registry Event Stream
              </h2>
              <p className="text-xs sm:text-sm text-kupon-ink/75 font-sans m-0 mt-1">
                Real-time onchain log of identity certifications and emergency revocations from KuponClaimRegistry.
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetchEvents()}
              className="btn btn-xs btn-outline border-kupon-gold text-kupon-ink hover:bg-kupon-gold/20 font-sans self-start sm:self-auto"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              <span>Refresh Feed</span>
            </button>
          </div>

          {isLoadingEvents ? (
            <div className="p-8 text-center text-xs font-mono text-kupon-ink/60 flex items-center justify-center gap-2">
              <span className="loading loading-spinner loading-xs" />
              <span>Indexing onchain registry events...</span>
            </div>
          ) : auditEvents && auditEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-sm w-full font-sans text-xs">
                <thead>
                  <tr className="border-b border-kupon-gold/30 text-kupon-ink/65 font-mono text-[11px] uppercase tracking-wider">
                    <th className="bg-transparent">Event</th>
                    <th className="bg-transparent">Investor Account</th>
                    <th className="bg-transparent">Claim Identity</th>
                    <th className="bg-transparent">Block</th>
                    <th className="bg-transparent">Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {auditEvents.slice(0, 10).map((log, idx) => {
                    const isGrant = log.type === "GRANTED";
                    const claimName =
                      log.claim === RESIDENCY_ID
                        ? "RESIDENCY_ID (WNI)"
                        : log.claim === ACCREDITED
                          ? "ACCREDITED (Institutional)"
                          : "UNKNOWN_CLAIM";

                    return (
                      <tr
                        key={`${log.transactionHash}-${log.logIndex}-${idx}`}
                        className="border-b border-kupon-gold/15 hover:bg-base-200/50"
                      >
                        <td>
                          <span
                            className={`badge badge-sm font-mono ${
                              isGrant ? "bg-kupon-emerald text-kupon-ivory" : "bg-error text-white"
                            }`}
                          >
                            {isGrant ? "CLAIM_GRANTED" : "CLAIM_REVOKED"}
                          </span>
                        </td>
                        <td>
                          <Address address={log.account} size="xs" />
                        </td>
                        <td className="font-mono text-[11px] font-medium text-kupon-ink">{claimName}</td>
                        <td className="font-mono text-kupon-ink/70">#{log.blockNumber.toString()}</td>
                        <td className="font-mono text-kupon-emerald truncate max-w-[120px]">
                          <a
                            href={`https://sepolia.basescan.org/tx/${log.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {log.transactionHash.slice(0, 8)}…{log.transactionHash.slice(-6)}
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 rounded bg-[#F8F3E5] border border-dashed border-kupon-gold/40 text-center text-xs font-sans text-kupon-ink/60">
              No claim modification events detected on this network yet. Use the Registrar Portal to issue the first
              investor claim.
            </div>
          )}
        </div>

        {/* ===================================================================== */}
        {/* FOOTER & LINKS */}
        {/* ===================================================================== */}
        <div className="flex flex-wrap items-center justify-between border-t border-kupon-gold/30 pt-6 text-xs text-kupon-ink/70 font-sans gap-4">
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-kupon-emerald hover:underline font-medium">
              ← Investor Application
            </Link>
            <span>·</span>
            <Link href="/registrar" className="text-kupon-gold hover:underline font-medium">
              Registrar Certification Portal →
            </Link>
            <span>·</span>
            <Link href="/framework" className="text-kupon-ink hover:underline font-medium">
              Regulatory Framework (UU P2SK) →
            </Link>
          </div>
          <div className="font-mono text-[11px] text-kupon-ink/60">
            Compliance Engine: <code className="text-kupon-emerald">KuponComplianceModule.sol</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegulatorPage;
