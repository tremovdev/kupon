"use client";

import { useState } from "react";
import { Address, AddressInput } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther, keccak256, parseEther, toHex } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

const RESIDENCY_ID = keccak256(toHex("RESIDENCY_ID"));
const ACCREDITED = keccak256(toHex("ACCREDITED"));

const RULE_IDS = {
  r1: keccak256(toHex("R1-RESIDENCY")),
  r2: keccak256(toHex("R2-CAP")),
  r3: keccak256(toHex("R3-FROZEN")),
} as const;

/** Translates an on-chain compliance revert into plain-language policy. */
function translateRevert(rawError: unknown): string {
  const parsed = getParsedError(rawError);
  const match = parsed.match(/Kupon__RuleViolated\(0x([0-9a-fA-F]{64})\)/);
  if (match) {
    const ruleId = `0x${match[1]}`;
    if (ruleId === RULE_IDS.r1)
      return "Blocked by R1-RESIDENCY — the recipient must hold a residency claim. Ask the registrar to grant it, then retry.";
    if (ruleId === RULE_IDS.r2)
      return "Blocked by R2-CAP — retail wallets hold at most 5,000 KPON (accredited wallets are exempt).";
    if (ruleId === RULE_IDS.r3)
      return "Blocked by R3-FROZEN — this wallet's claims were revoked, so its balance is frozen until a claim is re-granted.";
  }
  return parsed;
}

const InvestorPage: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { data: balance } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "balanceOf",
    args: [connectedAddress ?? "0x0000000000000000000000000000000000000000"],
  });
  const { data: hasResidency } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasClaim",
    args: [connectedAddress ?? "0x0000000000000000000000000000000000000000", RESIDENCY_ID],
  });
  const { data: hasAccredited } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasClaim",
    args: [connectedAddress ?? "0x0000000000000000000000000000000000000000", ACCREDITED],
  });

  const { writeContractAsync: transferKpon } = useScaffoldWriteContract({ contractName: "KuponToken" });

  const complianceStatus =
    hasAccredited === undefined || hasResidency === undefined
      ? null
      : hasAccredited
        ? { badge: "badge-secondary", label: "Accredited — cap-exempt" }
        : hasResidency
          ? { badge: "badge-info", label: "Retail investor — cap 5,000 KPON" }
          : { badge: "badge-error", label: "No claims — cannot receive KPON (R1)" };

  const handleSend = async () => {
    if (!sendTo || !sendAmount) {
      notification.error("Fill in the recipient and the amount first.");
      return;
    }
    let amount: bigint;
    try {
      amount = parseEther(sendAmount);
    } catch {
      notification.error("Invalid amount — use decimal KPON, e.g. 10 or 0.5.");
      return;
    }
    setIsSending(true);
    try {
      await transferKpon({
        functionName: "transfer",
        args: [sendTo, amount],
      });
      notification.success(`Sent ${sendAmount} KPON to ${sendTo.slice(0, 6)}…${sendTo.slice(-4)}`);
      setSendAmount("");
    } catch (e) {
      notification.error(translateRevert(e));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex items-center flex-col grow pt-10 px-5">
      <div className="w-full max-w-2xl">
        <h1 className="text-center text-3xl font-bold mb-1">Kupon · SBN Ritel 2027</h1>
        <p className="text-center text-sm opacity-70 mb-6">
          Compliance-gated retail bond token (KPON) — transfers are enforced by policy, not by promise.
        </p>

        {connectedAddress ? (
          <>
            {/* Compliance identity */}
            <div className="card bg-base-100 border border-base-300 mb-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm opacity-70">Your wallet</span>
                <Address address={connectedAddress} size="sm" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm opacity-70">Compliance status</span>
                {complianceStatus ? (
                  <span className={`badge ${complianceStatus.badge}`}>{complianceStatus.label}</span>
                ) : (
                  <span className="loading loading-spinner loading-xs" />
                )}
              </div>
            </div>

            {/* Balance */}
            <div className="card bg-base-100 border border-base-300 mb-4">
              <div className="card-body py-4">
                <span className="text-sm opacity-70">Your KPON balance</span>
                <div className="text-4xl font-bold">
                  {balance === undefined ? <span className="loading loading-spinner" /> : formatEther(balance)}
                  <span className="text-base font-medium ml-2 opacity-70">KPON</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Send */}
              <div className="card bg-base-100 border border-base-300">
                <div className="card-body gap-3">
                  <span className="font-medium">Send KPON</span>
                  <AddressInput value={sendTo} onChange={setSendTo} placeholder="Recipient address" />
                  <input
                    className="input input-bordered w-full"
                    placeholder="Amount in KPON, e.g. 10"
                    value={sendAmount}
                    onChange={e => setSendAmount(e.target.value)}
                    inputMode="decimal"
                  />
                  <button className="btn btn-primary" onClick={handleSend} disabled={isSending}>
                    {isSending ? <span className="loading loading-spinner loading-xs" /> : null}
                    Send
                  </button>
                  <p className="text-xs opacity-60">
                    Blocked transfers name the violated rule — the reason appears here, in policy language.
                  </p>
                </div>
              </div>

              {/* Receive */}
              <div className="card bg-base-100 border border-base-300">
                <div className="card-body gap-3">
                  <span className="font-medium">Receive KPON</span>
                  <p className="text-sm opacity-70">
                    Share your address to receive KPON. Compliance checks the sender and you on every transfer.
                  </p>
                  <Address address={connectedAddress} format="long" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card bg-base-100 border border-base-300">
            <div className="card-body items-center py-10">
              <p className="text-lg font-medium">Connect your wallet to see your KPON</p>
              <p className="text-sm opacity-70">
                Your compliance status (retail / accredited / frozen) is read live from the claim registry.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestorPage;
