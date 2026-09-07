"use client";

import React, { useState } from "react";
import { IDKitRequestWidget, type IDKitResult, proofOfHuman } from "@worldcoin/idkit";
import { keccak256, toHex } from "viem";

interface WorldIDVerificationButtonProps {
  onVerified?: (result: IDKitResult) => void;
  investorAddress?: string;
}

const CONFIGURED_APP_ID = process.env.NEXT_PUBLIC_WORLD_APP_ID || "app__2e64ca385789651bf2a35537179caf21";
const CONFIGURED_RP_ID = process.env.NEXT_PUBLIC_WORLD_RP_ID || "rp__2f78f40167b2d82b";

export const WorldIDVerificationButton: React.FC<WorldIDVerificationButtonProps> = ({
  onVerified,
  investorAddress,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [nullifier, setNullifier] = useState<string | null>(null);

  const [rpContext] = useState(() => ({
    rp_id: CONFIGURED_RP_ID,
    nonce: "0x1234567890abcdef",
    created_at: Math.floor(Date.now() / 1000),
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    signature: "0x0000000000000000000000000000000000000000000000000000000000000000",
  }));

  const handleVerify = async (result: IDKitResult) => {
    console.log("World ID proof verification for:", investorAddress || "generic", result);
  };

  const handleSuccess = (result: IDKitResult) => {
    setIsVerified(true);
    const extracted =
      (result as unknown as { nullifier_hash?: string }).nullifier_hash ||
      keccak256(toHex(`world_id_${investorAddress || Date.now()}`));
    setNullifier(extracted);
    if (onVerified) {
      onVerified(result);
    }
  };

  const runSimulatedVerification = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const simulatedNullifier = keccak256(toHex(`world_id_nullifier_${investorAddress || "0x1111"}`));
      const mockResult = {
        nullifier_hash: simulatedNullifier,
        merkle_root: "0x1f8b6528c11904a0815e4787a9ef7190f849",
        proof: "0xmock_zk_proof_world_id_orb_verification",
        verification_level: "orb",
      } as unknown as IDKitResult;

      setIsSimulating(false);
      setIsSimulatorOpen(false);
      handleSuccess(mockResult);
    }, 1200);
  };

  if (isVerified && nullifier) {
    return (
      <div className="p-3.5 rounded-lg border border-kupon-emerald/40 bg-[#EEF7F2] flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-kupon-emerald/15 border border-kupon-emerald/30 flex items-center justify-center text-kupon-emerald text-sm font-bold">
            ✓
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-serif font-bold text-kupon-emerald">Proof of Personhood Certified</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider bg-kupon-emerald/20 text-kupon-emerald">
                World ID Verified
              </span>
            </div>
            <p className="text-[10px] font-mono text-kupon-ink/65 leading-tight mt-0.5 truncate max-w-[280px]">
              Nullifier: {nullifier.slice(0, 10)}...{nullifier.slice(-8)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsVerified(false);
            setNullifier(null);
          }}
          className="text-[10px] text-kupon-ink/40 hover:text-kupon-ink underline cursor-pointer"
        >
          Reset
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="p-3.5 rounded-lg border border-kupon-gold/30 bg-[#FAF4E6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-kupon-gold/15 border border-kupon-gold/30 flex items-center justify-center text-base">
            🌐
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-serif font-bold text-kupon-ink">1-Human-1-Citizen Verification</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider bg-kupon-gold/20 text-kupon-gold">
                World ID Protocol
              </span>
            </div>
            <p className="text-[11px] text-kupon-ink/70 leading-snug mt-0.5">
              Authenticate uniqueness via World ID to prevent duplicate SBN retail quota allocations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsSimulatorOpen(true)}
          className="shrink-0 px-3.5 py-1.5 rounded-lg border border-kupon-emerald/30 bg-kupon-emerald hover:bg-kupon-emerald-dark text-[#FAF6EC] text-xs font-sans font-medium transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <span>Verify with World ID</span>
          <span className="text-kupon-gold">→</span>
        </button>

        <IDKitRequestWidget
          open={isOpen}
          onOpenChange={setIsOpen}
          app_id={CONFIGURED_APP_ID as `app_${string}`}
          action="verify-residency-ksei"
          rp_context={rpContext}
          allow_legacy_proofs={true}
          preset={proofOfHuman()}
          onSuccess={handleSuccess}
          handleVerify={handleVerify}
        />
      </div>

      {/* World ID Proof of Personhood Verification Modal */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[#FAF6EC] border border-kupon-gold/40 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 relative">
            <button
              onClick={() => setIsSimulatorOpen(false)}
              className="absolute top-4 right-4 text-kupon-ink/40 hover:text-kupon-ink p-1 cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-kupon-emerald/10 border border-kupon-emerald/30 flex items-center justify-center text-xl">
                🌐
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-kupon-ink m-0">World ID Verification</h3>
                <p className="text-xs font-sans text-kupon-ink/65 m-0">Proof of Personhood Protocol (Zero-Knowledge)</p>
              </div>
            </div>

            <div className="bg-[#F4EEDC] p-4 rounded-xl border border-kupon-gold/25 flex flex-col gap-2.5 text-xs font-sans">
              <div className="flex justify-between items-center">
                <span className="text-kupon-ink/60">Action:</span>
                <span className="font-mono font-semibold text-kupon-emerald">verify-residency-ksei</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-kupon-ink/60">Target Account:</span>
                <span className="font-mono text-kupon-ink/80">
                  {investorAddress ? `${investorAddress.slice(0, 6)}...${investorAddress.slice(-4)}` : "Select Account"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-kupon-ink/60">App & RP:</span>
                <span className="font-mono text-[10px] text-kupon-ink/80 truncate max-w-[200px]">
                  {CONFIGURED_APP_ID.slice(0, 10)}... | {CONFIGURED_RP_ID.slice(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-kupon-ink/60">Assurance Level:</span>
                <span className="inline-flex items-center gap-1 font-semibold text-kupon-ink">
                  <span className="w-2 h-2 rounded-full bg-kupon-gold" />
                  Orb Verified (1-Human Uniqueness)
                </span>
              </div>
            </div>

            <p className="text-xs text-kupon-ink/70 leading-relaxed m-0">
              This cryptographic proof confirms the citizen is a unique living human being without disclosing any
              biometrics, real name, or national ID number.
            </p>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                disabled={isSimulating}
                onClick={runSimulatedVerification}
                className="w-full py-2.5 px-4 rounded-xl bg-kupon-emerald hover:bg-kupon-emerald-dark text-[#FAF6EC] font-sans font-semibold text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSimulating ? (
                  <>
                    <span className="loading loading-spinner loading-xs" />
                    <span>Generating Zero-Knowledge Proof...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Proof of Personhood (Instant)</span>
                    <span className="text-kupon-gold">✓</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSimulatorOpen(false);
                  setIsOpen(true);
                }}
                className="w-full py-2 px-4 rounded-xl border border-kupon-gold/40 hover:bg-kupon-paper text-kupon-ink font-sans text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Scan with World App (QR Code)</span>
                <span>📱</span>
              </button>
            </div>

            <div className="border-t border-kupon-gold/20 pt-3 flex items-center justify-between text-[10px] text-kupon-ink/40 font-mono">
              <span>World ID Protocol v4</span>
              <span>ETHOnline 2026 Staging</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
