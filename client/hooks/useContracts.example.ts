/**
 * Example Contract Hooks
 *
 * These hooks demonstrate how to interact with your deployed contracts
 * using Wagmi and the exported ABIs.
 */

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import NationalIdNFT from "@/abis/NationalIdNFT.json";
import LandOwnershipNFT from "@/abis/LandOwnershipNFT.json";
import LandTransferContract from "@/abis/LandTransferContract.json";

// ==================== National ID NFT ====================

/**
 * Hook to check if a user has a National ID NFT
 */
export function useHasNationalId(address?: `0x${string}`) {
  return useReadContract({
    address: NationalIdNFT.address as `0x${string}`,
    abi: NationalIdNFT.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Hook to get National ID token URI (metadata)
 */
export function useNationalIdTokenURI(tokenId?: bigint) {
  return useReadContract({
    address: NationalIdNFT.address as `0x${string}`,
    abi: NationalIdNFT.abi,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

/**
 * Hook to mint a National ID NFT (admin only)
 */
export function useMintNationalId() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const mint = (to: `0x${string}`, uri: string) => {
    writeContract({
      address: NationalIdNFT.address as `0x${string}`,
      abi: NationalIdNFT.abi,
      functionName: "safeMint",
      args: [to, uri],
    });
  };

  return {
    mint,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
  };
}

// ==================== Land Ownership NFT ====================

/**
 * Hook to get all land NFTs owned by an address
 */
export function useLandBalance(address?: `0x${string}`) {
  return useReadContract({
    address: LandOwnershipNFT.address as `0x${string}`,
    abi: LandOwnershipNFT.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Hook to get land token URI (metadata)
 */
export function useLandTokenURI(tokenId?: bigint) {
  return useReadContract({
    address: LandOwnershipNFT.address as `0x${string}`,
    abi: LandOwnershipNFT.abi,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

/**
 * Hook to check if land is for sale
 */
export function useIsLandForSale(tokenId?: bigint) {
  return useReadContract({
    address: LandOwnershipNFT.address as `0x${string}`,
    abi: LandOwnershipNFT.abi,
    functionName: "isForSale",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

/**
 * Hook to get land sale price
 */
export function useLandSalePrice(tokenId?: bigint) {
  return useReadContract({
    address: LandOwnershipNFT.address as `0x${string}`,
    abi: LandOwnershipNFT.abi,
    functionName: "salePrice",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

/**
 * Hook to mint a Land Ownership NFT (admin only)
 */
export function useMintLand() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const mint = (to: `0x${string}`, uri: string) => {
    writeContract({
      address: LandOwnershipNFT.address as `0x${string}`,
      abi: LandOwnershipNFT.abi,
      functionName: "safeMint",
      args: [to, uri],
    });
  };

  return {
    mint,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
  };
}

/**
 * Hook to list land for sale
 */
export function useListLandForSale() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const listForSale = (tokenId: bigint, price: bigint) => {
    writeContract({
      address: LandOwnershipNFT.address as `0x${string}`,
      abi: LandOwnershipNFT.abi,
      functionName: "listForSale",
      args: [tokenId, price],
    });
  };

  return {
    listForSale,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
  };
}

// ==================== Land Transfer Contract ====================

/**
 * Hook to get transfer fee configuration
 */
export function useTransferFee() {
  return useReadContract({
    address: LandTransferContract.address as `0x${string}`,
    abi: LandTransferContract.abi,
    functionName: "transferFeeBasisPoints",
  });
}

/**
 * Hook to calculate transfer fee for a price
 */
export function useCalculateTransferFee(salePrice?: bigint) {
  return useReadContract({
    address: LandTransferContract.address as `0x${string}`,
    abi: LandTransferContract.abi,
    functionName: "calculateFee",
    args: salePrice !== undefined ? [salePrice] : undefined,
    query: {
      enabled: salePrice !== undefined,
    },
  });
}

/**
 * Hook to purchase land through the transfer contract
 */
export function usePurchaseLand() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const purchase = (tokenId: bigint, totalPrice: bigint) => {
    writeContract({
      address: LandTransferContract.address as `0x${string}`,
      abi: LandTransferContract.abi,
      functionName: "purchaseLand",
      args: [tokenId],
      value: totalPrice, // Send ETH with transaction
    });
  };

  return {
    purchase,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
  };
}

// ==================== Example Usage Component ====================

/**
 * Example component showing how to use these hooks
 */
export function ExampleUsage() {
  const { address } = useWallet(); // Your existing useWallet hook

  // Check if user has National ID
  const { data: nationalIdBalance } = useHasNationalId(address);
  const hasNationalId = nationalIdBalance && nationalIdBalance > 0n;

  // Get user's land balance
  const { data: landBalance } = useLandBalance(address);

  // Mint hooks (for admin actions)
  const { mint: mintNationalId, isPending: isMintingNationalId } =
    useMintNationalId();
  const { mint: mintLand, isPending: isMintingLand } = useMintLand();

  // Purchase hook (for users)
  const { purchase, isPending: isPurchasing } = usePurchaseLand();

  return (
    <div>
      <h2>User Status</h2>
      <p>Has National ID: {hasNationalId ? "Yes" : "No"}</p>
      <p>Land Owned: {landBalance?.toString() ?? "0"}</p>

      {/* Example: Admin minting */}
      <button
        onClick={() => mintNationalId(address!, "ipfs://...")}
        disabled={isMintingNationalId}
      >
        {isMintingNationalId ? "Minting..." : "Mint National ID"}
      </button>

      {/* Example: User purchasing */}
      <button
        onClick={() => purchase(1n, BigInt("1000000000000000000"))} // 1 ETH
        disabled={isPurchasing}
      >
        {isPurchasing ? "Purchasing..." : "Purchase Land"}
      </button>
    </div>
  );
}
