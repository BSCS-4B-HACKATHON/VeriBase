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
  NationalIdNFT: "0xd8bf551a8942cbacab7888444d67cb5cd1212803" as `0x${string}`,
  LandOwnershipNFT:
    "0x7a92bc6623a98c272d69fc615d8483280370401c" as `0x${string}`,
  LandTransferContract:
    "0xe8d3510b1938b7bd91bf9c1fc86f7af24e9bab83" as `0x${string}`,
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
