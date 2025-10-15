/**
 * Smart Contract Configuration
 * Deployed on Base Sepolia - October 15, 2025
 */

import NationalIdNFTData from "@/src/abis/NationalIdNFT.json";
import LandOwnershipNFTData from "@/src/abis/LandOwnershipNFT.json";
import LandTransferContractData from "@/src/abis/LandTransferContract.json";
import { baseSepolia } from "viem/chains";

// Contract addresses - deployed on Base Sepolia
export const CONTRACT_ADDRESSES = {
  NationalIdNFT: "0xbe5fb46274763165a8e9bda180273b75d817fec0" as `0x${string}`,
  LandOwnershipNFT:
    "0xdfaf754cc95a9060bd6e467a652f9642e9e33c26" as `0x${string}`,
  LandTransferContract:
    "0xecc7d23c7d82bbaf59cd0b40329d24fd42617467" as `0x${string}`,
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
