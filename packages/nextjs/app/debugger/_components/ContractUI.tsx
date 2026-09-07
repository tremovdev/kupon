"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { ContractName } from "~~/utils/scaffold-eth/contract";

type ContractUIProps = {
  contractName: ContractName;
  className?: string;
};

// Dynamically import Contract with ssr: false to prevent DaisyUI / Scaffold-UI hydration mismatches
const Contract = dynamic(() => import("@scaffold-ui/debug-contracts").then(mod => mod.Contract), {
  ssr: false,
  loading: () => (
    <div className="mt-12 flex flex-col items-center justify-center gap-2 py-8">
      <span className="loading loading-spinner loading-lg text-kupon-emerald"></span>
      <span className="text-xs font-mono text-kupon-ink/60">Loading contract interface...</span>
    </div>
  ),
});

/**
 * UI component to interface with deployed contracts.
 **/
export const ContractUI = ({ contractName }: ContractUIProps) => {
  const [mounted, setMounted] = useState(false);
  const { targetNetwork } = useTargetNetwork();
  const { data: deployedContractData, isLoading: deployedContractLoading } = useDeployedContractInfo({ contractName });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || deployedContractLoading) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center gap-2 py-8">
        <span className="loading loading-spinner loading-lg text-kupon-emerald"></span>
        <span className="text-xs font-mono text-kupon-ink/60">Loading contract interface...</span>
      </div>
    );
  }

  if (!deployedContractData) {
    return (
      <div className="mt-8 p-6 rounded-xl bg-[#FAF6EC] border border-dashed border-kupon-gold/40 text-center font-sans">
        <p className="text-sm font-semibold text-kupon-ink m-0">Contract Not Found</p>
        <p className="text-xs text-kupon-ink/65 m-0 mt-1">
          No contract found by the name of{" "}
          <code className="font-mono text-kupon-emerald font-bold">{contractName}</code> on chain {targetNetwork.name} (
          {targetNetwork.id}).
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <Contract contractName={contractName as string} contract={deployedContractData} chainId={targetNetwork.id} />
    </div>
  );
};
