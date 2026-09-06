import { DebugContracts } from "./_components/DebugContracts";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Debugger — Kupon Contracts & Verification",
  description: "Inspect and interact directly with KuponClaimRegistry, KuponComplianceModule, and KuponToken.",
});

const DebuggerPage: NextPage = () => {
  return (
    <div className="py-8 px-4 max-w-7xl mx-auto w-full">
      <div className="mb-6 pb-4 border-b border-base-300">
        <h1 className="text-3xl font-serif font-bold text-kupon-ink">Kupon Contracts Debugger</h1>
        <p className="text-sm font-sans text-kupon-ink/70 mt-1">
          Direct read & write access to verified onchain compliance contracts.
        </p>
      </div>
      <DebugContracts />
    </div>
  );
};

export default DebuggerPage;
