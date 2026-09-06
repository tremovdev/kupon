import Link from "next/link";
import type { NextPage } from "next";
import { GuillochePattern } from "~~/components/GuillochePattern";

const RegistrarPlaceholder: NextPage = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-8 relative">
      <div className="card max-w-xl w-full bg-base-100 certificate-border p-8 text-center relative z-10">
        <div className="flex justify-center mb-4">
          <GuillochePattern variant="seal" width={80} height={80} color="gold" />
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-kupon-gold mb-2">
          Authority Portal · Task 7
        </div>
        <h1 className="text-3xl font-serif font-bold text-kupon-ink mb-3">Registrar Portal</h1>
        <p className="text-kupon-ink/75 font-sans mb-6 text-sm leading-relaxed">
          The Registrar issues and revokes verified investor identity claims (
          <code className="font-mono text-xs bg-base-200 px-1 py-0.5 rounded">RESIDENCY_ID</code>,{" "}
          <code className="font-mono text-xs bg-base-200 px-1 py-0.5 rounded">ACCREDITED</code>) and issues newly minted
          bond tranches under the series cap.
        </p>
        <div className="bg-base-200/60 p-4 rounded border border-kupon-gold/30 text-xs font-mono text-kupon-ink/80 mb-6 text-left">
          <p className="font-bold text-kupon-emerald mb-1">Contract Interfaces:</p>
          <p className="my-1">→ KuponClaimRegistry.grantClaim(investor, claimId)</p>
          <p className="my-1">→ KuponClaimRegistry.revokeClaim(investor, claimId)</p>
          <p className="my-1">→ KuponToken.issue(recipient, amount)</p>
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

export default RegistrarPlaceholder;
