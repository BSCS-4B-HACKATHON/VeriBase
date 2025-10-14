import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { coinbaseWallet, metaMask } from "wagmi/connectors";

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    metaMask({
      dappMetadata: {
        name: "Base Own",
      },
    }),
    coinbaseWallet({
      appName: "Base Own",
      preference: "eoaOnly", // Use regular Coinbase Wallet, not smart wallet
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
