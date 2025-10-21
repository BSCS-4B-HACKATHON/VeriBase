/**
 * Hook to fetch user's NFTs from blockchain
 * Reads actual on-chain data - no mock data!
 */

import { useState, useEffect } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { baseSepolia } from "viem/chains";
import NationalIdNFTABI from "@/src/abis/NationalIdNFT.json";
import LandOwnershipNFTABI from "@/src/abis/LandOwnershipNFT.json";

const NATIONAL_ID_NFT_ADDRESS = process.env
  .NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS as `0x${string}`;
const LAND_OWNERSHIP_NFT_ADDRESS = process.env
  .NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS as `0x${string}`;

/**
 * Document metadata structure from smart contract (DocMeta struct)
 */
export interface DocMeta {
  cid: string;
  filename: string;
  mime: string;
  size: bigint;
  iv: string;
  ciphertextHash: string;
  tag: string;
}

/**
 * NFT metadata from smart contract
 */
export interface NFTMetadata {
  requestType: string;
  minimalPublicLabel: string;
  metadataCid: string;
  metadataHash: string;
  uploaderSignature: string;
  files: DocMeta[];
  consentTextVersion: string;
  consentTimestamp: bigint;
}

/**
 * NFT Document displayed in UI
 */
export interface NFTDocument {
  id: string;
  tokenId: string;
  title: string;
  type: "Land Title" | "National ID";
  status: "approved" | "pending" | "rejected";
  mintedDate: string;
  uploadDate: string;
  contractAddress: string;
  ownerAddress: string;
  metadataUrl?: string;
  verified: boolean;
  blockchainExplorerUrl: string;
  // Blockchain details
  network: string;
  transactionHash: string;
  documentHash: string;
  ipfsCid?: string;
  imageUrl?: string;
  // Verification details
  verificationAuthority: string;
  validationTimestamp: string;
  // On-chain metadata
  metadata?: NFTMetadata;
  // Decrypted metadata (fetched from backend if owner)
  decryptedMetadata?: any;
}

export function useUserNFTs() {
  const [nfts, setNfts] = useState<NFTDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { address } = useAccount();
  const publicClient = usePublicClient();

  /**
   * Decrypt NFT metadata by calling backend endpoint
   * Only works if the viewer is the owner of the NFT
   */
  const decryptMetadata = async (metadataCid: string, ownerAddress: string) => {
    try {
      const BE_URL = process.env.NEXT_PUBLIC_BE_URL || "http://localhost:9000";
      const response = await fetch(`${BE_URL}/api/nft/decrypt-metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadataCid,
          ownerAddress,
        }),
      });

      if (!response.ok) {
        console.warn(`Failed to decrypt metadata: ${response.statusText}`);
        return null;
      }

      const result = await response.json();
      // console.log("🔐 Decrypted metadata result:", result);
      // console.log("📁 Files detail:", result.data?.files);
      return result.success ? result.data : null;
    } catch (error) {
      console.warn("Error decrypting metadata:", error);
      return null;
    }
  };

  const fetchNFTs = async () => {
    if (!address || !publicClient) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const allNFTs: NFTDocument[] = [];

      // Fetch National ID NFTs
      if (NATIONAL_ID_NFT_ADDRESS) {
        try {
          const balance = (await publicClient.readContract({
            address: NATIONAL_ID_NFT_ADDRESS,
            abi: NationalIdNFTABI.abi,
            functionName: "balanceOf",
            args: [address],
          })) as bigint;

          // console.log(`User has ${balance.toString()} National ID NFTs`);

          // For each token, get the tokenId
          for (let i = 0; i < Number(balance); i++) {
            try {
              const tokenId = (await publicClient.readContract({
                address: NATIONAL_ID_NFT_ADDRESS,
                abi: NationalIdNFTABI.abi,
                functionName: "getTokenIdByWallet",
                args: [address],
              })) as bigint;

              // Get on-chain metadata
              const metadata = (await publicClient.readContract({
                address: NATIONAL_ID_NFT_ADDRESS,
                abi: NationalIdNFTABI.abi,
                functionName: "getMetadata",
                args: [tokenId],
              })) as NFTMetadata;

              const ipfsCid = metadata.metadataCid;
              const label =
                metadata.minimalPublicLabel ||
                `National ID #${tokenId.toString()}`;

              // consentTimestamp is already in milliseconds, don't multiply by 1000
              const mintedTimestamp = Number(metadata.consentTimestamp);

              // Decrypt metadata if owner is viewing (non-blocking, optional)
              let decryptedMetadata = null;
              if (ipfsCid) {
                try {
                  decryptedMetadata = await decryptMetadata(ipfsCid, address);
                } catch (error) {
                  // console.warn(
                  //   "Failed to decrypt National ID metadata:",
                  //   error
                  // );
                }
              }

              allNFTs.push({
                id: `national_id_${tokenId.toString()}`,
                tokenId: tokenId.toString(),
                title: label,
                type: "National ID",
                status: "approved",
                mintedDate: new Date(mintedTimestamp).toISOString(),
                uploadDate: new Date(mintedTimestamp).toISOString(),
                contractAddress: NATIONAL_ID_NFT_ADDRESS,
                ownerAddress: address,
                metadataUrl: ipfsCid
                  ? `https://gateway.pinata.cloud/ipfs/${ipfsCid}`
                  : undefined,
                verified: true,
                blockchainExplorerUrl: `https://sepolia.basescan.org/token/${NATIONAL_ID_NFT_ADDRESS}?a=${tokenId.toString()}`,
                network: "Base Sepolia",
                transactionHash: metadata.metadataHash, // Using metadataHash as document hash
                documentHash: metadata.metadataHash,
                ipfsCid: ipfsCid,
                imageUrl: undefined,
                verificationAuthority: "Base Own Admin",
                validationTimestamp: new Date(mintedTimestamp).toISOString(),
                metadata,
                decryptedMetadata,
              });
            } catch (error) {
              console.error(`Error fetching National ID NFT #${i}:`, error);
            }
          }
        } catch (error) {
          console.error("Error fetching National ID NFTs:", error);
        }
      }

      // Fetch Land Ownership NFTs
      if (LAND_OWNERSHIP_NFT_ADDRESS) {
        try {
          const tokenIds = (await publicClient.readContract({
            address: LAND_OWNERSHIP_NFT_ADDRESS,
            abi: LandOwnershipNFTABI.abi,
            functionName: "getTokensByWallet",
            args: [address],
          })) as bigint[];

          console.log(`User has ${tokenIds.length} Land Ownership NFTs`);

          for (const tokenId of tokenIds) {
            try {
              // Get on-chain metadata
              const metadata = (await publicClient.readContract({
                address: LAND_OWNERSHIP_NFT_ADDRESS,
                abi: LandOwnershipNFTABI.abi,
                functionName: "getMetadata",
                args: [tokenId],
              })) as NFTMetadata;

              const ipfsCid = metadata.metadataCid;
              const label =
                metadata.minimalPublicLabel ||
                `Land Title #${tokenId.toString()}`;

              // consentTimestamp is already in milliseconds, don't multiply by 1000
              const mintedTimestamp = Number(metadata.consentTimestamp);

              // Decrypt metadata if owner is viewing (non-blocking, optional)
              let decryptedMetadata = null;
              if (ipfsCid) {
                try {
                  decryptedMetadata = await decryptMetadata(ipfsCid, address);
                } catch (error) {
                  console.warn(
                    "Failed to decrypt Land Ownership metadata:",
                    error
                  );
                }
              }

              allNFTs.push({
                id: `land_ownership_${tokenId.toString()}`,
                tokenId: tokenId.toString(),
                title: label,
                type: "Land Title",
                status: "approved",
                mintedDate: new Date(mintedTimestamp).toISOString(),
                uploadDate: new Date(mintedTimestamp).toISOString(),
                contractAddress: LAND_OWNERSHIP_NFT_ADDRESS,
                ownerAddress: address,
                metadataUrl: ipfsCid
                  ? `https://gateway.pinata.cloud/ipfs/${ipfsCid}`
                  : undefined,
                verified: true,
                blockchainExplorerUrl: `https://sepolia.basescan.org/token/${LAND_OWNERSHIP_NFT_ADDRESS}?a=${tokenId.toString()}`,
                network: "Base Sepolia",
                transactionHash: metadata.metadataHash,
                documentHash: metadata.metadataHash,
                ipfsCid: ipfsCid,
                imageUrl: undefined,
                verificationAuthority: "Base Own Admin",
                validationTimestamp: new Date(mintedTimestamp).toISOString(),
                metadata,
                decryptedMetadata,
              });
            } catch (error) {
              console.error(
                `Error fetching Land Ownership NFT ${tokenId.toString()}:`,
                error
              );
            }
          }
        } catch (error) {
          console.error("Error fetching Land Ownership NFTs:", error);
        }
      }

      setNfts(allNFTs);
    } catch (error) {
      console.error("Error in fetchNFTs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNFTs();
  }, [address, publicClient]);

  return {
    nfts,
    isLoading,
    refetch: fetchNFTs,
  };
}
