/**
 * Smart Contract Configuration for Server
 * Handles contract interactions with viem
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import NationalIdNFTArtifact from "../abis/NationalIdNFT.json";
import LandOwnershipNFTArtifact from "../abis/LandOwnershipNFT.json";
import LandTransferContractArtifact from "../abis/LandTransferContract.json";

// Contract addresses from environment
export const CONTRACT_ADDRESSES = {
  NationalIdNFT: (process.env.NATIONAL_ID_NFT_ADDRESS ||
    "0xbe5fb46274763165a8e9bda180273b75d817fec0") as `0x${string}`,
  LandOwnershipNFT: (process.env.LAND_OWNERSHIP_NFT_ADDRESS ||
    "0xdfaf754cc95a9060bd6e467a652f9642e9e33c26") as `0x${string}`,
  LandTransferContract: (process.env.LAND_TRANSFER_CONTRACT_ADDRESS ||
    "0xecc7d23c7d82bbaf59cd0b40329d24fd42617467") as `0x${string}`,
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
 * Create a wallet client for writing to contracts
 * Use the admin private key from environment
 */
export function createAdminWalletClient() {
  const privateKey = process.env.ADMIN_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("ADMIN_PRIVATE_KEY not found in environment variables");
  }

  const account = privateKeyToAccount(
    privateKey.startsWith("0x")
      ? (privateKey as `0x${string}`)
      : (`0x${privateKey}` as `0x${string}`)
  );

  return createWalletClient({
    account,
    chain: baseSepolia,
    transport: http("https://sepolia.base.org"),
  });
}

/**
 * Mint a National ID NFT
 * @param recipientAddress - Address to receive the NFT
 * @param metadata - Metadata for the NFT
 * @returns Transaction hash
 */
export async function mintNationalIdNFT(
  recipientAddress: `0x${string}`,
  metadata: {
    requestType: string;
    minimalPublicLabel: string;
    metadataCid: string;
    metadataHash: string;
    uploaderSignature: string;
    consentTextVersion: string;
    consentTimestamp: number;
  }
): Promise<`0x${string}`> {
  const walletClient = createAdminWalletClient();

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESSES.NationalIdNFT,
    abi: NationalIdNFTABI,
    functionName: "mintNationalId",
    args: [
      recipientAddress,
      metadata.requestType,
      metadata.minimalPublicLabel,
      metadata.metadataCid,
      metadata.metadataHash,
      metadata.uploaderSignature,
      metadata.consentTextVersion,
      BigInt(metadata.consentTimestamp),
    ],
  });

  console.log("✅ National ID NFT mint transaction:", hash);
  return hash;
}

/**
 * Mint a Land Ownership NFT
 * @param recipientAddress - Address to receive the NFT
 * @param metadata - Metadata for the NFT
 * @returns Transaction hash
 */
export async function mintLandOwnershipNFT(
  recipientAddress: `0x${string}`,
  metadata: {
    requestType: string;
    minimalPublicLabel: string;
    metadataCid: string;
    metadataHash: string;
    uploaderSignature: string;
    consentTextVersion: string;
    consentTimestamp: number;
  }
): Promise<`0x${string}`> {
  const walletClient = createAdminWalletClient();

  const hash = await walletClient.writeContract({
    address: CONTRACT_ADDRESSES.LandOwnershipNFT,
    abi: LandOwnershipNFTABI,
    functionName: "mintLandOwnership",
    args: [
      recipientAddress,
      metadata.requestType,
      metadata.minimalPublicLabel,
      metadata.metadataCid,
      metadata.metadataHash,
      metadata.uploaderSignature,
      metadata.consentTextVersion,
      BigInt(metadata.consentTimestamp),
    ],
  });

  console.log("✅ Land Ownership NFT mint transaction:", hash);
  return hash;
}

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
  console.log("✅ Transaction confirmed:", {
    hash,
    blockNumber: receipt.blockNumber,
    status: receipt.status,
  });
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
