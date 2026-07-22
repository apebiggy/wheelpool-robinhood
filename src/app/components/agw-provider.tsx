"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineChain } from "viem";
import { injected } from "wagmi/connectors";

// ── Robinhood Chain — Arbitrum Orbit L2 ─────────────────────
// Chain ID 4663, ETH gas, EVM-compatible, Chainlink native oracle
// Docs: https://docs.robinhoodchain.com (verify RPC before mainnet deploy)
export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RH_RPC_URL || "https://rpc.robinhoodchain.com"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://explorer.robinhoodchain.com" },
  },
  testnet: false,
});

const config = createConfig({
  chains: [robinhoodChain],
  connectors: [
    injected(), // MetaMask / standard EVM wallets
  ],
  transports: {
    [robinhoodChain.id]: http(),
  },
});

const queryClient = new QueryClient();

export function NextAbstractWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  );
}
