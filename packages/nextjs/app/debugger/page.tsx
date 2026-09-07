import Link from "next/link";
import { DebugContracts } from "./_components/DebugContracts";
import type { NextPage } from "next";
import {
  ArrowTopRightOnSquareIcon,
  CodeBracketIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { GuillochePattern } from "~~/components/GuillochePattern";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Debugger — Kupon Protocol Verification & Explorer",
  description:
    "Inspect, test, and debug verified Kupon smart contracts, compliance storage, and transaction execution on Base Sepolia.",
});

const CONTRACTS_LIST = [
  {
    name: "KuponToken",
    role: "Gated Sovereign Bond Token (ERC-20)",
    address: "0x65c5a5ed0b13d17051a20e3570c54e1bcf3de409",
    description: "ERC-20 bond unit with _update hook checking KuponComplianceModule before transfer.",
    basescan: "https://sepolia.basescan.org/address/0x65c5a5ed0b13d17051a20e3570c54e1bcf3de409#code",
  },
  {
    name: "KuponComplianceModule",
    role: "Deterministic Policy Engine (R1, R2, R3)",
    address: "0xd473730c87c0145b2a431f39b91c06d25cc8e41a",
    description: "Stateless rule evaluator enforcing residency, retail holding caps, and freeze invariants.",
    basescan: "https://sepolia.basescan.org/address/0xd473730c87c0145b2a431f39b91c06d25cc8e41a#code",
  },
  {
    name: "KuponClaimRegistry",
    role: "Identity Claim Registry (KSEI SID)",
    address: "0xf550e31300cc8f3e675c83d58648ddf73775fe50",
    description: "Single mapping registry for RESIDENCY_ID (Indonesian Citizen) and ACCREDITED credentials.",
    basescan: "https://sepolia.basescan.org/address/0xf550e31300cc8f3e675c83d58648ddf73775fe50#code",
  },
];

const DebuggerPage: NextPage = () => {
  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EC] text-[#14201C] selection:bg-kupon-gold/30">
      {/* Sovereign Guilloche Watermark */}
      <div className="absolute left-0 top-20 pointer-events-none opacity-[0.03] overflow-hidden">
        <GuillochePattern variant="seal" width={650} height={650} color="emerald" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-20 relative z-10 flex flex-col gap-6">
        {/* ===================================================================== */}
        {/* HEADER: PROTOCOL DEBUGGER */}
        {/* ===================================================================== */}
        <header className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-kupon-gold/30 pb-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-kupon-ink tracking-tight m-0">
                Protocol Debugger &amp; Contract Inspector
              </h1>
              <p className="text-xs sm:text-sm text-kupon-ink/75 font-sans mt-1 m-0">
                Inspect onchain storage slots, execute test calls, read verification state, and debug compliance
                contracts on Base Sepolia.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 bg-[#F4EEDC] px-3 py-1.5 rounded-full text-xs font-mono border border-kupon-gold/30 self-start sm:self-auto shrink-0">
              <span className="w-2 h-2 rounded-full bg-kupon-emerald animate-pulse" />
              <span className="text-kupon-ink font-semibold">Base Sepolia</span>
              <span className="text-kupon-ink/30">·</span>
              <span className="text-kupon-ink/70 font-sans">Chain 84532</span>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* VERIFIED CONTRACTS REFERENCE STRIP */}
          {/* ===================================================================== */}
          <div className="bg-[#F8F3E5] p-5 sm:p-6 rounded-xl border border-kupon-gold/30 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-kupon-gold/20 pb-2">
              <span className="text-[11px] font-mono text-kupon-ink/60 uppercase tracking-wider">
                Deployed Smart Contracts (Base Sepolia)
              </span>
              <span className="text-[10px] font-mono text-kupon-emerald bg-kupon-emerald/10 px-2 py-0.5 rounded border border-kupon-emerald/20">
                Verified Onchain
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CONTRACTS_LIST.map(contract => (
                <div
                  key={contract.name}
                  className="bg-[#FAF6EC] p-4 rounded-lg border border-kupon-gold/25 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-serif font-bold text-sm text-kupon-emerald">{contract.name}</span>
                      <span className="text-[10px] font-mono text-kupon-gold font-semibold bg-kupon-gold/10 px-1.5 py-0.2 rounded">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-kupon-ink/60 m-0">{contract.role}</p>
                    <p className="text-xs font-sans text-kupon-ink/75 m-0 pt-1 leading-snug">{contract.description}</p>
                  </div>

                  <div className="pt-2 border-t border-kupon-gold/15 flex items-center justify-between text-xs">
                    <span
                      className="font-mono text-[11px] text-kupon-ink/70 truncate max-w-[170px]"
                      title={contract.address}
                    >
                      {contract.address.slice(0, 6)}…{contract.address.slice(-4)}
                    </span>
                    <a
                      href={contract.basescan}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-kupon-emerald hover:underline font-medium"
                    >
                      <span>Basescan</span>
                      <ArrowTopRightOnSquareIcon className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ===================================================================== */}
        {/* SECTION 1: VERIFIED CONTRACTS INTERFACE */}
        {/* ===================================================================== */}
        <section className="bg-[#F8F3E5] p-5 sm:p-7 rounded-xl border border-kupon-gold/30 flex flex-col gap-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-kupon-gold/25 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <CodeBracketIcon className="w-5 h-5 text-kupon-emerald shrink-0" />
              <h2 className="text-base font-serif font-bold text-kupon-ink m-0">Verified Contracts Interface</h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-kupon-ink/60">
              <ShieldCheckIcon className="w-4 h-4 text-kupon-emerald" />
              <span>Interactive Read &amp; Write Calls</span>
            </div>
          </div>

          <div className="w-full">
            <DebugContracts />
          </div>
        </section>

        {/* ===================================================================== */}
        {/* SECTION 2: INTERNAL BLOCK EXPLORER */}
        {/* ===================================================================== */}
        <section className="bg-[#F8F3E5] p-6 sm:p-8 rounded-xl border border-kupon-gold/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <MagnifyingGlassIcon className="w-5 h-5 text-kupon-gold shrink-0" />
              <h2 className="text-base font-serif font-bold text-kupon-ink m-0">Internal Block Explorer</h2>
            </div>
            <p className="text-xs sm:text-sm font-sans text-kupon-ink/75 leading-relaxed m-0">
              Kupon integrates Scaffold-ETH 2 internal block explorer tooling. Inspect recent block heights, raw
              transaction execution receipts, address balances, and internal contract storage slots directly within the
              workspace.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-kupon-ink/60">
              <span className="bg-[#FAF6EC] px-2 py-0.5 rounded border border-kupon-gold/20">Transaction Viewer</span>
              <span className="bg-[#FAF6EC] px-2 py-0.5 rounded border border-kupon-gold/20">Address Storage Tab</span>
              <span className="bg-[#FAF6EC] px-2 py-0.5 rounded border border-kupon-gold/20">
                Decoded Contract Logs
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <Link
              href="/blockexplorer"
              className="btn btn-primary btn-sm text-kupon-ivory font-sans tracking-wide px-5 flex items-center justify-center gap-2"
            >
              <span>Launch Explorer</span>
              <MagnifyingGlassIcon className="w-4 h-4" />
            </Link>
          </div>
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
            <Link href="/regulator" className="text-kupon-emerald hover:underline font-medium">
              Regulator Terminal →
            </Link>
            <span className="text-kupon-ink/30">·</span>
            <Link href="/framework" className="text-kupon-ink hover:underline font-medium">
              Regulatory Framework →
            </Link>
          </div>
          <div className="font-mono text-[11px] text-kupon-ink/60">
            Explorer Backend: <code className="text-kupon-emerald font-semibold">Base Sepolia RPC</code>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DebuggerPage;
