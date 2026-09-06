import React from "react";
import Link from "next/link";
import { hardhat } from "viem/chains";
import { ArrowTopRightOnSquareIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { Faucet } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

/**
 * Sovereign Certificate Footer
 * Displays mandatory fictional asset disclaimers, regulatory framework citations, and audit links.
 */
export const Footer = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <footer className="mt-auto border-t border-kupon-gold/30 bg-base-100 text-kupon-ink/80 text-xs font-sans">
      {/* Decorative double rule */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-kupon-gold/50 to-transparent" />

      {/* Floating local faucet if running on hardhat */}
      {isLocalNetwork && (
        <div className="fixed flex justify-start items-center z-10 p-4 bottom-0 left-0 pointer-events-none">
          <div className="pointer-events-auto">
            <Faucet />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        {/* Mandatory Fictional Asset Disclaimer Box */}
        <div className="p-4 rounded border border-kupon-gold/40 bg-kupon-ivory/80 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <ShieldCheckIcon className="w-6 h-6 text-kupon-emerald shrink-0 mt-0.5 sm:mt-0" />
          <div className="text-[11px] leading-relaxed text-kupon-ink/90">
            <strong className="text-kupon-emerald font-semibold uppercase tracking-wider block sm:inline mr-2 font-mono">
              Fictional Asset Notice:
            </strong>
            Kupon is an educational and demonstration project for <strong>ETHGlobal ETHOnline 2026</strong>. It models a
            fictional Indonesian retail government bond (&quot;SBN Ritel 2027&quot;) with ERC-3643-style on-chain
            compliance gates. It is not an actual sovereign bond, financial product, or securities offering.
          </div>
        </div>

        {/* Citations & Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 border-t border-base-300/60">
          <div>
            <div className="font-serif font-bold text-kupon-emerald text-sm mb-2">Regulatory Foundations</div>
            <p className="text-[11px] text-kupon-ink/75 leading-relaxed m-0">
              Designed around the Indonesian digital asset regulatory roadmap:
            </p>
            <ul className="text-[11px] text-kupon-ink/85 mt-2 space-y-1 font-mono list-none p-0">
              <li>• UU No. 4/2023 (P2SK)</li>
              <li>• POJK No. 27/2024 &amp; POJK No. 23/2025</li>
              <li>• OJK Q3-2026 RWA Sandbox Framework</li>
            </ul>
          </div>

          <div>
            <div className="font-serif font-bold text-kupon-emerald text-sm mb-2">Protocol Architecture</div>
            <p className="text-[11px] text-kupon-ink/75 leading-relaxed m-0">
              On-chain transfer gates enforced deterministically via Solidity custom errors:
            </p>
            <ul className="text-[11px] text-kupon-ink/85 mt-2 space-y-1 font-mono list-none p-0">
              <li>
                • <span className="font-semibold text-kupon-emerald">R1-RESIDENCY</span>: WNI identity gate
              </li>
              <li>
                • <span className="font-semibold text-kupon-emerald">R2-CAP</span>: 5,000 KPON retail ceiling
              </li>
              <li>
                • <span className="font-semibold text-kupon-emerald">R3-FROZEN</span>: instant claim revocation
              </li>
            </ul>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <div className="font-serif font-bold text-kupon-emerald text-sm mb-2">Verification &amp; Links</div>
              <div className="flex flex-col gap-1.5 text-[11px]">
                <a
                  href="https://github.com/tremovdev/kupon"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-kupon-emerald hover:text-kupon-gold font-medium"
                >
                  <span>GitHub Repository (@tremovdev)</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </a>
                <Link
                  href="/blockexplorer"
                  className="inline-flex items-center gap-1 text-kupon-ink/80 hover:text-kupon-emerald"
                >
                  <span>SE-2 Block Explorer</span>
                </Link>
                <Link
                  href="/debugger"
                  className="inline-flex items-center gap-1 text-kupon-ink/80 hover:text-kupon-emerald"
                >
                  <span>Interactive Contract Debugger</span>
                </Link>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-base-300/40 text-[10px] text-kupon-ink/60 font-mono">
              Network: {targetNetwork.name} ({targetNetwork.id}) · Author: tremov
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
