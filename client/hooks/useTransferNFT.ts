/**
 * Hook for transferring Land Ownership NFTs
 */

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESSES, LandTransferContractABI } from "@/lib/contracts";
import { toast } from "sonner";

export function useTransferNFT() {
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferId, setTransferId] = useState<bigint | null>(null);

  const {
    data: hash,
    error: writeError,
    writeContract,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  /**
   * Initiate NFT transfer
   * @param tokenId - The token ID to transfer
   * @param recipientAddress - The recipient's wallet address
   * @param note - Optional note/message (will be stored on-chain)
   */
  const transferNFT = async (
    tokenId: string,
    recipientAddress: `0x${string}`,
    note?: string
  ) => {
    try {
      setIsTransferring(true);

      // Call initiateTransfer on LandTransferContract
      // This will immediately transfer the NFT (no admin approval needed)
      writeContract({
        address: CONTRACT_ADDRESSES.LandTransferContract,
        abi: LandTransferContractABI,
        functionName: "initiateTransfer",
        args: [
          BigInt(tokenId),
          recipientAddress,
          note || "", // legalDocumentCid - can be empty or contain notes
        ],
      });
    } catch (error: any) {
      console.error("Transfer error:", error);
      toast.error(error.message || "Failed to initiate transfer");
      setIsTransferring(false);
      throw error;
    }
  };

  return {
    transferNFT,
    isTransferring: isTransferring || isConfirming,
    isConfirmed,
    hash,
    error: writeError,
    transferId,
  };
}
