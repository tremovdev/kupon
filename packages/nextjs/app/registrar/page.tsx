"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Address, AddressInput } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { formatEther, isAddress, keccak256, parseEther, toHex } from "viem";
import { useAccount } from "wagmi";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  IdentificationIcon,
  InformationCircleIcon,
  KeyIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { GuillochePattern } from "~~/components/GuillochePattern";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

// Smart contract identifiers
const RESIDENCY_ID = keccak256(toHex("RESIDENCY_ID"));
const ACCREDITED = keccak256(toHex("ACCREDITED"));
const REGISTRAR_ROLE = keccak256(toHex("REGISTRAR_ROLE"));
const ISSUER_ROLE = keccak256(toHex("ISSUER_ROLE"));
const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`;

const DEPLOYER_AUTHORITY_ADDRESS = "0x2b97bea17da0ff83fd95a73dc60881d5b27a2b9b";

// Preset accounts for frictionless testing
const DEMO_PRESETS = [
  { label: "Alice (Calon Ritel)", address: "0x1111111111111111111111111111111111111111" },
  { label: "Bob (Institusi)", address: "0x2222222222222222222222222222222222222222" },
] as const;

type ClaimType = "RESIDENCY_ID" | "ACCREDITED";
type ActiveTab = "verify" | "issue";

function translateRegistrarError(rawError: unknown): string {
  const parsed = getParsedError(rawError);
  if (/AccessControlUnauthorizedAccount/i.test(parsed) || /unauthorized/i.test(parsed) || /0x4e487b71/i.test(parsed)) {
    return "Akses Ditolak: Dompet Anda tidak memiliki peran REGISTRAR_ROLE atau ISSUER_ROLE.";
  }
  if (/Kupon__SeriesCapExceeded/i.test(parsed)) {
    return "Penerbitan Gagal: Jumlah ini akan melampaui batas maksimal penerbitan 100.000 KPON.";
  }
  if (/Kupon__RuleViolated/i.test(parsed) || /R1-RESIDENCY/i.test(parsed)) {
    return "Aturan Kepatuhan (R1): Investor harus diverifikasi identitasnya terlebih dahulu sebelum menerima obligasi.";
  }
  if (/R2-CAP/i.test(parsed)) {
    return "Aturan Kepatuhan (R2): Kepemilikan investor ritel tidak boleh melebihi 5.000 KPON (Rp5 Miliar).";
  }
  if (/Kupon__InvalidClaim/i.test(parsed)) {
    return "Tipe izin tidak valid. Gunakan RESIDENCY_ID atau ACCREDITED.";
  }
  if (/execution reverted/i.test(parsed)) {
    return "Transaksi dibatalkan oleh aturan kontrak. Pastikan izin dan saldo penerima sesuai.";
  }
  return parsed;
}

const RegistrarPage: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  // Active workspace state: single investor address drives all actions
  const [investorAddress, setInvestorAddress] = useState<string>("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("verify");

  // Tab 1 state: Verification
  const [selectedClaim, setSelectedClaim] = useState<ClaimType>("RESIDENCY_ID");
  const [isProcessingClaim, setIsProcessingClaim] = useState(false);

  // Tab 2 state: Issuance
  const [issueAmount, setIssueAmount] = useState<string>("");
  const [isIssuingTokens, setIsIssuingTokens] = useState(false);

  // Contract Reads: Authority checks on connected wallet
  const targetWallet = connectedAddress ?? ZERO_ADDRESS;

  const { data: isRegistrar } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasRole",
    args: [REGISTRAR_ROLE, targetWallet],
  });

  const { data: isRegistryAdmin } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasRole",
    args: [DEFAULT_ADMIN_ROLE, targetWallet],
  });

  const { data: isIssuer } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "hasRole",
    args: [ISSUER_ROLE, targetWallet],
  });

  const hasRegistrarAuthority = Boolean(isRegistrar || isRegistryAdmin);
  const hasIssuerAuthority = Boolean(isIssuer);
  const isCurrentActionAuthorized = activeTab === "verify" ? hasRegistrarAuthority : hasIssuerAuthority;

  // Contract Reads: Global Token Metrics
  const { data: totalSupply, refetch: refetchSupply } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "totalSupply",
  });

  const { data: seriesCap } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "SERIES_CAP",
  });

  const { data: retailCap } = useScaffoldReadContract({
    contractName: "KuponComplianceModule",
    functionName: "cap",
  });

  // Contract Writes
  const { writeContractAsync: writeClaimRegistry } = useScaffoldWriteContract({ contractName: "KuponClaimRegistry" });
  const { writeContractAsync: writeToken } = useScaffoldWriteContract({ contractName: "KuponToken" });

  // ---------------------------------------------------------------------------
  // Queries for the currently selected investor address
  // ---------------------------------------------------------------------------
  const isAddressValid = isAddress(investorAddress);
  const safeTarget = isAddressValid ? investorAddress : ZERO_ADDRESS;

  const { data: hasResidency, refetch: refetchResidency } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasClaim",
    args: [safeTarget, RESIDENCY_ID],
  });

  const { data: hasAccredited, refetch: refetchAccredited } = useScaffoldReadContract({
    contractName: "KuponClaimRegistry",
    functionName: "hasClaim",
    args: [safeTarget, ACCREDITED],
  });

  const { data: investorBalance, refetch: refetchBalance } = useScaffoldReadContract({
    contractName: "KuponToken",
    functionName: "balanceOf",
    args: [safeTarget],
  });

  // Derived investor status
  const currentClaimActive = selectedClaim === "RESIDENCY_ID" ? Boolean(hasResidency) : Boolean(hasAccredited);

  // Pre-flight check for tranche issuance
  const parsedIssueAmount = useMemo(() => {
    try {
      if (!issueAmount.trim()) return undefined;
      return parseEther(issueAmount);
    } catch {
      return undefined;
    }
  }, [issueAmount]);

  const issuanceValidation = useMemo(() => {
    if (!isAddressValid) {
      return { ok: false, text: "Masukkan alamat dompet investor terlebih dahulu." };
    }
    if (parsedIssueAmount === undefined || parsedIssueAmount <= 0n) {
      return { ok: false, text: "Tentukan jumlah kupon yang valid (angka desimal positif)." };
    }
    if (seriesCap !== undefined && totalSupply !== undefined) {
      if (parsedIssueAmount > seriesCap - totalSupply) {
        return {
          ok: false,
          text: `Melampaui kuota sisa! Sisa kuota seri nasional: ${Number(formatEther(seriesCap - totalSupply)).toLocaleString("id-ID")} KPON.`,
        };
      }
    }
    if (hasResidency === undefined || hasAccredited === undefined) {
      return { ok: false, text: "Memeriksa status verifikasi investor..." };
    }
    if (!hasResidency && !hasAccredited) {
      return {
        ok: false,
        text: "Ditolak Aturan R1: Investor belum terverifikasi identitasnya. Verifikasi KTP investor di tab sebelah sebelum menerbitkan kupon.",
      };
    }
    const isRetail = hasResidency && !hasAccredited;
    if (isRetail && retailCap !== undefined && investorBalance !== undefined) {
      if (parsedIssueAmount > retailCap || investorBalance > retailCap - parsedIssueAmount) {
        return {
          ok: false,
          text: `Ditolak Aturan R2: Investor berstatus ritel. Saldo saat ini (${formatEther(investorBalance)} KPON) ditambah penerbitan baru akan melebihi pagu maksimal 5.000 KPON (Rp5 Miliar).`,
        };
      }
    }
    return {
      ok: true,
      text: "Memenuhi semua syarat kepatuhan: Kuota tersedia dan investor berhak menerima obligasi.",
    };
  }, [
    isAddressValid,
    parsedIssueAmount,
    seriesCap,
    totalSupply,
    hasResidency,
    hasAccredited,
    retailCap,
    investorBalance,
  ]);

  // Actions
  const handleGrantClaim = async () => {
    if (!isAddressValid) {
      notification.error("Masukkan alamat investor yang valid.");
      return;
    }
    setIsProcessingClaim(true);
    try {
      await writeClaimRegistry({
        functionName: "grantClaim",
        args: [investorAddress, selectedClaim === "RESIDENCY_ID" ? RESIDENCY_ID : ACCREDITED],
      });
      notification.success(
        `Izin ${selectedClaim === "RESIDENCY_ID" ? "KTP WNI" : "Institusi"} berhasil diterbitkan untuk ${investorAddress.slice(0, 6)}…`,
      );
      await Promise.all([refetchResidency(), refetchAccredited()]);
    } catch (err) {
      notification.error(translateRegistrarError(err), { duration: 7000 });
    } finally {
      setIsProcessingClaim(false);
    }
  };

  const handleRevokeClaim = async () => {
    if (!isAddressValid) {
      notification.error("Masukkan alamat investor yang valid.");
      return;
    }
    setIsProcessingClaim(true);
    try {
      await writeClaimRegistry({
        functionName: "revokeClaim",
        args: [investorAddress, selectedClaim === "RESIDENCY_ID" ? RESIDENCY_ID : ACCREDITED],
      });
      notification.success(
        `Izin ${selectedClaim === "RESIDENCY_ID" ? "KTP WNI" : "Institusi"} dicabut dari ${investorAddress.slice(0, 6)}…`,
      );
      await Promise.all([refetchResidency(), refetchAccredited()]);
    } catch (err) {
      notification.error(translateRegistrarError(err), { duration: 7000 });
    } finally {
      setIsProcessingClaim(false);
    }
  };

  const handleIssueTranche = async () => {
    if (!isAddressValid || !parsedIssueAmount || !issuanceValidation.ok) {
      notification.error(issuanceValidation.text);
      return;
    }
    setIsIssuingTokens(true);
    try {
      await writeToken({
        functionName: "issue",
        args: [investorAddress, parsedIssueAmount],
      });
      notification.success(`Berhasil menerbitkan ${issueAmount} KPON ke dompet investor.`);
      setIssueAmount("");
      await Promise.all([refetchSupply(), refetchBalance()]);
    } catch (err) {
      notification.error(translateRegistrarError(err), { duration: 7000 });
    } finally {
      setIsIssuingTokens(false);
    }
  };

  // Safe numbers for summary
  const currentSupplyNum = totalSupply ? Number(formatEther(totalSupply)) : 2000;
  const seriesCapNum = seriesCap ? Number(formatEther(seriesCap)) : 100000;
  const remainingNum = Math.max(0, seriesCapNum - currentSupplyNum);
  const percentageIssued = Math.min(100, (currentSupplyNum / seriesCapNum) * 100);

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EC] text-[#14201C] selection:bg-kupon-gold/30">
      {/* Subtle Background Watermark */}
      <div className="absolute right-0 top-16 pointer-events-none opacity-[0.03] overflow-hidden">
        <GuillochePattern variant="seal" width={560} height={560} color="emerald" />
      </div>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 pb-20 relative z-10 flex flex-col gap-8">
        {/* ===================================================================== */}
        {/* 1. HEADER & INTENT */}
        {/* ===================================================================== */}
        <header className="flex flex-col gap-4 border-b border-kupon-gold/30 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-kupon-ink tracking-tight m-0">
                Registrar Portal
              </h1>
              <p className="text-sm text-kupon-ink/75 font-sans mt-1 max-w-xl leading-relaxed m-0">
                Pusat pendaftaran identitas investor (KYC / KSEI SID) dan penerbitan obligasi negara ritel dalam batas
                kuota resmi.
              </p>
            </div>

            {/* Authority Status Pill */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto bg-[#F4EEDC] px-3.5 py-2 rounded border border-kupon-gold/40 text-xs font-sans">
              <span
                className={`w-2 h-2 rounded-full ${
                  isCurrentActionAuthorized ? "bg-kupon-emerald animate-pulse" : "bg-kupon-gold"
                }`}
              />
              <div className="flex flex-col">
                <span className="font-medium text-kupon-ink">
                  {isCurrentActionAuthorized ? "Petugas Berwenang" : "Mode Peninjau (Read-Only)"}
                </span>
                <span className="text-[11px] text-kupon-ink/65 font-mono">
                  {connectedAddress
                    ? `${connectedAddress.slice(0, 6)}…${connectedAddress.slice(-4)}`
                    : "Belum Terhubung"}
                </span>
              </div>
            </div>
          </div>

          {/* Simple Quota Bar */}
          <div className="bg-[#F8F3E5] p-4 rounded border border-kupon-gold/40 flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between text-xs font-sans text-kupon-ink/75">
              <span>
                Kupon Terbit:{" "}
                <strong className="text-kupon-emerald font-mono">
                  {currentSupplyNum.toLocaleString("id-ID")} KPON
                </strong>{" "}
                (Rp{currentSupplyNum.toLocaleString("id-ID")} Juta)
              </span>
              <span>
                Sisa Kuota:{" "}
                <strong className="text-kupon-gold font-mono">{remainingNum.toLocaleString("id-ID")} KPON</strong> dari
                total 100.000 KPON
              </span>
            </div>
            <div className="w-full bg-[#E6DDC4] h-2 rounded-full overflow-hidden">
              <div
                className="bg-kupon-emerald h-full transition-all duration-500 rounded-full"
                style={{ width: `${percentageIssued}%` }}
              />
            </div>
          </div>

          {/* Polite notice if guest */}
          {connectedAddress && !hasRegistrarAuthority && (
            <div className="bg-[#FAF1DF] p-3 rounded border border-kupon-gold/60 text-xs text-kupon-ink flex items-start gap-2.5">
              <InformationCircleIcon className="w-4 h-4 text-kupon-gold shrink-0 mt-0.5" />
              <p className="m-0 leading-relaxed">
                Anda masuk sebagai peninjau. Anda dapat memeriksa status akun mana pun. Untuk menandatangani persetujuan
                identitas atau penerbitan baru ke blockchain, gunakan dompet otoritas (
                <code className="font-mono text-[11px] bg-base-200 px-1 py-0.5 rounded">
                  {DEPLOYER_AUTHORITY_ADDRESS}
                </code>
                ).
              </p>
            </div>
          )}
        </header>

        {/* ===================================================================== */}
        {/* 2. UNIFIED INVESTOR ACCOUNT FINDER */}
        {/* ===================================================================== */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-serif font-bold text-kupon-ink">
              1. Pilih atau Masukkan Alamat Investor
            </label>
            <p className="text-xs text-kupon-ink/70 font-sans m-0">
              Tentukan dompet investor yang ingin diverifikasi identitasnya atau diberikan alokasi kupon.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <AddressInput
              value={investorAddress}
              onChange={setInvestorAddress}
              placeholder="Masukkan alamat dompet Ethereum (0x...)"
            />

            {/* Preset Shortcuts */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-sans">
              <span className="text-kupon-ink/60">Pintasan Cepat:</span>
              {connectedAddress && (
                <button
                  type="button"
                  onClick={() => setInvestorAddress(connectedAddress)}
                  className="px-2.5 py-1 rounded bg-[#F4EEDC] border border-kupon-gold/50 text-kupon-emerald hover:bg-kupon-gold/20 font-mono text-[11px] cursor-pointer"
                >
                  Dompet Saya
                </button>
              )}
              {DEMO_PRESETS.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setInvestorAddress(preset.address)}
                  className="px-2.5 py-1 rounded bg-[#F4EEDC] border border-kupon-gold/50 text-kupon-ink/80 hover:bg-kupon-gold/20 font-sans text-xs cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Investor Profile Card */}
          {isAddressValid && (
            <div className="bg-[#F8F3E5] p-5 rounded certificate-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-kupon-ink/60">Alamat Terpilih:</span>
                  <Address address={investorAddress} size="sm" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-kupon-ink/75 font-sans">Status Verifikasi:</span>
                  {hasAccredited ? (
                    <span className="badge bg-kupon-gold text-kupon-ink border-kupon-gold font-sans text-xs">
                      Institusi / Akreditasi (Bebas Batas)
                    </span>
                  ) : hasResidency ? (
                    <span className="badge bg-kupon-emerald text-kupon-ivory border-kupon-emerald font-sans text-xs">
                      KTP WNI Terdaftar (Maks Rp5 Miliar)
                    </span>
                  ) : (
                    <span className="badge bg-base-300 text-kupon-ink/70 border-base-300 font-sans text-xs">
                      Belum Terverifikasi (Aset Dibekukan)
                    </span>
                  )}
                </div>
              </div>

              <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-kupon-gold/30 pt-3 sm:pt-0 sm:pl-6">
                <span className="text-xs font-mono text-kupon-ink/60">Saldo Obligasi Saat Ini</span>
                <div className="text-2xl font-serif font-bold text-kupon-ink mt-0.5">
                  {investorBalance !== undefined ? formatEther(investorBalance) : "0"}{" "}
                  <span className="text-xs font-sans font-normal text-kupon-ink/70">KPON</span>
                </div>
                <span className="text-[11px] text-kupon-ink/60 font-sans">
                  ≈ Rp
                  {investorBalance !== undefined
                    ? Number(formatEther(investorBalance)).toLocaleString("id-ID")
                    : "0"}{" "}
                  Juta
                </span>
              </div>
            </div>
          )}
        </section>

        {/* ===================================================================== */}
        {/* 3. STEP 2: SELECT ACTION (TABS) */}
        {/* ===================================================================== */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-serif font-bold text-kupon-ink">
              2. Pilih Tindakan yang Ingin Dilakukan
            </label>
            <p className="text-xs text-kupon-ink/70 font-sans m-0">
              Lakukan verifikasi KTP/institusi atau terbitkan kupon baru ke alamat di atas.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-2 gap-3 border-b border-kupon-gold/30 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("verify")}
              className={`p-3.5 rounded text-left border transition-all cursor-pointer flex items-center gap-3 ${
                activeTab === "verify"
                  ? "bg-[#F3EEDB] border-kupon-emerald shadow-sm ring-1 ring-kupon-emerald"
                  : "bg-[#FAF6EC] border-kupon-gold/30 hover:border-kupon-gold/60"
              }`}
            >
              <IdentificationIcon className="w-5 h-5 text-kupon-emerald shrink-0" />
              <div>
                <div className="font-serif font-bold text-sm text-kupon-ink">Verifikasi Identitas (KYC)</div>
                <div className="text-[11px] text-kupon-ink/70 font-sans mt-0.5">
                  Pemberian atau pencabutan izin KTP WNI / Institusi
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("issue")}
              className={`p-3.5 rounded text-left border transition-all cursor-pointer flex items-center gap-3 ${
                activeTab === "issue"
                  ? "bg-[#F3EEDB] border-kupon-gold shadow-sm ring-1 ring-kupon-gold"
                  : "bg-[#FAF6EC] border-kupon-gold/30 hover:border-kupon-gold/60"
              }`}
            >
              <PlusCircleIcon className="w-5 h-5 text-kupon-gold shrink-0" />
              <div>
                <div className="font-serif font-bold text-sm text-kupon-ink">Terbitkan Kupon (Mint)</div>
                <div className="text-[11px] text-kupon-ink/70 font-sans mt-0.5">
                  Kirim obligasi baru ke investor yang telah lolos verifikasi
                </div>
              </div>
            </button>
          </div>

          {/* ================================================================= */}
          {/* TAB 1 CONTENT: VERIFIKASI IDENTITAS */}
          {/* ================================================================= */}
          {activeTab === "verify" && (
            <div className="bg-[#FAF6EC] p-6 rounded certificate-border flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-serif font-bold text-kupon-ink m-0">Verifikasi Identitas Investor</h3>
                <p className="text-xs text-kupon-ink/75 font-sans mt-1 leading-relaxed m-0">
                  Investor wajib memegang bukti identitas resmi di smart contract sebelum diperbolehkan membeli atau
                  menerima obligasi negara.
                </p>
              </div>

              {/* Claim Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedClaim("RESIDENCY_ID")}
                  className={`p-4 rounded text-left border transition-all cursor-pointer ${
                    selectedClaim === "RESIDENCY_ID"
                      ? "bg-[#F3EEDB] border-kupon-emerald shadow-sm"
                      : "bg-[#FAF6EC] border-kupon-gold/30 hover:border-kupon-gold/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-serif font-bold text-sm text-kupon-emerald">KTP WNI (Investor Ritel)</span>
                    <span className="text-[10px] font-mono bg-base-200 px-1.5 py-0.5 rounded text-kupon-ink/60">
                      RESIDENCY_ID
                    </span>
                  </div>
                  <p className="text-xs text-kupon-ink/75 font-sans m-0 leading-relaxed">
                    Untuk warga negara Indonesia perorangan. Memenuhi syarat kepemilikan SBN ritel dengan batas
                    pembelian maksimal Rp5 Miliar (5.000 KPON).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedClaim("ACCREDITED")}
                  className={`p-4 rounded text-left border transition-all cursor-pointer ${
                    selectedClaim === "ACCREDITED"
                      ? "bg-[#F3EEDB] border-kupon-gold shadow-sm"
                      : "bg-[#FAF6EC] border-kupon-gold/30 hover:border-kupon-gold/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-serif font-bold text-sm text-kupon-gold">Institusi / Akreditasi</span>
                    <span className="text-[10px] font-mono bg-base-200 px-1.5 py-0.5 rounded text-kupon-ink/60">
                      ACCREDITED
                    </span>
                  </div>
                  <p className="text-xs text-kupon-ink/75 font-sans m-0 leading-relaxed">
                    Untuk badan hukum, perbankan, dan pengelola dana. Bebas dari batas maksimal kepemilikan ritel untuk
                    likuiditas pasar institusional.
                  </p>
                </button>
              </div>

              {/* Status Hint */}
              {isAddressValid && (
                <div className="text-xs font-sans text-kupon-ink/80 bg-[#F4EEDC] p-3 rounded border border-kupon-gold/30 flex items-center gap-2">
                  <InformationCircleIcon className="w-4 h-4 text-kupon-emerald shrink-0" />
                  <span>
                    Status saat ini untuk {selectedClaim === "RESIDENCY_ID" ? "KTP WNI" : "Institusi"}:{" "}
                    <strong>{currentClaimActive ? "Sudah Aktif ✓" : "Belum Memiliki Izin ✗"}</strong>
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleGrantClaim}
                  disabled={isProcessingClaim || !isAddressValid || currentClaimActive}
                  className="btn btn-primary font-sans font-medium text-kupon-ivory flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {isProcessingClaim ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <UserPlusIcon className="w-4 h-4" />
                  )}
                  <span>Berikan Izin ({selectedClaim === "RESIDENCY_ID" ? "KTP WNI" : "Institusi"})</span>
                </button>

                <button
                  type="button"
                  onClick={handleRevokeClaim}
                  disabled={isProcessingClaim || !isAddressValid || !currentClaimActive}
                  className="btn btn-outline border-error text-error hover:bg-error/10 font-sans font-medium flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                >
                  {isProcessingClaim ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <MinusCircleIcon className="w-4 h-4" />
                  )}
                  <span>Cabut Izin (Bekukan Dompet)</span>
                </button>
              </div>

              <p className="text-[11px] text-kupon-ink/60 font-sans m-0 leading-relaxed">
                Catatan Penting: Mencabut semua izin dari investor akan membekukan kemampuan transfer keluar akun
                tersebut (Aturan Kepatuhan R3). Saldo tetap aman di dalam dompet investor namun tidak dapat dipindahkan
                sebelum izin diberikan kembali.
              </p>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2 CONTENT: PENERBITAN KUPON */}
          {/* ================================================================= */}
          {activeTab === "issue" && (
            <div className="bg-[#FAF6EC] p-6 rounded certificate-border flex flex-col gap-6">
              <div>
                <h3 className="text-lg font-serif font-bold text-kupon-ink m-0">Terbitkan Kupon Obligasi Baru</h3>
                <p className="text-xs text-kupon-ink/75 font-sans mt-1 leading-relaxed m-0">
                  Menerbitkan token obligasi langsung dari kas negara ke dompet investor yang telah lolos verifikasi.
                </p>
              </div>

              {/* Amount Input */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="font-medium text-kupon-ink">Jumlah Kupon yang Diterbitkan</span>
                  <span className="text-kupon-ink/60 font-mono">1 KPON = 1 Lembar = Rp1.000.000</span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={issueAmount}
                    onChange={e => setIssueAmount(e.target.value)}
                    placeholder="Contoh: 500"
                    className="input input-bordered w-full font-mono text-lg bg-[#F8F3E5] border-kupon-gold/40 text-kupon-ink focus:border-kupon-emerald focus:outline-none pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-kupon-ink/50 pointer-events-none">
                    KPON
                  </span>
                </div>

                {/* Quick Nominal Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-sans">
                  <span className="text-kupon-ink/60">Pilihan Nominal Cepat:</span>
                  {[
                    { label: "100 KPON (Rp100 Jt)", val: "100" },
                    { label: "500 KPON (Rp500 Jt)", val: "500" },
                    { label: "1.000 KPON (Rp1 M)", val: "1000" },
                    { label: "5.000 KPON (Maks Ritel)", val: "5000" },
                  ].map(chip => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setIssueAmount(chip.val)}
                      className="px-2.5 py-1 rounded bg-[#F4EEDC] border border-kupon-gold/40 text-kupon-ink hover:bg-kupon-gold/20 font-sans text-xs cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Eligibility Check Alert */}
              <div
                className={`p-4 rounded border text-xs font-sans leading-relaxed flex items-start gap-2.5 transition-colors ${
                  isAddressValid && parsedIssueAmount !== undefined && parsedIssueAmount > 0n
                    ? issuanceValidation.ok
                      ? "bg-[#EEF7F2] border-kupon-emerald text-kupon-emerald"
                      : "bg-[#FDF2F1] border-error text-error"
                    : "bg-[#F3EEDB] border-kupon-gold/40 text-kupon-ink/75"
                }`}
              >
                {isAddressValid && parsedIssueAmount !== undefined && parsedIssueAmount > 0n ? (
                  issuanceValidation.ok ? (
                    <CheckCircleIcon className="w-5 h-5 text-kupon-emerald shrink-0 mt-0.5" />
                  ) : (
                    <ExclamationCircleIcon className="w-5 h-5 text-error shrink-0 mt-0.5" />
                  )
                ) : (
                  <InformationCircleIcon className="w-5 h-5 text-kupon-gold shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold mb-0.5">
                    {isAddressValid && parsedIssueAmount !== undefined && parsedIssueAmount > 0n
                      ? issuanceValidation.ok
                        ? "Syarat Penerbitan Terpenuhi"
                        : "Penerbitan Belum Memenuhi Syarat"
                      : "Pemeriksaan Kepatuhan Otomatis"}
                  </div>
                  <p className="m-0 text-kupon-ink/80">{issuanceValidation.text}</p>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleIssueTranche}
                disabled={isIssuingTokens || !issuanceValidation.ok}
                className="btn btn-primary font-sans font-medium text-kupon-ivory flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {isIssuingTokens ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : (
                  <KeyIcon className="w-4 h-4" />
                )}
                <span>Konfirmasi & Terbitkan {issueAmount ? `${issueAmount} KPON` : "Obligasi"}</span>
              </button>
            </div>
          )}
        </section>

        {/* ===================================================================== */}
        {/* 4. FOOTER REFERENCE & NAVIGATION */}
        {/* ===================================================================== */}
        <footer className="flex flex-wrap items-center justify-between border-t border-kupon-gold/30 pt-6 text-xs text-kupon-ink/70 font-sans gap-4">
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-kupon-emerald hover:underline font-medium">
              ← Kembali ke Aplikasi Investor
            </Link>
            <span>·</span>
            <Link href="/regulator" className="text-kupon-gold hover:underline font-medium">
              Buka Terminal Pengawas (Regulator) →
            </Link>
          </div>
          <div className="font-mono text-[11px] text-kupon-ink/60">
            Smart Contract: <code className="text-kupon-emerald">KuponClaimRegistry.sol</code> &{" "}
            <code className="text-kupon-gold">KuponToken.sol</code>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default RegistrarPage;
