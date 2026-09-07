"use client";

import React from "react";
import { usePrivy } from "@privy-io/react-auth";

export const PrivyAuthButton = ({ compact = false }: { compact?: boolean }) => {
  const { ready, authenticated, user, login, logout } = usePrivy();

  if (!ready) {
    return (
      <div className="animate-pulse px-3 py-1.5 rounded-lg border border-kupon-gold/20 bg-kupon-paper text-xs text-kupon-ink/40">
        Loading Auth...
      </div>
    );
  }

  if (authenticated && user) {
    const identifier =
      user.email?.address ||
      user.google?.email ||
      (user.wallet?.address
        ? `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`
        : "Verified Citizen");

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-kupon-emerald/30 bg-[#EEF7F2] text-xs shadow-xs">
        <span className="w-2 h-2 rounded-full bg-kupon-emerald animate-pulse" />
        <div className="flex flex-col">
          <span className="font-mono font-semibold text-kupon-emerald text-[11px] leading-tight truncate max-w-[140px]">
            {identifier}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-kupon-emerald/70 font-sans font-medium">
            Privy Embedded
          </span>
        </div>
        <button
          onClick={() => logout()}
          title="Sign out of Privy"
          className="ml-1 text-[10px] text-kupon-ink/50 hover:text-red-600 transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-black/5"
        >
          ✕
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={() => login()}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-kupon-gold/40 bg-kupon-paper hover:bg-[#F3EDE0] text-kupon-ink text-xs font-medium transition-all shadow-xs cursor-pointer group"
      >
        <span className="text-[10px] px-1 py-0.5 rounded bg-kupon-gold/15 text-kupon-gold font-bold">Privy</span>
        <span>Email / Social</span>
      </button>
    );
  }

  return (
    <div className="p-3.5 rounded-xl border border-kupon-gold/30 bg-kupon-paper/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-kupon-emerald/10 border border-kupon-emerald/25 flex items-center justify-center shrink-0">
          <svg
            className="w-4 h-4 text-kupon-emerald"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h4 className="font-serif font-bold text-xs text-kupon-ink">Non-Crypto Indonesian Citizen Onboarding</h4>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider bg-kupon-gold/20 text-kupon-gold">
              Powered by Privy
            </span>
          </div>
          <p className="text-[11px] text-kupon-ink/65 leading-snug mt-0.5">
            No MetaMask extension or seed phrase required. Instant institutional embedded wallet via Google or Email.
          </p>
        </div>
      </div>
      <button
        onClick={() => login()}
        className="shrink-0 px-3.5 py-2 rounded-lg bg-kupon-emerald hover:bg-kupon-emerald-dark text-[#FAF6EC] font-sans font-medium text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
      >
        <span>1-Click Citizen Login</span>
        <span className="text-kupon-gold">→</span>
      </button>
    </div>
  );
};
