/**
 * Smart Contract Configuration for Server
 * Handles contract interactions with viem
 */

import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import NationalIdNFTArtifact from "../abis/NationalIdNFT.json";
import LandOwnershipNFTArtifact from "../abis/LandOwnershipNFT.json";
import LandTransferContractArtifact from "../abis/LandTransferContract.json";

// Contract addresses from environment
export const CONTRACT_ADDRESSES = {
  NationalIdNFT: (process.env.NATIONAL_ID_NFT_ADDRESS ||
    "0xd8bf551a8942cbacab7888444d67cb5cd1212803") as `0x${string}`,
  LandOwnershipNFT: (process.env.LAND_OWNERSHIP_NFT_ADDRESS ||
    "0x7a92bc6623a98c272d69fc615d8483280370401c") as `0x${string}`,
  LandTransferContract: (process.env.LAND_TRANSFER_CONTRACT_ADDRESS ||
    "0xe8d3510b1938b7bd91bf9c1fc86f7af24e9bab83") as `0x${string}`,
} as const;

// Export ABIs
export const NationalIdNFTABI = NationalIdNFTArtifact.abi;
export const LandOwnershipNFTABI = LandOwnershipNFTArtifact.abi;
export const LandTransferContractABI = LandTransferContractArtifact.abi;

// Create public client for reading from contracts
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
});

/**
 * Check if an address has a National ID NFT
 * @param address - Address to check
 * @returns true if address has a National ID NFT
 */
export async function hasNationalIdNFT(
  address: `0x${string}`
): Promise<boolean> {
  const hasId = (await publicClient.readContract({
    address: CONTRACT_ADDRESSES.NationalIdNFT,
    abi: NationalIdNFTABI,
    functionName: "hasNationalId",
    args: [address],
  })) as boolean;

  return hasId;
}

/**
 * Check if metadata is unique for National ID
 * @param metadataHash - Hash of metadata
 * @returns true if unique
 */
export async function isNationalIdMetadataUnique(
  metadataHash: string
): Promise<boolean> {
  const isUnique = (await publicClient.readContract({
    address: CONTRACT_ADDRESSES.NationalIdNFT,
    abi: NationalIdNFTABI,
    functionName: "isMetadataUnique",
    args: [metadataHash],
  })) as boolean;

  return isUnique;
}

/**
 * Check if metadata is unique for Land Ownership
 * @param metadataHash - Hash of metadata
 * @returns true if unique
 */
export async function isLandOwnershipMetadataUnique(
  metadataHash: string
): Promise<boolean> {
  const isUnique = (await publicClient.readContract({
    address: CONTRACT_ADDRESSES.LandOwnershipNFT,
    abi: LandOwnershipNFTABI,
    functionName: "isMetadataUnique",
    args: [metadataHash],
  })) as boolean;

  return isUnique;
}

/**
 * Get the number of land parcels owned by an address
 * @param address - Address to check
 * @returns Number of land parcels
 */
export async function getLandBalance(address: `0x${string}`): Promise<bigint> {
  const balance = (await publicClient.readContract({
    address: CONTRACT_ADDRESSES.LandOwnershipNFT,
    abi: LandOwnershipNFTABI,
    functionName: "balanceOf",
    args: [address],
  })) as bigint;

  return balance;
}

/**
 * Get National ID token metadata
 * @param tokenId - Token ID
 * @returns Metadata object
 */
export async function getNationalIdMetadata(tokenId: bigint): Promise<any> {
  const metadata = await publicClient.readContract({
    address: CONTRACT_ADDRESSES.NationalIdNFT,
    abi: NationalIdNFTABI,
    functionName: "getMetadata",
    args: [tokenId],
  });

  return metadata;
}

/**
 * Get Land Ownership token metadata
 * @param tokenId - Token ID
 * @returns Metadata object
 */
export async function getLandOwnershipMetadata(tokenId: bigint): Promise<any> {
  const metadata = await publicClient.readContract({
    address: CONTRACT_ADDRESSES.LandOwnershipNFT,
    abi: LandOwnershipNFTABI,
    functionName: "getMetadata",
    args: [tokenId],
  });

  return metadata;
}

/**
 * Wait for a transaction to be confirmed
 * @param hash - Transaction hash
 * @returns Transaction receipt
 */
export async function waitForTransaction(hash: `0x${string}`) {
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  // console.log("✅ Transaction confirmed:", {
  //   hash,
  //   blockNumber: receipt.blockNumber,
  //   status: receipt.status,
  // });
  return receipt;
}

// Export contract configs for direct use
export const CONTRACTS = {
  NationalIdNFT: {
    address: CONTRACT_ADDRESSES.NationalIdNFT,
    abi: NationalIdNFTABI,
  },
  LandOwnershipNFT: {
    address: CONTRACT_ADDRESSES.LandOwnershipNFT,
    abi: LandOwnershipNFTABI,
  },
  LandTransferContract: {
    address: CONTRACT_ADDRESSES.LandTransferContract,
    abi: LandTransferContractABI,
  },
} as const;
