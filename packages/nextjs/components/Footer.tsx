import React from "react";
import Image from "next/image";
import Link from "next/link";
import { hardhat } from "viem/chains";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { Faucet } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

/**
 * Sovereign Certificate Footer
 * Refined institutional footer with Kupon seal mark, clean navigation, and concise legal notices.
 */
export const Footer = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <footer className="mt-auto border-t border-kupon-gold/30 bg-base-100 text-kupon-ink/80 text-xs font-sans">
      {/* Decorative sovereign double rule */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-kupon-gold/50 to-transparent" />

      {/* Floating local faucet if running on hardhat */}
      {isLocalNetwork && (
        <div className="fixed flex justify-start items-center z-10 p-4 bottom-0 left-0 pointer-events-none">
          <div className="pointer-events-auto">
            <Faucet />
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-10">
        {/* Main Footer Row: Brand Column + Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Column (Col 1-5) */}
          <div className="md:col-span-5 flex flex-col items-start text-left">
            <Link href="/" className="flex items-center gap-3 mb-3 group">
              <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                <Image
                  src="/kupon-logo.svg"
                  alt="Kupon Seal Mark"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-lg tracking-tight text-kupon-emerald leading-none group-hover:text-kupon-gold transition-colors">
                  KUPON
                </span>
                <div className="h-[1px] w-full bg-kupon-gold/60 my-0.5" />
                <span className="text-[9px] font-mono tracking-wider text-kupon-ink/75 uppercase font-medium leading-none">
                  SBN RITEL 2027 · ONCHAIN
                </span>
              </div>
            </Link>

            <p className="text-xs text-kupon-ink/70 leading-relaxed max-w-sm m-0">
              Autonomous Indonesian retail government bond tokens onchain. Guaranteed citizen priority, fair retail
              quotas, and 24/7 instant settlement.
            </p>
          </div>

          {/* Navigation Column 1: Platform (Col 6-8) */}
          <div className="md:col-span-3 flex flex-col gap-2.5 text-left">
            <div className="font-mono text-[10px] uppercase tracking-wider text-kupon-gold font-bold mb-1">
              Platform Portals
            </div>
            <Link href="/app" className="text-xs text-kupon-ink/80 hover:text-kupon-emerald transition-colors">
              Investor App
            </Link>
            <Link href="/registrar" className="text-xs text-kupon-ink/80 hover:text-kupon-emerald transition-colors">
              Registrar Portal (DJPPR)
            </Link>
            <Link href="/regulator" className="text-xs text-kupon-ink/80 hover:text-kupon-emerald transition-colors">
              Regulator Terminal (OJK)
            </Link>
          </div>

          {/* Navigation Column 2: Resources & Verification (Col 9-12) */}
          <div className="md:col-span-4 flex flex-col gap-2.5 text-left">
            <div className="font-mono text-[10px] uppercase tracking-wider text-kupon-gold font-bold mb-1">
              Verification &amp; Governance
            </div>
            <Link href="/framework" className="text-xs text-kupon-ink/80 hover:text-kupon-emerald transition-colors">
              Regulatory Framework (UU P2SK)
            </Link>
            <Link href="/debugger" className="text-xs text-kupon-ink/80 hover:text-kupon-emerald transition-colors">
              Contract Debugger &amp; ABI
            </Link>
            <Link
              href="/blockexplorer"
              className="text-xs text-kupon-ink/80 hover:text-kupon-emerald transition-colors"
            >
              SE-2 Block Explorer
            </Link>
            <a
              href="https://github.com/tremovdev/kupon"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-kupon-emerald hover:text-kupon-gold transition-colors font-medium"
            >
              <span>GitHub Repository (@tremovdev)</span>
              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Bottom Bar: Concise Disclaimer + Network & Author Status */}
        <div className="pt-6 border-t border-base-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-kupon-ink/60">
          <div className="max-w-2xl leading-relaxed">
            <strong>Demonstration Notice:</strong> Kupon is an educational technical project for{" "}
            <strong>ETHGlobal ETHOnline 2026</strong>. It models an Indonesian sovereign bond (SBN Ritel 2027) under
            regulatory sandbox guidelines and is not an actual debt offering.
          </div>

          <div className="flex items-center gap-3 shrink-0 font-mono text-[10px]">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-base-200 border border-base-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              {targetNetwork.name} ({targetNetwork.id})
            </span>
            <span>tremov</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
