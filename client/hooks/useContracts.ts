/**
 * Contract Interaction Hooks
 *
 * Ready-to-use hooks for interacting with deployed smart contracts
 */

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { CONTRACTS } from "@/lib/contracts";

// ==================== National ID NFT ====================

/**
 * Check if a wallet has a National ID NFT
 */
export function useHasNationalId(address?: `0x${string}`) {
  const { data, ...rest } = useReadContract({
    ...CONTRACTS.NationalIdNFT,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const balance = data as bigint | undefined;

  return {
    hasNationalId: balance ? balance > 0n : false,
    balance,
    ...rest,
  };
}

/**
 * Get National ID token metadata URI
 */
export function useNationalIdTokenURI(tokenId?: bigint) {
  return useReadContract({
    ...CONTRACTS.NationalIdNFT,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

/**
 * Get owner of a National ID token
 */
export function useNationalIdOwner(tokenId?: bigint) {
  return useReadContract({
    ...CONTRACTS.NationalIdNFT,
    functionName: "ownerOf",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

/**
 * Mint a National ID NFT (admin only)
 */
export function useMintNationalId() {
  const {
    writeContract,
    data: hash,
    isPending: writePending,
    isSuccess: writeSuccess,
    ...writeRest
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: confirmSuccess } =
    useWaitForTransactionReceipt({
      hash,
    });

  const mint = (to: `0x${string}`, uri: string) => {
    writeContract({
      ...CONTRACTS.NationalIdNFT,
      functionName: "safeMint",
      args: [to, uri],
    });
  };

  return {
    mint,
    isPending: writePending || isConfirming,
    isSuccess: confirmSuccess,
    hash,
    ...writeRest,
  };
}

// ==================== Land Ownership NFT ====================

/**
 * Get number of land parcels owned by a wallet
 */
export function useLandBalance(address?: `0x${string}`) {
  return useReadContract({
    ...CONTRACTS.LandOwnershipNFT,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

/**
 * Get land token metadata URI
 */
export function useLandTokenURI(tokenId?: bigint) {
  return useReadContract({
    ...CONTRACTS.LandOwnershipNFT,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

/**
 * Get owner of a land token
 */
export function useLandOwner(tokenId?: bigint) {
  return useReadContract({
    ...CONTRACTS.LandOwnershipNFT,
    functionName: "ownerOf",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

/**
 * Check if land is listed for sale
 */
export function useIsLandForSale(tokenId?: bigint) {
  return useReadContract({
    ...CONTRACTS.LandOwnershipNFT,
    functionName: "isForSale",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

/**
 * Get land sale price
 */
export function useLandSalePrice(tokenId?: bigint) {
  return useReadContract({
    ...CONTRACTS.LandOwnershipNFT,
    functionName: "salePrice",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  });
}

/**
 * Mint a Land Ownership NFT (admin only)
 */
export function useMintLand() {
  const {
    writeContract,
    data: hash,
    isPending: writePending,
    isSuccess: writeSuccess,
    ...writeRest
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: confirmSuccess } =
    useWaitForTransactionReceipt({
      hash,
    });

  const mint = (to: `0x${string}`, uri: string) => {
    writeContract({
      ...CONTRACTS.LandOwnershipNFT,
      functionName: "safeMint",
      args: [to, uri],
    });
  };

  return {
    mint,
    isPending: writePending || isConfirming,
    isSuccess: confirmSuccess,
    hash,
    ...writeRest,
  };
}

/**
 * List land for sale
 */
export function useListLandForSale() {
  const {
    writeContract,
    data: hash,
    isPending: writePending,
    isSuccess: writeSuccess,
    ...writeRest
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: confirmSuccess } =
    useWaitForTransactionReceipt({
      hash,
    });

  const listForSale = (tokenId: bigint, price: bigint) => {
    writeContract({
      ...CONTRACTS.LandOwnershipNFT,
      functionName: "listForSale",
      args: [tokenId, price],
    });
  };

  return {
    listForSale,
    isPending: writePending || isConfirming,
    isSuccess: confirmSuccess,
    hash,
    ...writeRest,
  };
}

/**
 * Unlist land from sale
 */
export function useUnlistLandFromSale() {
  const {
    writeContract,
    data: hash,
    isPending: writePending,
    isSuccess: writeSuccess,
    ...writeRest
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: confirmSuccess } =
    useWaitForTransactionReceipt({
      hash,
    });

  const unlist = (tokenId: bigint) => {
    writeContract({
      ...CONTRACTS.LandOwnershipNFT,
      functionName: "unlistFromSale",
      args: [tokenId],
    });
  };

  return {
    unlist,
    isPending: writePending || isConfirming,
    isSuccess: confirmSuccess,
    hash,
    ...writeRest,
  };
}

// ==================== Land Transfer Contract ====================

/**
 * Get transfer fee in basis points (e.g., 250 = 2.5%)
 */
export function useTransferFee() {
  return useReadContract({
    ...CONTRACTS.LandTransferContract,
    functionName: "transferFeeBasisPoints",
  });
}

/**
 * Get fee recipient address
 */
export function useFeeRecipient() {
  return useReadContract({
    ...CONTRACTS.LandTransferContract,
    functionName: "feeRecipient",
  });
}

/**
 * Calculate transfer fee for a given price
 */
export function useCalculateTransferFee(salePrice?: bigint) {
  return useReadContract({
    ...CONTRACTS.LandTransferContract,
    functionName: "calculateFee",
    args: salePrice !== undefined ? [salePrice] : undefined,
    query: {
      enabled: salePrice !== undefined && salePrice > BigInt(0),
    },
  });
}

/**
 * Purchase land through the transfer contract
 * Automatically includes the transfer fee
 */
export function usePurchaseLand() {
  const {
    writeContract,
    data: hash,
    isPending: writePending,
    isSuccess: writeSuccess,
    ...writeRest
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: confirmSuccess } =
    useWaitForTransactionReceipt({
      hash,
    });

  const purchase = (tokenId: bigint, totalPrice: bigint) => {
    writeContract({
      ...CONTRACTS.LandTransferContract,
      functionName: "purchaseLand",
      args: [tokenId],
      value: totalPrice, // Send ETH with transaction
    });
  };

  return {
    purchase,
    isPending: writePending || isConfirming,
    isSuccess: confirmSuccess,
    hash,
    ...writeRest,
  };
}

// ==================== Helper Hooks ====================

/**
 * Complete land purchase flow with automatic fee calculation
 */
export function useLandPurchaseFlow(tokenId?: bigint) {
  const { data: salePrice, isLoading: loadingPrice } =
    useLandSalePrice(tokenId);
  const { data: fee, isLoading: loadingFee } = useCalculateTransferFee(
    salePrice as bigint | undefined
  );
  const { purchase, ...purchaseRest } = usePurchaseLand();

  const salePriceBigInt = salePrice as bigint | undefined;
  const feeBigInt = fee as bigint | undefined;
  const totalPrice =
    salePriceBigInt && feeBigInt ? salePriceBigInt + feeBigInt : undefined;

  const executePurchase = () => {
    if (tokenId !== undefined && totalPrice) {
      purchase(tokenId, totalPrice);
    }
  };

  return {
    salePrice: salePriceBigInt,
    fee: feeBigInt,
    totalPrice,
    isLoading: loadingPrice || loadingFee,
    executePurchase,
    ...purchaseRest,
  };
}

/**
 * Get all data about a land parcel
 */
export function useLandDetails(tokenId?: bigint) {
  const { data: owner } = useLandOwner(tokenId);
  const { data: tokenURI } = useLandTokenURI(tokenId);
  const { data: isForSale } = useIsLandForSale(tokenId);
  const { data: salePrice } = useLandSalePrice(tokenId);

  return {
    owner,
    tokenURI,
    isForSale,
    salePrice,
  };
}
