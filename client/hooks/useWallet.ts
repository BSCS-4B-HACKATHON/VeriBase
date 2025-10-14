import { useAccount, useDisconnect, useWalletClient } from "wagmi";

/**
 * Compatibility hook that mimics the old useWallet API
 * This makes migration easier for existing components
 */
export function useWallet() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: walletClient } = useWalletClient();

  const disconnectWallet = async () => {
    disconnect();
  };

  return {
    address: address ?? null,
    isConnected,
    walletClient: walletClient ?? null,
    connecting: false, // Wagmi handles this internally
    connect: async () => {
      // This should be handled by the ConnectWallet component
      console.warn("Use the ConnectWallet component to connect");
    },
    disconnectWallet,
  };
}
