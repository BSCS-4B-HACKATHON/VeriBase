/**
 * Client-side NFT Minting Hook
 *
 * Users mint their own NFTs and pay gas fees directly from their wallet.
 * This is the decentralized approach - no admin private key needed!
 */

import { useState, useEffect } from "react";
import { useWalletClient, usePublicClient, useAccount, useSwitchChain } from "wagmi";
import { parseAbi, encodeFunctionData } from "viem";
import { baseSepolia } from "viem/chains";
import NationalIdNFTABI from "@/src/abis/NationalIdNFT.json";
import LandOwnershipNFTABI from "@/src/abis/LandOwnershipNFT.json";

const NATIONAL_ID_NFT_ADDRESS = process.env
  .NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS as `0x${string}`;
const LAND_OWNERSHIP_NFT_ADDRESS = process.env
  .NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS as `0x${string}`;

export interface MintResult {
  success: boolean;
  tokenId?: bigint;
  transactionHash?: string;
  explorerUrl?: string;
  error?: string;
}

export interface MintParams {
  requestId: string;
  requestType: "national_id" | "land_ownership";
  metadataURI: string; // IPFS URI or metadata URL
}

export function useClientMint() {
  const [isMinting, setIsMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address, isConnected, chain } = useAccount();
  const { data: walletClient, refetch: refetchWalletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: baseSepolia.id });
  const { switchChain, switchChainAsync } = useSwitchChain();

  // Debug: Log wallet client changes
  useEffect(() => {
    console.log("👛 Wallet client updated:", {
      hasClient: !!walletClient,
      isConnected,
      chainId: chain?.id,
      address,
    });
  }, [walletClient, isConnected, chain?.id, address]);

  /**
   * Mint NFT directly from user's wallet
   * User pays gas fees and signs transaction
   */
  const mintNFT = async (params: MintParams): Promise<MintResult> => {
    console.log("🚀 mintNFT function called!");
    console.log("   Params:", params);
    console.log("   Is connected:", isConnected);
    console.log("   Address:", address);
    console.log("   Has wallet client:", !!walletClient);
    console.log("   Chain ID:", chain?.id);

    setIsMinting(true);
    setError(null);

    try {
      // Basic checks
      if (!isConnected || !address) {
        console.log("❌ Not connected or no address");
        throw new Error("Please connect your wallet first.");
      }

      // Try to refetch wallet client if not available
      let currentWalletClient = walletClient;
      if (!currentWalletClient) {
        console.log("⚠️ No wallet client, trying to refetch...");
        const refetchResult = await refetchWalletClient();
        currentWalletClient = refetchResult.data;
        
        if (!currentWalletClient) {
          console.log("❌ Still no wallet client after refetch");
          console.log("   Chain ID:", chain?.id);
          console.log("   Is connected:", isConnected);
          console.log("   Address:", address);
          throw new Error("Wallet not ready. Please disconnect and reconnect your wallet.");
        }
        console.log("✅ Wallet client refetched successfully");
      }

      if (!publicClient) {
        console.log("❌ No public client");
        throw new Error("Public client not available");
      }

      // Check if on correct network and switch if needed
      if (chain?.id !== baseSepolia.id) {
        console.log("⚠️ Wrong network, attempting to switch to Base Sepolia...");
        try {
          if (switchChainAsync) {
            await switchChainAsync({ chainId: baseSepolia.id });
            console.log("✅ Switched to Base Sepolia");
            // Wait a bit for the wallet client to update
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw new Error("Network switching not supported");
          }
        } catch (switchError: any) {
          console.error("❌ Failed to switch network:", switchError);
          throw new Error("Please switch to Base Sepolia network in your wallet");
        }
      }

      // Determine which contract to use
      const contractAddress =
        params.requestType === "national_id"
          ? NATIONAL_ID_NFT_ADDRESS
          : LAND_OWNERSHIP_NFT_ADDRESS;

      const contractABI =
        params.requestType === "national_id"
          ? NationalIdNFTABI.abi
          : LandOwnershipNFTABI.abi;

      if (!contractAddress) {
        throw new Error(
          `Contract address not configured for ${params.requestType}`
        );
      }

      // Fetch full request details from backend
      const BE_URL = process.env.NEXT_PUBLIC_BE_URL;
      if (!BE_URL) {
        throw new Error("Backend URL not configured");
      }

      const requestRes = await fetch(
        `${BE_URL}/api/requests/${address}/${params.requestId}`,
        {
          credentials: "include",
        }
      );

      if (!requestRes.ok) {
        throw new Error(
          `Failed to fetch request details: ${requestRes.status}`
        );
      }

      const requestData = await requestRes.json();

      // Extract the actual request object
      const request = requestData.request || requestData;

      // Determine function name based on request type
      const functionName =
        params.requestType === "national_id"
          ? "mintNationalId"
          : "mintLandOwnership";

      // Prepare contract args
      const consentTimestampMs = request.consent?.timestamp
        ? new Date(request.consent.timestamp).getTime()
        : Date.now();
      
      const contractArgs = [
        request.requestType || params.requestType, // requestType
        request.minimalPublicLabel || "Verified Document", // minimalPublicLabel
        request.metadataCid || params.metadataURI, // metadataCid
        request.metadataHash || "", // metadataHash
        request.uploaderSignature || "", // uploaderSignature
        request.consent?.textVersion || "v1.0", // consentTextVersion
        BigInt(consentTimestampMs), // consentTimestamp
      ];

      console.log("📝 Contract args prepared:");
      console.log("   Contract:", contractAddress);
      console.log("   Function:", functionName);
      console.log("   RequestType:", request.requestType || params.requestType);
      console.log("   Label:", request.minimalPublicLabel || "Verified Document");
      console.log("   CID:", request.metadataCid || params.metadataURI);
      console.log("   Consent timestamp:", consentTimestampMs);

      // Call mint function on the contract (user mints to themselves)
      // User signs and pays for gas
      const hash = await currentWalletClient.writeContract({
        address: contractAddress,
        abi: contractABI,
        functionName,
        args: contractArgs,
        chain: baseSepolia,
      });

      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      // Extract tokenId from Transfer event
      let tokenId: bigint | undefined;

      if (receipt.logs && receipt.logs.length > 0) {
        // Find Transfer event (emitted by ERC721 on mint)
        // event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
        const transferLog = receipt.logs.find(
          (log) =>
            log.topics[0] ===
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        );

        if (transferLog && transferLog.topics[3]) {
          tokenId = BigInt(transferLog.topics[3]);
          console.log("🎫 Token ID:", tokenId.toString());
        }
      }

      const explorerUrl = `https://sepolia.basescan.org/tx/${hash}`;

      // Delete request from backend database after successful mint
      try {
        const BE_URL =
          process.env.NEXT_PUBLIC_BE_URL || "http://localhost:9000";
        await fetch(`${BE_URL}/api/nft/delete-request/${params.requestId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userWalletAddress: address,
            transactionHash: hash,
          }),
        });
        console.log("🗑️  Request deleted from database");
      } catch (backendError) {
        console.warn("Failed to delete request (non-critical):", backendError);
      }

      setIsMinting(false);

      return {
        success: true,
        tokenId,
        transactionHash: hash,
        explorerUrl,
      };
    } catch (err: any) {
      console.error("❌ Minting failed:", err);

      let errorMessage = "Failed to mint NFT";
      
      // Check full error object for contract-specific errors (safely)
      let fullError = "";
      try {
        fullError = JSON.stringify(err, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        );
      } catch {
        fullError = String(err);
      }

      if (
        err.message?.includes("User rejected") ||
        err.message?.includes("User denied")
      ) {
        errorMessage = "Transaction was rejected";
      } else if (
        fullError.includes("WalletAlreadyHasNationalId") ||
        err.message?.includes("WalletAlreadyHasNationalId")
      ) {
        errorMessage = "You already have a National ID NFT. Each wallet can only have one. Try using a different wallet address.";
      } else if (
        fullError.includes("DuplicateMetadata") ||
        err.message?.includes("DuplicateMetadata")
      ) {
        errorMessage = "This metadata has already been minted to another wallet";
      } else if (err.message?.includes("circuit breaker")) {
        errorMessage = "MetaMask rate limit hit. Please wait 2-5 minutes and try again, or switch to a different wallet/network temporarily.";
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees. Get testnet ETH from Base Sepolia faucet.";
      } else if (
        err.message?.includes("estimate") ||
        err.message?.includes("Unable to estimate")
      ) {
        errorMessage =
          "Unable to estimate gas. This might mean the transaction would fail. Check if you already have this NFT.";
      } else if (err.cause?.shortMessage) {
        errorMessage = err.cause.shortMessage;
      } else if (err.shortMessage) {
        errorMessage = err.shortMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setIsMinting(false);

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return {
    mintNFT,
    isMinting,
    error,
    isReady: isConnected && !!walletClient && chain?.id === baseSepolia.id,
    isWrongNetwork: isConnected && chain?.id !== baseSepolia.id,
    currentChainId: chain?.id,
    switchToBaseSepolia: switchChainAsync 
      ? () => switchChainAsync({ chainId: baseSepolia.id })
      : undefined,
  };
}
