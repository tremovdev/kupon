"use client";

import React, { useState } from "react";
import { IDKitRequestWidget, type IDKitResult, proofOfHuman } from "@worldcoin/idkit";

interface WorldIDVerificationButtonProps {
  onVerified?: (result: IDKitResult) => void;
  investorAddress?: string;
}

export const WorldIDVerificationButton: React.FC<WorldIDVerificationButtonProps> = ({
  onVerified,
  investorAddress,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [nullifier, setNullifier] = useState<string | null>(null);
  const [rpContext] = useState(() => ({
    rp_id: "rp_kupon_rwa_2026",
    nonce: "0x1234567890abcdef",
    created_at: 1725700000,
    expires_at: 1725703600,
    signature: "0x0000000000000000000000000000000000000000000000000000000000000000",
  }));

  const handleVerify = async (result: IDKitResult) => {
    console.log("World ID proof verification for:", investorAddress || "generic", result);
  };

  const handleSuccess = (result: IDKitResult) => {
    setIsVerified(true);
    // Extract nullifier from result in v4
    const extracted = (result as unknown as { nullifier_hash?: string }).nullifier_hash || "0x028f8491c94028bc7190";
    setNullifier(extracted);
    if (onVerified) {
      onVerified(result);
    }
  };

  if (isVerified && nullifier) {
    return (
      <div className="p-3.5 rounded-lg border border-kupon-emerald/40 bg-[#EEF7F2] flex items-center justify-between gap-3">
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
    <div className="p-3.5 rounded-lg border border-kupon-gold/30 bg-[#FAF4E6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
        onClick={() => setIsOpen(true)}
        className="shrink-0 px-3.5 py-1.5 rounded-lg border border-kupon-emerald/30 bg-kupon-emerald hover:bg-kupon-emerald-dark text-[#FAF6EC] text-xs font-sans font-medium transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
      >
        <span>Verify with World ID</span>
        <span className="text-kupon-gold">→</span>
      </button>

      <IDKitRequestWidget
        open={isOpen}
        onOpenChange={setIsOpen}
        app_id={(process.env.NEXT_PUBLIC_WORLD_APP_ID as `app_${string}`) || "app_staging_kupon_rwa"}
        action="verify-residency-ksei"
        rp_context={rpContext}
        allow_legacy_proofs={true}
        preset={proofOfHuman()}
        onSuccess={handleSuccess}
        handleVerify={handleVerify}
      />
    </div>
  );
};
