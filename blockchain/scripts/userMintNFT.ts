/**
 * User-Initiated Minting Script
 * 
 * This script allows users to mint their own NFTs after their request is verified.
 * Called from the frontend when user clicks the "Mint" button.
 * 
 * Flow:
 * 1. User uploads document → Status: "pending"
 * 2. Admin verifies → Status: "verified"
 * 3. User clicks "Mint" button → This script executes
 * 4. NFT minted to user's wallet
 */

import hre from "hardhat";
import { keccak256, toBytes } from "viem";

// ============ Configuration ============

const CONFIG = {
  // Contract address - UPDATE THIS after deploying ProofNFT
  contractAddress: process.env.PROOF_NFT_ADDRESS as `0x${string}`,
  
  // Salt for hashing (must match server-side)
  saltValue: process.env.HASH_SALT || "veribase-proof-salt-2024",
};

// ============ Types ============

interface MintRequest {
  requestId: string;
  requesterWallet: string;
  requestType: "national_id" | "land_ownership";
  files: Array<{
    cid: string;
    filename: string;
    ciphertextHash?: string;
  }>;
  status: string;
}

// ============ Helper Functions ============

/**
 * Generates a salted hash for data (must match server-side logic)
 */
function generateHash(data: string, userAddress: string): `0x${string}` {
  const saltedData = `${data}:${CONFIG.saltValue}:${userAddress}`;
  return keccak256(toBytes(saltedData));
}

// ============ Main Minting Function ============

/**
 * Mint NFT for a single verified request
 * @param requestData The verified request data from your server
 * @param userWallet The user's wallet that will sign the transaction
 */
export async function mintNFTForUser(
  requestData: MintRequest,
  userWallet: any // Viem wallet client
) {
  console.log("🎫 Minting NFT for user request...");
  console.log(`   Request ID: ${requestData.requestId}`);
  console.log(`   Wallet: ${requestData.requesterWallet}`);
  console.log(`   Type: ${requestData.requestType}`);
  
  // Validation checks
  if (requestData.status !== "verified") {
    throw new Error(
      `❌ Cannot mint: Request status is "${requestData.status}". Must be "verified".`
    );
  }
  
  if (!requestData.files || requestData.files.length === 0) {
    throw new Error("❌ Cannot mint: No files in request");
  }
  
  // Get contract instance
  const proofNFT = await hre.viem.getContractAt(
    "ProofNFT",
    CONFIG.contractAddress
  );
  
  console.log(`   Contract: ${CONFIG.contractAddress}`);
  
  // Get contract owner (should be the backend server wallet)
  const [owner] = await hre.viem.getWalletClients();
  
  // Prepare minting data - one token per file
  const recipients: `0x${string}`[] = [];
  const hashes: `0x${string}`[] = [];
  const mintedTokens: Array<{
    file: string;
    hash: string;
    expectedTokenId: number;
  }> = [];
  
  // Get current token supply to predict token IDs
  const currentSupply = await proofNFT.read.totalSupply();
  let nextTokenId = Number(currentSupply) + 1;
  
  // Generate hash for each file
  for (const file of requestData.files) {
    // Create unique data string for this file
    const sourceData = JSON.stringify({
      requestId: requestData.requestId,
      wallet: requestData.requesterWallet,
      cid: file.cid,
      filename: file.filename,
      ciphertextHash: file.ciphertextHash,
    });
    
    const hash = generateHash(sourceData, requestData.requesterWallet);
    
    // Check if hash already exists (prevent duplicate minting)
    const hashExists = await proofNFT.read.hashExists([hash]);
    if (hashExists) {
      console.log(`   ⚠️  Hash already minted for ${file.filename}, skipping...`);
      continue;
    }
    
    recipients.push(requestData.requesterWallet as `0x${string}`);
    hashes.push(hash);
    
    mintedTokens.push({
      file: file.filename,
      hash,
      expectedTokenId: nextTokenId++,
    });
  }
  
  if (recipients.length === 0) {
    throw new Error("❌ All files have already been minted as NFTs");
  }
  
  console.log(`\n   🔨 Minting ${recipients.length} token(s)...`);
  
  // Mint using owner wallet (backend signs the transaction)
  let txHash: `0x${string}`;
  
  if (recipients.length === 1) {
    // Single mint
    txHash = await proofNFT.write.ownerMintTo([recipients[0], hashes[0]]);
  } else {
    // Batch mint
    txHash = await proofNFT.write.ownerBatchMintTo([recipients, hashes]);
  }
  
  console.log(`   ✅ Transaction submitted: ${txHash}`);
  console.log(`   ⏳ Waiting for confirmation...`);
  
  // Wait for transaction confirmation
  const publicClient = await hre.viem.getPublicClient();
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  
  console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);
  console.log(`   ⛽ Gas used: ${receipt.gasUsed}`);
  
  // Get the actual token IDs from events
  const events = await proofNFT.getEvents.ProofMinted({
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber,
  });
  
  const tokenIds = events.map((e) => Number(e.args.tokenId));
  
  console.log(`\n   🎉 Successfully minted ${tokenIds.length} NFT(s)!`);
  mintedTokens.forEach((token, i) => {
    console.log(`      • Token #${tokenIds[i]}: ${token.file}`);
  });
  
  // Return minting result
  return {
    success: true,
    requestId: requestData.requestId,
    transactionHash: txHash,
    tokenIds,
    tokens: mintedTokens.map((token, i) => ({
      tokenId: tokenIds[i],
      filename: token.file,
      hash: token.hash,
    })),
  };
}

// ============ CLI Usage (for testing) ============

/**
 * Command-line interface for testing
 * Usage: npx hardhat run scripts/userMintNFT.ts --network localhost
 */
async function main() {
  console.log("🚀 User-Initiated NFT Minting");
  console.log("=" .repeat(60));
  console.log();
  
  // Example: Mock a verified request (replace with actual server data)
  const mockRequest: MintRequest = {
    requestId: "req_001",
    requesterWallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    requestType: "national_id",
    files: [
      {
        cid: "QmHash1",
        filename: "national_id_front.jpg",
        ciphertextHash: "0xabc123",
      },
      {
        cid: "QmHash2",
        filename: "national_id_back.jpg",
        ciphertextHash: "0xdef456",
      },
    ],
    status: "verified",
  };
  
  try {
    const [owner] = await hre.viem.getWalletClients();
    const result = await mintNFTForUser(mockRequest, owner);
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ Minting completed successfully!");
    console.log("=".repeat(60));
    console.log("\nResult:", JSON.stringify(result, null, 2));
    
  } catch (error: any) {
    console.error("\n❌ Minting failed:");
    console.error(error.message);
    throw error;
  }
}

// Export for use in server
export default mintNFTForUser;

// Run if executed directly (ES module compatible)
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this file is being run directly
const isMainModule = process.argv[1] === __filename || process.argv[1]?.endsWith('userMintNFT.ts');

if (isMainModule) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
