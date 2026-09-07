"use client";

import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";

const DEFAULT_PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cly8v03k703s6v78d2w676p2a";

export const PrivyProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <PrivyProvider
      appId={DEFAULT_PRIVY_APP_ID}
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
      {children}
    </PrivyProvider>
  );
};
