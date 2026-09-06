import Link from "next/link";
import { DebugContracts } from "./_components/DebugContracts";
import type { NextPage } from "next";
import {
  ArrowTopRightOnSquareIcon,
  CheckBadgeIcon,
  CodeBracketIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { GuillochePattern } from "~~/components/GuillochePattern";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Debugger — Kupon Protocol Verification & Explorer",
  description:
    "Inspect, test, and debug verified Kupon smart contracts, compliance storage, and transaction execution.",
});

const CONTRACTS_LIST = [
  {
    name: "KuponToken",
    role: "Gated ERC-20 Bond Token",
    address: "0x65c5a5ed0b13d17051a20e3570c54e1bcf3de409",
    description: "ERC-20 with _update hook checking KuponComplianceModule on every transfer.",
    basescan: "https://sepolia.basescan.org/address/0x65c5a5ed0b13d17051a20e3570c54e1bcf3de409#code",
  },
  {
    name: "KuponComplianceModule",
    role: "Compliance Engine (R1, R2, R3)",
    address: "0xd473730c87c0145b2a431f39b91c06d25cc8e41a",
    description: "Stateless rule engine reverting with Kupon__RuleViolated(ruleId).",
    basescan: "https://sepolia.basescan.org/address/0xd473730c87c0145b2a431f39b91c06d25cc8e41a#code",
  },
  {
    name: "KuponClaimRegistry",
    role: "Identity Claim Registry",
    address: "0xf550e31300cc8f3e675c83d58648ddf73775fe50",
    description: "Single mapping registry for RESIDENCY_ID and ACCREDITED claims.",
    basescan: "https://sepolia.basescan.org/address/0xf550e31300cc8f3e675c83d58648ddf73775fe50#code",
  },
];

const DebuggerPage: NextPage = () => {
  return (
    <div className="py-8 px-4 sm:px-6 max-w-7xl mx-auto w-full flex flex-col gap-10">
      {/* Header Banner */}
      <div className="bg-base-100 p-6 sm:p-8 rounded certificate-border shadow-certificate relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 opacity-10 pointer-events-none">
          <GuillochePattern variant="seal" width={240} height={240} color="emerald" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-kupon-gold/30">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-kupon-emerald/10 border border-kupon-emerald/30 text-[10px] font-mono uppercase tracking-widest text-kupon-emerald font-bold mb-2">
              <CheckBadgeIcon className="w-3.5 h-3.5" />
              Verified On Base Sepolia · Chain 84532
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-kupon-ink m-0">Kupon Protocol Debugger</h1>
            <p className="text-sm font-sans text-kupon-ink/75 mt-1 max-w-2xl">
              Inspect onchain storage, execute test calls, read verification state, and browse block transactions across
              all deployed compliance contracts.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/blockexplorer"
              className="btn btn-sm btn-primary text-kupon-ivory certificate-border-emerald font-sans flex items-center gap-1.5"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              <span>Open Block Explorer</span>
            </Link>
          </div>
        </div>

        {/* Contract Quick Reference Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {CONTRACTS_LIST.map(contract => (
            <div
              key={contract.name}
              className="p-4 rounded bg-base-200/60 border border-kupon-gold/30 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-serif font-bold text-sm text-kupon-emerald">{contract.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-base-100 text-kupon-gold border border-kupon-gold/40">
                    Active
                  </span>
                </div>
                <div className="text-[11px] font-sans text-kupon-ink/70 mb-2">{contract.role}</div>
                <div className="font-mono text-[10px] text-kupon-ink/90 bg-base-100 px-2 py-1 rounded border border-base-300 truncate">
                  {contract.address}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-base-300/60 flex items-center justify-between text-[11px]">
                <span className="text-[10px] text-kupon-ink/60">Explorer</span>
                <a
                  href={contract.basescan}
                  target="_blank"
                  rel="noreferrer"
                  className="text-kupon-emerald hover:text-kupon-gold inline-flex items-center gap-1 font-medium"
                >
                  <span>Basescan</span>
                  <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 1: CONTRACTS DEBUG WORKBENCH */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-base-300">
          <div className="flex items-center gap-2">
            <CodeBracketIcon className="w-5 h-5 text-kupon-emerald" />
            <h2 className="text-xl font-serif font-bold text-kupon-ink m-0">Verified Contracts Interface</h2>
          </div>
          <span className="text-xs font-mono text-kupon-ink/60">Interactive Read &amp; Write</span>
        </div>

        <div className="w-full">
          <DebugContracts />
        </div>
      </section>

      {/* SECTION 2: EXPLORER INTEGRATION */}
      <section className="bg-base-100 p-6 sm:p-8 rounded certificate-border shadow-certificate flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <MagnifyingGlassIcon className="w-5 h-5 text-kupon-gold" />
            <h2 className="text-xl font-serif font-bold text-kupon-ink m-0">Internal Block Explorer</h2>
          </div>
          <p className="text-sm font-sans text-kupon-ink/80 leading-relaxed m-0">
            Kupon includes an integrated Scaffold-ETH 2 block explorer. Inspect recent block numbers, raw transaction
            hashes, transaction execution receipts, and internal contract storage slots directly.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-kupon-ink/70">
            <span>• Transaction Hash Viewer</span>
            <span>• Address Storage Tab</span>
            <span>• Decoded Contract Logs</span>
          </div>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link
            href="/blockexplorer"
            className="btn btn-primary text-kupon-ivory certificate-border-emerald font-sans tracking-wide w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <span>Launch Explorer</span>
            <MagnifyingGlassIcon className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default DebuggerPage;
