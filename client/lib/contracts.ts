/**
 * Smart Contract Configuration
 * Deployed on Base Sepolia - October 17, 2025
 */

import NationalIdNFTData from "@/src/abis/NationalIdNFT.json";
import LandOwnershipNFTData from "@/src/abis/LandOwnershipNFT.json";
import LandTransferContractData from "@/src/abis/LandTransferContract.json";
import { baseSepolia } from "viem/chains";

// Contract addresses - deployed on Base Sepolia
export const CONTRACT_ADDRESSES = {
  NationalIdNFT: "0x66fe865e6a737fd58905d2f46d2e952a5633bf4d" as `0x${string}`,
  LandOwnershipNFT:
    "0x5a93b0d7a0e05396f2a4d830ac9bbc4d896ce0ff" as `0x${string}`,
  LandTransferContract:
    "0x9a46b9f558d9dad1973095d0ab3c7c07d1055e0c" as `0x${string}`,
} as const;

// Full contract configs for wagmi
export const CONTRACTS = {
  NationalIdNFT: {
    address: NationalIdNFTData.address as `0x${string}`,
    abi: NationalIdNFTData.abi,
    chainId: baseSepolia.id,
  },
  LandOwnershipNFT: {
    address: LandOwnershipNFTData.address as `0x${string}`,
    abi: LandOwnershipNFTData.abi,
    chainId: baseSepolia.id,
  },
  LandTransferContract: {
    address: LandTransferContractData.address as `0x${string}`,
    abi: LandTransferContractData.abi,
    chainId: baseSepolia.id,
  },
} as const;

export type ContractName = keyof typeof CONTRACTS;

// Export individual ABIs for direct use
export const NationalIdNFTABI = NationalIdNFTData.abi;
export const LandOwnershipNFTABI = LandOwnershipNFTData.abi;
export const LandTransferContractABI = LandTransferContractData.abi;

// Chain info
export const CHAIN = baseSepolia;
