"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Address, AddressInput } from "@scaffold-ui/components";
import { useQuery } from "@tanstack/react-query";
import type { NextPage } from "next";
import { formatEther, isAddress, keccak256, parseEther, toHex } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  DocumentMagnifyingGlassIcon,
  EyeIcon,
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
  R1: keccak256(toHex("R1-RESIDENCY")).toLowerCase(),
  R2: keccak256(toHex("R2-CAP")).toLowerCase(),
  R3: keccak256(toHex("R3-FROZEN")).toLowerCase(),
} as const;

// Standard demo EOA addresses for the 4-act scenario
const DEMO_ACCOUNTS = {
  authority: "0x2b97bea17da0ff83fd95a73dc60881d5b27a2b9b",
  alice: "0x1111111111111111111111111111111111111111", // Verified WNI Retail Investor (holds RESIDENCY_ID)
  bob: "0x2222222222222222222222222222222222222222", // Unregistered Foreign Investor (zero claims)
} as const;

type ViemErrorLike = {
  data?: unknown;
  cause?: unknown;
  error?: unknown;
  args?: readonly unknown[];
  errorName?: string;
  walk?: () => unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  return null;
}

/**
 * Robust extraction of the Kupon__RuleViolated bytes32 rule identifier across viem error formats.
 */
function extractRuleViolatedId(error: unknown): string | null {
  if (!error) return null;

  let current: unknown = error;
  for (let depth = 0; depth < 8; depth++) {
    const node = asRecord(current) as ViemErrorLike | null;
    if (!node) break;

    // Check direct errorName
    if (node.errorName === "Kupon__RuleViolated" && Array.isArray(node.args) && typeof node.args[0] === "string") {
      return node.args[0].toLowerCase();
    }

    // Check node.data
    const dataObj = asRecord(node.data);
    if (
      dataObj &&
      dataObj.errorName === "Kupon__RuleViolated" &&
      Array.isArray(dataObj.args) &&
      typeof dataObj.args[0] === "string"
    ) {
      return dataObj.args[0].toLowerCase();
    }

    // Check node.cause
    const causeObj = asRecord(node.cause);
    if (causeObj) {
      if (
        causeObj.errorName === "Kupon__RuleViolated" &&
        Array.isArray(causeObj.args) &&
        typeof causeObj.args[0] === "string"
      ) {
        return causeObj.args[0].toLowerCase();
      }
      const causeDataObj = asRecord(causeObj.data);
      if (
        causeDataObj &&
        causeDataObj.errorName === "Kupon__RuleViolated" &&
        Array.isArray(causeDataObj.args) &&
        typeof causeDataObj.args[0] === "string"
      ) {
        return causeDataObj.args[0].toLowerCase();
      }
    }

    // Check raw error selector hex (0x6363af99 = Kupon__RuleViolated(bytes32))
    const hexCandidate =
      typeof node.data === "string" ? node.data : typeof causeObj?.data === "string" ? (causeObj.data as string) : null;
    if (hexCandidate && hexCandidate.startsWith("0x6363af99") && hexCandidate.length >= 74) {
      return `0x${hexCandidate.slice(10, 74)}`.toLowerCase();
    }

    const next =
      node.cause ?? node.error ?? (typeof node.walk === "function" ? (node.walk as () => unknown)() : undefined);
    if (next === undefined || next === current) break;
    current = next;
  }

  // Fallback regex over stringified representations
  const errorText = typeof error === "string" ? error : getParsedError(error);
  const match = errorText.match(/Kupon__RuleViolated\(0x([0-9a-fA-F]{64})\)/i);
  if (match) return `0x${match[1]}`.toLowerCase();

  const hexMatch = errorText.match(/0x6363af99([0-9a-fA-F]{64})/i);
  if (hexMatch) return `0x${hexMatch[1]}`.toLowerCase();

  return null;
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
  const [simRecipient, setSimRecipient] = useState<string>(DEMO_ACCOUNTS.bob);
  const [simAmount, setSimAmount] = useState<string>("500");
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const simSenderValid = isAddress(simSender);
  const simRecipientValid = isAddress(simRecipient);

  const runTransferSimulation = useCallback(
    async (sender: string, recipient: string, amountStr: string) => {
      if (!publicClient || !complianceInfo?.address || !complianceInfo?.abi || !registryInfo?.abi || !tokenInfo?.abi) {
        notification.error("Contract interfaces loading. Please retry in a moment.");
        return;
      }

      if (!isAddress(sender) || !isAddress(recipient)) {
        notification.error("Please provide valid sender and recipient addresses.");
        return;
      }

      let parsedVal: bigint;
      try {
        parsedVal = parseEther(amountStr);
      } catch {
        notification.error("Invalid amount input. Enter a valid decimal value.");
        return;
      }

      setSimulating(true);

      try {
        // 1. Fetch current onchain states for context
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
          "Compliant: Transfer satisfies residency credentialing, per-wallet retail holding cap, and non-frozen sender criteria.";

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
              "Blocked by Rule R3-FROZEN: Sender holds zero active identity claims. Under the sovereign circuit breaker invariant, the account is frozen from transmitting bond holdings.";
          } else if (
            ruleId === RULE_KEYS.R2 ||
            (recResidency && !recAccredited && recBalance + parsedVal > (retailCap ?? 5000n * 10n ** 18n))
          ) {
            violatedRule = "R2-CAP";
            policyExplanation =
              "Blocked by Rule R2-CAP: Recipient is a retail investor and the proposed transfer causes total holdings to exceed the statutory 5,000 KPON (Rp5 Billion) cap.";
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
    },
    [complianceInfo, registryInfo, tokenInfo, publicClient, retailCap],
  );

  // ---------------------------------------------------------------------------
  // 3. 4-ACT COMPLIANCE SCENARIOS
  // ---------------------------------------------------------------------------
  const [activeAct, setActiveAct] = useState<1 | 2 | 3 | 4>(1);
  const [isExecutingLiveAct, setIsExecutingLiveAct] = useState<boolean>(false);

  const actDetails = useMemo(
    () => ({
      1: {
        title: "Act I · Non-WNI Foreign Transfer Blocked",
        rule: "R1-RESIDENCY",
        badgeText: "REVERT (R1)",
        summary:
          "Uncertified foreign investor (Bob) attempts to receive bonds. Reverts deterministically under UU P2SK mandate.",
        sender: DEMO_ACCOUNTS.authority,
        senderLabel: "Deployer Treasury",
        recipient: DEMO_ACCOUNTS.bob,
        recipientLabel: "Bob (Foreign / Unregistered)",
        amount: "500",
        expected: "REVERT (R1-RESIDENCY)",
        regulatoryBasis: "UU P2SK Art. 34 & KSEI SID Mandate",
      },
      2: {
        title: "Act II · Verified Retail Citizen DvP Transfer",
        rule: "R1 SATISFIED",
        badgeText: "SETTLED (DvP)",
        summary:
          "Alice verified with RESIDENCY_ID. The 500 KPON transfer settles instantly under POJK 3/2024 standards.",
        sender: DEMO_ACCOUNTS.authority,
        senderLabel: "Deployer Treasury",
        recipient: DEMO_ACCOUNTS.alice,
        recipientLabel: "Alice (Verified WNI Retail)",
        amount: "500",
        expected: "SETTLED (DvP Compliant)",
        regulatoryBasis: "POJK 3/2024 Sandbox Settlement & Onchain DvP",
      },
      3: {
        title: "Act III · Statutory Retail Holding Cap Enforced",
        rule: "R2-CAP",
        badgeText: "REVERT (R2)",
        summary:
          "Alice attempts to acquire 5,000 KPON (Rp5B), exceeding the 5,000 KPON retail ceiling. Automatically halted.",
        sender: DEMO_ACCOUNTS.authority,
        senderLabel: "Deployer Treasury",
        recipient: DEMO_ACCOUNTS.alice,
        recipientLabel: "Alice (Verified WNI Retail)",
        amount: "5000",
        expected: "REVERT (R2-CAP)",
        regulatoryBasis: "DJPPR Retail Investor Quota (Max Rp5 Billion)",
      },
      4: {
        title: "Act IV · Emergency Freeze via Revocation",
        rule: "R3-FROZEN",
        badgeText: "REVERT (R3)",
        summary:
          "Sender holds zero active identity claims. The circuit breaker invariant halts all outgoing transfers instantly.",
        sender: DEMO_ACCOUNTS.bob,
        senderLabel: "Bob (Sanctioned / Zero-Claim)",
        recipient: DEMO_ACCOUNTS.alice,
        recipientLabel: "Alice (Target Wallet)",
        amount: "100",
        expected: "REVERT (R3-FROZEN)",
        regulatoryBasis: "PPATK Sanctions & Sovereign Freeze (Zero-Claim)",
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

  // Run initial simulation on load once contracts are connected
  const hasRunInitialSim = useRef(false);
  useEffect(() => {
    if (
      publicClient &&
      complianceInfo?.address &&
      registryInfo?.address &&
      tokenInfo?.address &&
      !hasRunInitialSim.current
    ) {
      hasRunInitialSim.current = true;
      const act = actDetails[1];
      runTransferSimulation(act.sender, act.recipient, act.amount);
    }
  }, [
    publicClient,
    complianceInfo?.address,
    registryInfo?.address,
    tokenInfo?.address,
    actDetails,
    runTransferSimulation,
  ]);

  // Quick authority actions to modify testnet state for the scenario
  const handleExecuteActOnchain = async () => {
    setIsExecutingLiveAct(true);
    try {
      if (activeAct === 1) {
        await writeClaimRegistry({
          functionName: "revokeClaim",
          args: [DEMO_ACCOUNTS.alice, RESIDENCY_ID],
        });
        notification.success("Alice residency claim revoked onchain.");
      } else if (activeAct === 2) {
        await writeClaimRegistry({
          functionName: "grantClaim",
          args: [DEMO_ACCOUNTS.alice, RESIDENCY_ID],
        });
        notification.success("Alice granted RESIDENCY_ID onchain.");
      } else if (activeAct === 3) {
        await writeClaimRegistry({
          functionName: "grantClaim",
          args: [DEMO_ACCOUNTS.alice, RESIDENCY_ID],
        });
        notification.success("Alice confirmed as Retail WNI.");
      } else if (activeAct === 4) {
        await writeClaimRegistry({
          functionName: "revokeClaim",
          args: [DEMO_ACCOUNTS.alice, RESIDENCY_ID],
        });
        notification.success("Alice claim revoked onchain (Frozen).");
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

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-20 relative z-10 flex flex-col gap-6">
        {/* ===================================================================== */}
        {/* HEADER */}
        {/* ===================================================================== */}
        <header className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-kupon-gold/30 pb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-kupon-ink tracking-tight m-0">
                Regulator & Compliance Terminal
              </h1>
              <p className="text-xs sm:text-sm text-kupon-ink/75 font-sans mt-1 m-0">
                Real-time sovereign debt compliance telemetry and zero-gas deterministic policy evaluations under OJK &
                DJPPR rules.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 bg-[#F4EEDC] px-3 py-1.5 rounded-full text-xs font-mono border border-kupon-gold/30 self-start sm:self-auto shrink-0">
              <span className="w-2 h-2 rounded-full bg-kupon-emerald animate-pulse" />
              <span className="text-kupon-ink font-semibold">Live Audit Node</span>
              <span className="text-kupon-ink/30">·</span>
              <span className="text-kupon-ink/70 font-sans">0-Gas Telemetry</span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* TOP TELEMETRY BAR: COMPACT DISTILLED VALUES (NO GIANT NUMBERS) */}
          {/* ===================================================================== */}
          <div className="bg-[#F8F3E5] px-5 py-4 rounded-xl border border-kupon-gold/30 flex flex-col gap-3 shadow-xs">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Metric 1 */}
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono text-kupon-ink/50 uppercase tracking-wider block">
                  Identity Gate (R1)
                </span>
                <div className="text-sm font-mono font-bold text-kupon-emerald">RESIDENCY_ID</div>
                <span className="text-xs text-kupon-ink/65 font-sans block">KSEI SID verified (WNI)</span>
              </div>

              {/* Metric 2 */}
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono text-kupon-ink/50 uppercase tracking-wider block">
                  Retail Cap (R2)
                </span>
                <div className="text-sm font-mono font-bold text-kupon-ink">{formattedRetailCap} KPON</div>
                <span className="text-xs text-kupon-ink/65 font-sans block">Max Rp5B per retail wallet</span>
              </div>

              {/* Metric 3 */}
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono text-kupon-ink/50 uppercase tracking-wider block">
                  Freeze Rule (R3)
                </span>
                <div className="text-sm font-mono font-bold text-kupon-ink">Zero-Claim Invariant</div>
                <span className="text-xs text-kupon-ink/65 font-sans block">PPATK circuit breaker</span>
              </div>

              {/* Metric 4 */}
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono text-kupon-ink/50 uppercase tracking-wider block">
                  Active Issuance
                </span>
                <div className="text-sm font-mono font-bold text-kupon-emerald">
                  {formattedSupply} / {formattedSeriesCap} KPON
                </div>
                <span className="text-xs text-kupon-ink/65 font-sans block">Series ORI026-T3 Benchmark</span>
              </div>
            </div>

            <div className="pt-2 border-t border-kupon-gold/20 flex items-center justify-between text-[11px] text-kupon-ink/60 font-sans">
              <span>
                Compliance Engine: <code className="font-mono text-kupon-ink">KuponComplianceModule.sol</code> validates
                all 3 invariants before state mutation.
              </span>
              <span className="font-mono text-kupon-emerald hidden sm:inline">ERC-3643 Modular Compliance</span>
            </div>
          </div>
        </header>

        {/* ===================================================================== */}
        {/* UNIFIED COMPLIANCE WORKBENCH (5 : 7 RATIO) */}
        {/* ===================================================================== */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ----------------------------------------------------------------- */}
          {/* LEFT COLUMN: SCENARIOS & SIMULATION PARAMETERS (5 COLS) */}
          {/* ----------------------------------------------------------------- */}
          <section className="lg:col-span-5 bg-[#F8F3E5] p-5 sm:p-6 rounded-xl border border-kupon-gold/30 flex flex-col gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-serif font-bold text-kupon-ink m-0">Policy Scenarios & Parameters</h2>
                <span className="text-[10px] font-mono text-kupon-gold uppercase bg-kupon-gold/10 px-1.5 py-0.5 rounded border border-kupon-gold/20">
                  0-Gas Sandbox
                </span>
              </div>
              <p className="text-xs text-kupon-ink/70 font-sans m-0">
                Select a statutory scenario preset or enter arbitrary addresses to test compliance enforcement.
              </p>
            </div>

            {/* 4-Act Scenario Tabs */}
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map(actNum => {
                const act = actDetails[actNum as 1 | 2 | 3 | 4];
                const isSelected = activeAct === actNum;
                const isRevert = act.badgeText.includes("REVERT");
                return (
                  <button
                    key={actNum}
                    type="button"
                    onClick={() => handleApplyActPreset(actNum as 1 | 2 | 3 | 4)}
                    className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? "bg-[#FAF6EC] border-kupon-emerald ring-1 ring-kupon-emerald"
                        : "bg-[#FAF6EC]/60 border-kupon-gold/25 hover:border-kupon-gold/50"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-kupon-gold">ACT {actNum}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                          isRevert ? "bg-error/10 text-error" : "bg-kupon-emerald/10 text-kupon-emerald"
                        }`}
                      >
                        {act.badgeText}
                      </span>
                    </div>
                    <span className="font-sans font-medium text-xs text-kupon-ink truncate">
                      {act.title.split("·")[1]?.trim() ?? act.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Scenario Summary Note */}
            <div className="bg-[#FAF6EC] p-3 rounded-lg border border-kupon-gold/20 text-xs font-sans text-kupon-ink/75 leading-relaxed">
              <span className="font-semibold text-kupon-ink block mb-0.5">{currentAct.title}</span>
              {currentAct.summary}
            </div>

            {/* Parameter Inputs */}
            <div className="flex flex-col gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono font-medium text-kupon-ink">Sender (From)</label>
                  <button
                    type="button"
                    onClick={() => setSimSender(DEMO_ACCOUNTS.authority)}
                    className="text-[10px] font-mono text-kupon-emerald hover:underline"
                  >
                    Use Authority
                  </button>
                </div>
                <AddressInput value={simSender} onChange={setSimSender} placeholder="0x... Sender Address" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono font-medium text-kupon-ink">Recipient (To)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSimRecipient(DEMO_ACCOUNTS.alice)}
                      className="text-[10px] font-mono text-kupon-emerald hover:underline"
                    >
                      Alice (WNI)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimRecipient(DEMO_ACCOUNTS.bob)}
                      className="text-[10px] font-mono text-kupon-emerald hover:underline"
                    >
                      Bob (Foreign)
                    </button>
                  </div>
                </div>
                <AddressInput value={simRecipient} onChange={setSimRecipient} placeholder="0x... Recipient Address" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-mono font-medium text-kupon-ink">Amount (KPON)</label>
                  <span className="text-[11px] font-sans text-kupon-ink/50">
                    Rp{(Number(simAmount || 0) * 1_000_000).toLocaleString("id-ID")}
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={simAmount}
                  onChange={e => setSimAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="input input-bordered w-full font-mono text-xs bg-[#FAF6EC] border-kupon-gold/40 text-kupon-ink focus:border-kupon-emerald focus:outline-none h-9"
                />
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] font-mono text-kupon-ink/40">Presets:</span>
                  {["500", "1000", "5000", "5001"].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setSimAmount(amt)}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        simAmount === amt
                          ? "bg-kupon-emerald/15 border-kupon-emerald text-kupon-emerald font-bold"
                          : "bg-[#FAF6EC] border-kupon-gold/30 text-kupon-ink/65 hover:border-kupon-gold"
                      }`}
                    >
                      {amt === "5001" ? "5,001 (Breach)" : `${amt}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => runTransferSimulation(simSender, simRecipient, simAmount)}
                disabled={simulating || !simSenderValid || !simRecipientValid}
                className="btn btn-primary btn-sm font-sans font-medium text-kupon-ivory flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {simulating ? <span className="loading loading-spinner loading-xs" /> : <EyeIcon className="w-4 h-4" />}
                <span>Evaluate Policy (0 Gas)</span>
              </button>

              {connectedAddress && (
                <button
                  type="button"
                  onClick={handleExecuteActOnchain}
                  disabled={isExecutingLiveAct}
                  className="btn btn-xs btn-outline border-kupon-gold/50 text-kupon-ink/75 hover:bg-kupon-gold/15 font-sans"
                >
                  {isExecutingLiveAct ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <ArrowPathIcon className="w-3 h-3" />
                  )}
                  <span>Sync Act Onchain (Authority Override)</span>
                </button>
              )}
            </div>
          </section>

          {/* ----------------------------------------------------------------- */}
          {/* RIGHT COLUMN: DETERMINISTIC POLICY VERDICT & PROOF (7 COLS) */}
          {/* ----------------------------------------------------------------- */}
          <section className="lg:col-span-7 bg-[#F8F3E5] p-5 sm:p-6 rounded-xl border border-kupon-gold/30 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-kupon-gold/25 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-kupon-gold shrink-0" />
                <h2 className="text-base font-serif font-bold text-kupon-ink m-0">Deterministic Policy Verdict</h2>
              </div>
              <span className="text-[10px] font-mono text-kupon-emerald uppercase bg-kupon-emerald/10 px-2 py-0.5 rounded border border-kupon-emerald/20">
                Live Proof
              </span>
            </div>

            {simulationResult ? (
              <div className="flex flex-col gap-4">
                {/* Status Banner */}
                <div
                  className={`p-3.5 rounded-lg border flex items-start gap-3 ${
                    simulationResult.compliant
                      ? "bg-[#EEF7F2] border-kupon-emerald/40 text-kupon-emerald"
                      : "bg-[#FDF2F1] border-error/40 text-error"
                  }`}
                >
                  {simulationResult.compliant ? (
                    <CheckCircleIcon className="w-5 h-5 text-kupon-emerald shrink-0 mt-0.5" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-error shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <div className="font-serif font-bold text-sm tracking-tight">
                      {simulationResult.compliant
                        ? "TRANSFER PERMITTED · DVP CLEAR"
                        : `TRANSFER BLOCKED ONCHAIN · ${simulationResult.violatedRule ?? "REVERTED"}`}
                    </div>
                    <p className="text-xs font-sans leading-relaxed m-0 text-kupon-ink/80">
                      {simulationResult.policyExplanation}
                    </p>
                  </div>
                </div>

                {/* 3-Tier Invariant Check Matrix */}
                <div className="bg-[#FAF6EC] p-4 rounded-lg border border-kupon-gold/30 flex flex-col gap-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-kupon-ink/50 border-b border-kupon-gold/15 pb-1.5 text-[10px] uppercase tracking-wider">
                    <span>Regulatory Invariant</span>
                    <span>Evaluation Result</span>
                  </div>

                  {/* R1 Check */}
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <span className="text-kupon-ink font-semibold block">R1 · Recipient KYC / KSEI SID</span>
                      <span className="text-[11px] font-sans text-kupon-ink/55">
                        Indonesian residency or accreditation
                      </span>
                    </div>
                    <span
                      className={`badge badge-sm font-mono font-semibold ${
                        simulationResult.recipientClaims.residency || simulationResult.recipientClaims.accredited
                          ? "bg-kupon-emerald text-kupon-ivory"
                          : "bg-error text-white"
                      }`}
                    >
                      {simulationResult.recipientClaims.residency || simulationResult.recipientClaims.accredited
                        ? "VERIFIED (PASS)"
                        : "NO CLAIM (REVERT R1)"}
                    </span>
                  </div>

                  {/* R2 Check */}
                  <div className="flex items-center justify-between py-1 border-t border-kupon-gold/15 pt-2">
                    <div>
                      <span className="text-kupon-ink font-semibold block">R2 · Retail 5,000 KPON Cap</span>
                      <span className="text-[11px] font-sans text-kupon-ink/55">Max Rp5B retail holding quota</span>
                    </div>
                    <span
                      className={`badge badge-sm font-mono font-semibold ${
                        simulationResult.violatedRule === "R2-CAP"
                          ? "bg-error text-white"
                          : "bg-kupon-emerald text-kupon-ivory"
                      }`}
                    >
                      {simulationResult.violatedRule === "R2-CAP" ? "CAP BREACHED (REVERT R2)" : "WITHIN CAP (PASS)"}
                    </span>
                  </div>

                  {/* R3 Check */}
                  <div className="flex items-center justify-between py-1 border-t border-kupon-gold/15 pt-2">
                    <div>
                      <span className="text-kupon-ink font-semibold block">R3 · Sender Non-Frozen Status</span>
                      <span className="text-[11px] font-sans text-kupon-ink/55">
                        Sender holds active identity claims
                      </span>
                    </div>
                    <span
                      className={`badge badge-sm font-mono font-semibold ${
                        simulationResult.violatedRule === "R3-FROZEN"
                          ? "bg-error text-white"
                          : "bg-kupon-emerald text-kupon-ivory"
                      }`}
                    >
                      {simulationResult.violatedRule === "R3-FROZEN" ? "FROZEN (REVERT R3)" : "ACTIVE (PASS)"}
                    </span>
                  </div>

                  {/* Telemetry Summary */}
                  <div className="pt-2 border-t border-kupon-gold/20 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <span className="text-kupon-ink/60">Recipient Post-Transfer Balance:</span>
                    <span className="font-semibold text-kupon-ink font-mono">
                      {formatEther(simulationResult.projectedBalance)} KPON{" "}
                      <span className="text-kupon-ink/50 font-normal">
                        (Rp
                        {(Number(formatEther(simulationResult.projectedBalance)) * 1_000_000).toLocaleString("id-ID")})
                      </span>
                    </span>
                  </div>
                </div>

                {/* Statutory Basis Card */}
                <div className="flex items-center gap-2 text-xs font-sans text-kupon-ink/70 pt-1">
                  <ScaleIcon className="w-4 h-4 text-kupon-gold shrink-0" />
                  <span>
                    <strong>Statutory Authority:</strong> {currentAct.regulatoryBasis}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-lg bg-[#FAF6EC] border border-dashed border-kupon-gold/40 text-center text-xs font-sans text-kupon-ink/60 flex flex-col items-center justify-center gap-2">
                <DocumentMagnifyingGlassIcon className="w-6 h-6 text-kupon-gold/60" />
                <p className="m-0 font-medium text-kupon-ink/70">Awaiting Simulation</p>
                <p className="m-0 text-kupon-ink/50">
                  Select any scenario from the left panel or enter custom parameters.
                </p>
              </div>
            )}
          </section>
        </main>

        {/* ===================================================================== */}
        {/* SECTION 3: LIVE AUDIT TRAIL STREAM */}
        {/* ===================================================================== */}
        <section className="bg-[#F8F3E5] p-5 sm:p-6 rounded-xl border border-kupon-gold/30 flex flex-col gap-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-kupon-gold/25 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <ClipboardDocumentListIcon className="w-5 h-5 text-kupon-emerald shrink-0" />
              <div>
                <h2 className="text-base font-serif font-bold text-kupon-ink m-0">Live Regulatory Audit Trail</h2>
                <p className="text-xs text-kupon-ink/70 font-sans m-0 mt-0.5">
                  Onchain log of investor identity certifications and revocations emitted by KuponClaimRegistry.sol.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => refetchEvents()}
              className="btn btn-xs btn-outline border-kupon-gold/50 text-kupon-ink/80 hover:bg-kupon-gold/15 font-sans self-start sm:self-auto flex items-center gap-1.5"
            >
              <ArrowPathIcon className="w-3 h-3" />
              <span>Refresh Feed</span>
            </button>
          </div>

          {isLoadingEvents ? (
            <div className="p-6 text-center text-xs font-mono text-kupon-ink/60 flex items-center justify-center gap-2">
              <span className="loading loading-spinner loading-xs" />
              <span>Indexing registry events from Base Sepolia...</span>
            </div>
          ) : auditEvents && auditEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table table-xs w-full font-sans text-xs">
                <thead>
                  <tr className="border-b border-kupon-gold/20 text-kupon-ink/55 font-mono text-[10px] uppercase tracking-wider">
                    <th className="bg-transparent">Event</th>
                    <th className="bg-transparent">Investor Account</th>
                    <th className="bg-transparent">Claim Identity</th>
                    <th className="bg-transparent">Block</th>
                    <th className="bg-transparent">Transaction Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {auditEvents.slice(0, 8).map((log, idx) => {
                    const isGrant = log.type === "GRANTED";
                    const claimName =
                      log.claim.toLowerCase() === RESIDENCY_ID.toLowerCase()
                        ? "RESIDENCY_ID (Indonesian Citizen)"
                        : log.claim.toLowerCase() === ACCREDITED.toLowerCase()
                          ? "ACCREDITED (Institutional)"
                          : "UNKNOWN_CLAIM";

                    return (
                      <tr
                        key={`${log.transactionHash}-${log.logIndex}-${idx}`}
                        className="border-b border-kupon-gold/15 hover:bg-[#FAF6EC]/80 transition-colors"
                      >
                        <td>
                          <span
                            className={`badge badge-xs font-mono font-semibold ${
                              isGrant
                                ? "bg-kupon-emerald/15 text-kupon-emerald border border-kupon-emerald/30"
                                : "bg-error/15 text-error border border-error/30"
                            }`}
                          >
                            {isGrant ? "CLAIM_GRANTED" : "CLAIM_REVOKED"}
                          </span>
                        </td>
                        <td>
                          <Address address={log.account} size="xs" />
                        </td>
                        <td className="font-mono text-[11px] font-medium text-kupon-ink">{claimName}</td>
                        <td className="font-mono text-kupon-ink/65">#{log.blockNumber.toString()}</td>
                        <td className="font-mono text-kupon-emerald truncate max-w-[130px]">
                          <a
                            href={`https://sepolia.basescan.org/tx/${log.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:underline text-kupon-emerald"
                          >
                            <span>
                              {log.transactionHash.slice(0, 8)}…{log.transactionHash.slice(-6)}
                            </span>
                            <ArrowTopRightOnSquareIcon className="w-3 h-3 shrink-0" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 rounded-lg bg-[#FAF6EC] border border-dashed border-kupon-gold/40 text-center text-xs font-sans text-kupon-ink/60">
              No claim modification events detected on this network yet.
            </div>
          )}
        </section>

        {/* ===================================================================== */}
        {/* FOOTER & FRAMEWORK NAVIGATION */}
        {/* ===================================================================== */}
        <footer className="flex flex-wrap items-center justify-between border-t border-kupon-gold/30 pt-5 text-xs text-kupon-ink/70 font-sans gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/app" className="text-kupon-emerald hover:underline font-medium">
              ← Investor Portal
            </Link>
            <span className="text-kupon-ink/30">·</span>
            <Link href="/registrar" className="text-kupon-gold hover:underline font-medium">
              Registrar Desk →
            </Link>
            <span className="text-kupon-ink/30">·</span>
            <Link href="/framework" className="text-kupon-ink hover:underline font-medium">
              Regulatory Framework (UU P2SK) →
            </Link>
          </div>
          <div className="font-mono text-[11px] text-kupon-ink/60">
            Compliance Engine: <code className="text-kupon-emerald font-semibold">KuponComplianceModule.sol</code>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default RegulatorPage;
