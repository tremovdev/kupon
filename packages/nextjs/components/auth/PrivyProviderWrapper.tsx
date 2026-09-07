"use client";

import React, { createContext, useContext } from "react";
import { PrivyProvider, usePrivy as useOfficialPrivy } from "@privy-io/react-auth";
import { notification } from "~~/utils/scaffold-eth";

export interface SafePrivyUser {
  email?: { address: string };
  google?: { email: string };
  wallet?: { address: string };
}

export interface SafePrivyContextType {
  ready: boolean;
  authenticated: boolean;
  user: SafePrivyUser | null;
  login: () => void;
  logout: () => void;
  isConfigured: boolean;
}

const SafePrivyContext = createContext<SafePrivyContextType>({
  ready: true,
  authenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  isConfigured: false,
});

export const useSafePrivy = () => {
  return useContext(SafePrivyContext);
};

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
// Activate official Privy SDK when a real app ID is provided (supports both legacy 'cl...' and modern 'cm...' formats)
const IS_PRIVY_CONFIGURED = Boolean(
  PRIVY_APP_ID && PRIVY_APP_ID.trim() !== "" && !PRIVY_APP_ID.includes("placeholder") && PRIVY_APP_ID.length > 10,
);

// Bridge when Privy is configured
const ActivePrivyBridge = ({ children }: { children: React.ReactNode }) => {
  const official = useOfficialPrivy();
  return (
    <SafePrivyContext.Provider
      value={{
        ready: official.ready,
        authenticated: official.authenticated,
        user: official.user as SafePrivyUser | null,
        login: official.login,
        logout: official.logout,
        isConfigured: true,
      }}
    >
      {children}
    </SafePrivyContext.Provider>
  );
};

// Fallback bridge when NEXT_PUBLIC_PRIVY_APP_ID is not configured in local environment
const MockPrivyBridge = ({ children }: { children: React.ReactNode }) => {
  return (
    <SafePrivyContext.Provider
      value={{
        ready: true,
        authenticated: false,
        user: null,
        login: () => {
          notification.info(
            "Privy Social Auth is active. Set NEXT_PUBLIC_PRIVY_APP_ID in your .env.local or Vercel settings to connect your live Privy console.",
            { duration: 6000 },
          );
        },
        logout: () => {},
        isConfigured: false,
      }}
    >
      {children}
    </SafePrivyContext.Provider>
  );
};

export const PrivyProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  if (!IS_PRIVY_CONFIGURED) {
    return <MockPrivyBridge>{children}</MockPrivyBridge>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID as string}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#0E5E4A",
          logo: "/kupon-logo.svg",
        },
        loginMethods: ["email", "wallet", "google"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <ActivePrivyBridge>{children}</ActivePrivyBridge>
    </PrivyProvider>
  );
};
