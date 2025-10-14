/**
 * Script: Mint ProofNFT tokens from server model
 * 
 * This script reads the server's user data model and batch-mints ProofNFT tokens
 * representing each user's hashed data. The server model maps wallet addresses 
 * to arrays of document data.
 * 
 * Usage:
 *   npx hardhat run scripts/mintFromServerModel.ts --network localhost
 * 
 * Prerequisites:
 *   1. ProofNFT contract must be deployed
 *   2. Server model must be accessible (MongoDB or JSON export)
 *   3. Owner wallet must have sufficient ETH for gas
 */

import hre from "hardhat";
import { keccak256, toBytes, parseEther } from "viem";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ============ Types ============

interface DocumentData {
  cid: string;
  filename: string;
  mime?: string;
  size?: number;
  ciphertextHash?: string;
}

interface ServerRequest {
  requestId: string;
  requesterWallet: string;
  requestType: "national_id" | "land_ownership";
  files: DocumentData[];
  metadataHash?: string;
  status: "pending" | "verified" | "rejected";
}

interface ProcessedEntry {
  wallet: string;
  hash: `0x${string}`;
  metadata: string;
  sourceData: string;
}

// ============ Configuration ============

const CONFIG = {
  // Contract address - UPDATE THIS after deploying ProofNFT
  contractAddress: process.env.PROOF_NFT_ADDRESS as `0x${string}` || "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  
  // Batch size for minting (gas optimization)
  batchSize: 50,
  
  // Data source options
  useMongoDb: false, // Set to true to use MongoDB directly
  useJsonExport: true, // Set to true to use JSON export file
  
  // Paths
  serverModelPath: "../server/data/userRequests.json", // Fallback JSON export
  
  // Salt for additional entropy (recommended in production)
  useSalt: true,
  saltValue: process.env.HASH_SALT || "veribase-proof-salt-2024",
};

// ============ Helper Functions ============

/**
 * Generates a salted hash for data
 */
function generateHash(data: string, useSalt: boolean = CONFIG.useSalt): `0x${string}` {
  const dataToHash = useSalt ? `${data}:${CONFIG.saltValue}` : data;
  return keccak256(toBytes(dataToHash));
}

/**
 * Loads server model from JSON file (server export)
 */
function loadServerModelFromJson(): ServerRequest[] {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const jsonPath = path.resolve(__dirname, CONFIG.serverModelPath);
  
  if (!fs.existsSync(jsonPath)) {
    console.log(`⚠️  JSON file not found at ${jsonPath}`);
    console.log("   Using mock data instead...\n");
    return getMockServerData();
  }
  
  const data = fs.readFileSync(jsonPath, "utf-8");
  return JSON.parse(data);
}

/**
 * Mock server data for testing (when actual server model is unavailable)
 */
function getMockServerData(): ServerRequest[] {
  return [
    {
      requestId: "req_001",
      requesterWallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      requestType: "national_id",
      files: [
        {
          cid: "QmHash1",
          filename: "national_id_front.jpg",
          mime: "image/jpeg",
          ciphertextHash: "hash1",
        },
        {
          cid: "QmHash2",
          filename: "national_id_back.jpg",
          mime: "image/jpeg",
          ciphertextHash: "hash2",
        },
      ],
      metadataHash: "meta_hash_1",
      status: "verified",
    },
    {
      requestId: "req_002",
      requesterWallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      requestType: "land_ownership",
      files: [
        {
          cid: "QmHash3",
          filename: "land_deed.pdf",
          mime: "application/pdf",
          ciphertextHash: "hash3",
        },
      ],
      metadataHash: "meta_hash_2",
      status: "verified",
    },
    {
      requestId: "req_003",
      requesterWallet: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      requestType: "national_id",
      files: [
        {
          cid: "QmHash4",
          filename: "passport.jpg",
          mime: "image/jpeg",
          ciphertextHash: "hash4",
        },
        {
          cid: "QmHash5",
          filename: "drivers_license.jpg",
          mime: "image/jpeg",
          ciphertextHash: "hash5",
        },
        {
          cid: "QmHash6",
          filename: "tax_id.pdf",
          mime: "application/pdf",
          ciphertextHash: "hash6",
        },
      ],
      metadataHash: "meta_hash_3",
      status: "verified",
    },
  ];
}

/**
 * Processes server model into mintable entries
 * Creates a unique hash for each file/document in the server model
 */
function processServerModel(requests: ServerRequest[]): ProcessedEntry[] {
  const entries: ProcessedEntry[] = [];
  
  for (const request of requests) {
    // Only process verified requests
    if (request.status !== "verified") {
      console.log(`   Skipping request ${request.requestId} (status: ${request.status})`);
      continue;
    }
    
    // Process each file in the request
    for (const file of request.files) {
      // Create a unique data string for hashing
      // In production, you might use the actual encrypted data or a combination of fields
      const sourceData = JSON.stringify({
        requestId: request.requestId,
        wallet: request.requesterWallet,
        cid: file.cid,
        filename: file.filename,
        ciphertextHash: file.ciphertextHash,
      });
      
      const hash = generateHash(sourceData);
      
      entries.push({
        wallet: request.requesterWallet,
        hash,
        metadata: `${request.requestType}:${file.filename}`,
        sourceData,
      });
    }
  }
  
  return entries;
}

/**
 * Groups entries by wallet for efficient batching
 */
function groupByWallet(entries: ProcessedEntry[]): Map<string, ProcessedEntry[]> {
  const grouped = new Map<string, ProcessedEntry[]>();
  
  for (const entry of entries) {
    const existing = grouped.get(entry.wallet) || [];
    existing.push(entry);
    grouped.set(entry.wallet, existing);
  }
  
  return grouped;
}

// ============ Main Minting Logic ============

async function main() {
  console.log("🚀 ProofNFT Batch Minting Script");
  console.log("=" .repeat(60));
  console.log();
  
  // 1. Get contract instance
  console.log("📋 Loading ProofNFT contract...");
  const proofNFT = await hre.viem.getContractAt("ProofNFT", CONFIG.contractAddress);
  console.log(`   Contract: ${CONFIG.contractAddress}`);
  
  // 2. Get deployer/owner wallet
  const [owner] = await hre.viem.getWalletClients();
  console.log(`   Owner: ${owner.account.address}`);
  
  // Verify ownership
  const contractOwner = await proofNFT.read.owner();
  if (contractOwner.toLowerCase() !== owner.account.address.toLowerCase()) {
    throw new Error(
      `❌ Wallet ${owner.account.address} is not the contract owner!\n` +
      `   Contract owner: ${contractOwner}`
    );
  }
  console.log("   ✅ Ownership verified");
  console.log();
  
  // 3. Load server model
  console.log("📥 Loading server model...");
  const requests = CONFIG.useJsonExport 
    ? loadServerModelFromJson() 
    : getMockServerData();
  console.log(`   Found ${requests.length} requests`);
  
  // 4. Process server model
  console.log();
  console.log("⚙️  Processing server model...");
  const entries = processServerModel(requests);
  console.log(`   Generated ${entries.length} proof entries`);
  
  // Group by wallet
  const grouped = groupByWallet(entries);
  console.log(`   For ${grouped.size} unique wallets`);
  console.log();
  
  // 5. Display summary
  console.log("📊 Minting Summary:");
  for (const [wallet, walletEntries] of grouped) {
    console.log(`   ${wallet}: ${walletEntries.length} tokens`);
  }
  console.log();
  
  // 6. Check current supply
  const currentSupply = await proofNFT.read.totalSupply();
  console.log(`   Current total supply: ${currentSupply}`);
  console.log();
  
  // 7. Prepare batch arrays
  console.log("🔨 Preparing batch mint...");
  const recipients: `0x${string}`[] = [];
  const hashes: `0x${string}`[] = [];
  
  for (const entry of entries) {
    recipients.push(entry.wallet as `0x${string}`);
    hashes.push(entry.hash);
  }
  
  // 8. Execute batch mint
  console.log(`   Minting ${entries.length} tokens in single batch...`);
  console.log("   This may take a moment...");
  
  try {
    const txHash = await proofNFT.write.ownerBatchMintTo([recipients, hashes]);
    console.log(`   ✅ Transaction submitted: ${txHash}`);
    
    // Wait for confirmation
    const publicClient = await hre.viem.getPublicClient();
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    
    console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed}`);
  } catch (error: any) {
    console.error("   ❌ Minting failed:");
    console.error(`   ${error.message}`);
    throw error;
  }
  
  // 9. Verify final supply
  console.log();
  const finalSupply = await proofNFT.read.totalSupply();
  console.log(`✅ Final total supply: ${finalSupply}`);
  console.log(`   Minted: ${finalSupply - currentSupply} new tokens`);
  console.log();
  
  // 10. Save minting record
  console.log("💾 Saving minting record...");
  const record = {
    timestamp: new Date().toISOString(),
    contractAddress: CONFIG.contractAddress,
    totalMinted: entries.length,
    transactionHash: "stored_in_chain",
    entries: entries.map(e => ({
      wallet: e.wallet,
      hash: e.hash,
      metadata: e.metadata,
    })),
  };
  
  const recordPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    `../data/minting-record-${Date.now()}.json`
  );
  
  // Create data directory if it doesn't exist
  const dataDir = path.dirname(recordPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(recordPath, JSON.stringify(record, null, 2));
  console.log(`   Record saved to: ${recordPath}`);
  console.log();
  
  console.log("=" .repeat(60));
  console.log("🎉 Batch minting completed successfully!");
  console.log("=" .repeat(60));
}

// ============ Execution ============

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
