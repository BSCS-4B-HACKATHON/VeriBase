/**
 * NFT Service
 *
 * Handles minting of National ID and Land Ownership NFTs
 * based on request type
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  parseAbi,
  getAddress,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import path from "path";
import fs from "fs";

// Contract ABIs (will be copied from blockchain/artifacts after deployment)
let NationalIdNFTABI: any[] = [];
let LandOwnershipNFTABI: any[] = [];

try {
  const nationalIdData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../abis/NationalIdNFT.json"), "utf-8")
  );
  NationalIdNFTABI = nationalIdData.abi;

  const landOwnershipData = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../abis/LandOwnershipNFT.json"),
      "utf-8"
    )
  );
  LandOwnershipNFTABI = landOwnershipData.abi;

  console.log("✅ Contract ABIs loaded successfully");
} catch (error) {
  console.warn(
    "⚠️  Contract ABIs not found. Copy them from blockchain/artifacts after deployment."
  );
  console.warn(
    "   Run: cp blockchain/artifacts/contracts/*/**.json server/src/abis/"
  );
}

// Environment configuration
const BLOCKCHAIN_RPC_URL =
  process.env.BLOCKCHAIN_RPC_URL || "https://sepolia.base.org";
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const NATIONAL_ID_NFT_ADDRESS = process.env.NATIONAL_ID_NFT_ADDRESS;
const LAND_OWNERSHIP_NFT_ADDRESS = process.env.LAND_OWNERSHIP_NFT_ADDRESS;

// Initialize clients
let walletClient: any = null;
let publicClient: any = null;
let account: any = null;

if (
  ADMIN_PRIVATE_KEY &&
  NATIONAL_ID_NFT_ADDRESS &&
  LAND_OWNERSHIP_NFT_ADDRESS
) {
  try {
    // Create account from private key
    account = privateKeyToAccount(ADMIN_PRIVATE_KEY as `0x${string}`);

    // Create wallet client for transactions
    walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(BLOCKCHAIN_RPC_URL),
    });

    // Create public client for reading
    publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(BLOCKCHAIN_RPC_URL),
    });

    console.log("✅ Blockchain clients initialized");
    console.log(`   Network: Base Sepolia (${baseSepolia.id})`);
    console.log(`   Admin: ${account.address}`);
    console.log(`   National ID NFT: ${NATIONAL_ID_NFT_ADDRESS}`);
    console.log(`   Land Ownership NFT: ${LAND_OWNERSHIP_NFT_ADDRESS}`);
  } catch (error) {
    console.error("❌ Failed to initialize blockchain clients:", error);
  }
} else {
  console.warn("⚠️  Missing environment variables for NFT contracts");
  console.warn(
    "   Required: ADMIN_PRIVATE_KEY, NATIONAL_ID_NFT_ADDRESS, LAND_OWNERSHIP_NFT_ADDRESS"
  );
  console.warn("   Add them to server/.env file");
}

export interface DocMeta {
  label: string;
  value: string;
  encrypted: boolean;
}

export interface MintRequest {
  requestId: string;
  requesterWallet: string;
  requestType: "national_id" | "land_ownership";
  documents: DocMeta[];
}

export interface MintResult {
  success: boolean;
  tokenId: string;
  transactionHash: string;
  contractAddress: string;
  network: string;
  explorerUrl: string;
}

/**
 * Mint NFT based on request type
 */
export async function mintNFT(request: MintRequest): Promise<MintResult> {
  if (!walletClient || !publicClient) {
    throw new Error(
      "Blockchain clients not initialized. Check environment variables."
    );
  }

  if (NationalIdNFTABI.length === 0 || LandOwnershipNFTABI.length === 0) {
    throw new Error(
      "Contract ABIs not loaded. Copy them from blockchain/artifacts/."
    );
  }

  const { requesterWallet, requestType, documents } = request;

  // Select the appropriate contract and ABI
  const contractAddress = (
    requestType === "national_id"
      ? NATIONAL_ID_NFT_ADDRESS
      : LAND_OWNERSHIP_NFT_ADDRESS
  ) as Address;

  const abi =
    requestType === "national_id" ? NationalIdNFTABI : LandOwnershipNFTABI;

  console.log(`🎫 Minting ${requestType} NFT for ${requesterWallet}`);
  console.log(`   Using contract: ${contractAddress}`);
  console.log(`   Metadata items: ${documents.length}`);

  try {
    // Prepare metadata in correct format for contract
    const metadata = documents.map((doc) => ({
      label: doc.label,
      value: doc.value,
      encrypted: doc.encrypted,
    }));

    // Call safeMint on the contract
    console.log("   Sending transaction...");

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi,
      functionName: "safeMint",
      args: [getAddress(requesterWallet), metadata],
    });

    console.log(`   Transaction sent: ${hash}`);
    console.log("   Waiting for confirmation...");

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);

    // Extract tokenId from Transfer event
    // Transfer event signature: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
    const transferLog = receipt.logs.find(
      (log: any) =>
        log.topics.length === 4 &&
        log.topics[0] ===
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
    );

    let tokenId = "0";
    if (transferLog && transferLog.topics[3]) {
      tokenId = BigInt(transferLog.topics[3]).toString();
      console.log(`   Token ID: ${tokenId}`);
    }

    return {
      success: true,
      tokenId,
      transactionHash: receipt.transactionHash,
      contractAddress,
      network: "Base Sepolia",
      explorerUrl: `https://sepolia.basescan.org/tx/${receipt.transactionHash}`,
    };
  } catch (error: any) {
    console.error("❌ Minting failed:", error);
    throw new Error(`Minting failed: ${error.message || error}`);
  }
}

/**
 * Check if contracts are initialized
 */
export function areContractsInitialized(): boolean {
  return (
    walletClient !== null &&
    publicClient !== null &&
    NationalIdNFTABI.length > 0
  );
}

/**
 * Get contract addresses
 */
export function getContractAddresses() {
  return {
    nationalIdNFT: NATIONAL_ID_NFT_ADDRESS,
    landOwnershipNFT: LAND_OWNERSHIP_NFT_ADDRESS,
    initialized: areContractsInitialized(),
  };
}
