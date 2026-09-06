import Link from "next/link";
import type { NextPage } from "next";
import { GuillochePattern } from "~~/components/GuillochePattern";

const RegulatorPlaceholder: NextPage = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-8 relative">
      <div className="card max-w-xl w-full bg-base-100 certificate-border p-8 text-center relative z-10">
        <div className="flex justify-center mb-4">
          <GuillochePattern variant="seal" width={80} height={80} color="emerald" />
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-kupon-emerald mb-2">
          Oversight & Compliance · Task 8
        </div>
        <h1 className="text-3xl font-serif font-bold text-kupon-ink mb-3">Regulator Portal</h1>
        <p className="text-kupon-ink/75 font-sans mb-6 text-sm leading-relaxed">
          The 4-Act compliance audit view: real-time transfer simulations via{" "}
          <code className="font-mono text-xs bg-base-200 px-1 py-0.5 rounded">eth_call</code>, wallet × rule compliance
          matrix, and complete onchain rule enforcement telemetry.
        </p>
        <div className="bg-base-200/60 p-4 rounded border border-kupon-gold/30 text-xs font-mono text-kupon-ink/80 mb-6 text-left">
          <p className="font-bold text-kupon-emerald mb-1">Four Act Narratives:</p>
          <p className="my-1">1. Blocked: non-WNI transfer reverts R1-RESIDENCY</p>
          <p className="my-1">2. Grant: registrar grants claim → transfer passes</p>
          <p className="my-1">3. Cap Proof: 5,001 KPON transfer reverts R2-CAP</p>
          <p className="my-1">4. Freeze: claim revocation freezes wallet (R3-FROZEN)</p>
        </div>
        <div className="flex justify-center gap-3">
          <Link href="/app" className="btn btn-primary btn-sm text-kupon-ivory font-sans">
            ← Return to Investor App
          </Link>
          <Link href="/debugger" className="btn btn-outline btn-sm border-kupon-gold text-kupon-ink font-sans">
            Contracts Debugger
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegulatorPlaceholder;
