/**
 * Client-side NFT Minting Hook
 *
 * Users mint their own NFTs and pay gas fees directly from their wallet.
 * This is the decentralized approach - no admin private key needed!
 */

import { useState } from "react";
import { useWalletClient, usePublicClient, useAccount } from "wagmi";
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
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

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

      if (!walletClient) {
        console.log("❌ No wallet client");
        throw new Error("Wallet not ready. Please try again.");
      }

      if (!publicClient) {
        console.log("❌ No public client");
        throw new Error("Public client not available");
      }

      // Check if on correct network
      if (chain?.id !== baseSepolia.id) {
        throw new Error("Please switch to Base Sepolia network in your wallet");
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
      const contractArgs = [
        request.requestType || params.requestType, // requestType
        request.minimalPublicLabel || "Verified Document", // minimalPublicLabel
        request.metadataCid || params.metadataURI, // metadataCid
        request.metadataHash || "", // metadataHash
        request.uploaderSignature || "", // uploaderSignature
        request.consent?.textVersion || "v1.0", // consentTextVersion
        BigInt(
          request.consent?.timestamp
            ? new Date(request.consent.timestamp).getTime()
            : Date.now()
        ), // consentTimestamp
      ];

      // Call mint function on the contract (user mints to themselves)
      // User signs and pays for gas
      const hash = await walletClient.writeContract({
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

      if (
        err.message?.includes("User rejected") ||
        err.message?.includes("User denied")
      ) {
        errorMessage = "Transaction was rejected";
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for gas fees";
      } else if (
        err.message?.includes("estimate") ||
        err.message?.includes("Unable to estimate")
      ) {
        errorMessage =
          "Unable to estimate gas. Try switching to another network and back to Base Sepolia to refresh your wallet connection.";
      } else if (err.message?.includes("WalletAlreadyHasNationalId")) {
        errorMessage = "You already have a National ID NFT";
      } else if (err.message?.includes("DuplicateMetadata")) {
        errorMessage = "This metadata has already been minted";
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
    isReady: isConnected && !!walletClient,
    isWrongNetwork: isConnected && chain?.id !== baseSepolia.id,
    currentChainId: chain?.id,
  };
}
