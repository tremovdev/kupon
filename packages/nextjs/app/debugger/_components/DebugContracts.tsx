"use client";

import { useEffect, useMemo } from "react";
import { ContractUI } from "./ContractUI";
import "@scaffold-ui/debug-contracts/styles.css";
import { useSessionStorage } from "usehooks-ts";
import { BarsArrowUpIcon } from "@heroicons/react/20/solid";
import type { ContractName, GenericContract } from "~~/utils/scaffold-eth/contract";
import { useAllContracts } from "~~/utils/scaffold-eth/contractsData";

const selectedContractStorageKey = "scaffoldEth2.selectedContract";

export function DebugContracts() {
  const contractsData = useAllContracts();
  const contractNames = useMemo(
    () =>
      Object.keys(contractsData).sort((a, b) => {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
      }) as ContractName[],
    [contractsData],
  );

  const [selectedContract, setSelectedContract] = useSessionStorage<ContractName>(
    selectedContractStorageKey,
    contractNames[0],
    { initializeWithValue: false },
  );

  useEffect(() => {
    if (!contractNames.includes(selectedContract)) {
      setSelectedContract(contractNames[0]);
    }
  }, [contractNames, selectedContract, setSelectedContract]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {contractNames.length === 0 ? (
        <div className="p-8 rounded-xl bg-[#FAF6EC] border border-dashed border-kupon-gold/40 text-center font-sans">
          <p className="text-sm font-semibold text-kupon-ink m-0">No Contracts Deployed</p>
          <p className="text-xs text-kupon-ink/65 m-0 mt-1">
            Ensure contract deployments are present for the active network.
          </p>
        </div>
      ) : (
        <>
          {contractNames.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-kupon-gold/25 pb-4">
              <span className="text-[11px] font-mono text-kupon-ink/50 uppercase tracking-wider mr-1">
                Active Contract:
              </span>
              {contractNames.map(contractName => {
                const isSelected = contractName === selectedContract;
                const isExternal = Boolean((contractsData[contractName] as GenericContract)?.external);
                return (
                  <button
                    key={contractName}
                    type="button"
                    onClick={() => setSelectedContract(contractName)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-2 border ${
                      isSelected
                        ? "bg-[#FAF6EC] border-kupon-emerald text-kupon-emerald ring-1 ring-kupon-emerald shadow-xs font-bold"
                        : "bg-[#FAF6EC]/60 border-kupon-gold/30 text-kupon-ink/75 hover:border-kupon-gold hover:text-kupon-ink"
                    }`}
                  >
                    <span>{contractName}</span>
                    {isExternal && (
                      <span className="tooltip tooltip-top" data-tip="External contract">
                        <BarsArrowUpIcon className="h-3.5 w-3.5 opacity-60" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {contractNames.map(
            contractName =>
              contractName === selectedContract && <ContractUI key={contractName} contractName={contractName} />,
          )}
        </>
      )}
    </div>
  );
}
