"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { PrivyAuthButton } from "~~/components/auth/PrivyAuthButton";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  badge?: string;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Framework",
    href: "/framework",
  },
  {
    label: "Investor",
    href: "/app",
  },
  {
    label: "Registrar",
    href: "/registrar",
  },
  {
    label: "Regulator",
    href: "/regulator",
  },
  {
    label: "Debugger",
    href: "/debugger",
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, badge }) => {
        const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <li key={href} className="h-full flex items-center">
            <Link
              href={href}
              passHref
              className={`px-3 py-1.5 rounded-none text-sm font-sans tracking-wide transition-all border-b-2 flex items-center gap-1.5 ${
                isActive
                  ? "border-kupon-emerald text-kupon-emerald font-semibold bg-kupon-ivory/50"
                  : "border-transparent text-kupon-ink/75 hover:text-kupon-emerald hover:border-kupon-gold/50"
              }`}
            >
              <span>{label}</span>
              {badge && (
                <span className="text-[10px] font-mono uppercase px-1 py-0.2 bg-kupon-gold/20 text-kupon-ink rounded border border-kupon-gold/40">
                  {badge}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header with sovereign certificate logo lockup & navigation
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <div className="sticky top-0 navbar bg-base-100 min-h-16 shrink-0 justify-between z-20 border-b border-kupon-gold/30 px-3 sm:px-6 shadow-sm">
      <div className="navbar-start w-auto self-stretch flex items-center">
        <details className="dropdown" ref={burgerMenuRef}>
          <summary className="btn btn-ghost btn-sm lg:hidden hover:bg-transparent px-2">
            <Bars3Icon className="h-5 w-5 text-kupon-ink" />
          </summary>
          <ul
            className="menu menu-compact dropdown-content mt-3 p-3 shadow-lg bg-base-100 rounded border border-kupon-gold/40 w-56 z-50 gap-1"
            onClick={() => {
              burgerMenuRef?.current?.removeAttribute("open");
            }}
          >
            <HeaderMenuLinks />
          </ul>
        </details>

        {/* Brand Logo & Wordmark Lockup */}
        <Link href="/" passHref className="flex items-center gap-2.5 ml-1 mr-6 shrink-0 group">
          <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
            <Image
              src="/kupon-logo.svg"
              alt="Kupon Seal Mark"
              width={40}
              height={40}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-serif font-bold text-lg tracking-tight text-kupon-emerald leading-tight group-hover:text-kupon-gold transition-colors">
              KUPON
            </span>
            <div className="h-[1px] w-full bg-kupon-gold/60 my-0.5" />
            <span className="text-[9px] font-mono tracking-wider text-kupon-ink/75 uppercase font-medium leading-none">
              SBN RITEL 2027 · ONCHAIN
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden lg:flex lg:flex-nowrap h-full m-0 p-0 list-none gap-1 items-center">
          <HeaderMenuLinks />
        </ul>
      </div>

      <div className="navbar-end grow flex items-center justify-end gap-2">
        <PrivyAuthButton compact />
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};
