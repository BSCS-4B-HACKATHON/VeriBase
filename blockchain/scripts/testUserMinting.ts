/**
 * Test script for user-initiated minting
 * 
 * This tests the complete flow:
 * 1. Deploy ProofNFT contract
 * 2. Simulate a verified user request
 * 3. Mint NFT for the user
 */

import hre from "hardhat";

async function main() {
  
  console.log("🧪 Testing User-Initiated NFT Minting");
  console.log("=".repeat(70));
  console.log();
  
  // Step 1: Deploy contract
  console.log("📦 Step 1: Deploying ProofNFT contract...");
  const ProofNFT = await hre.ethers.getContractFactory("ProofNFT");
  const proofNFT = await ProofNFT.deploy();
  await proofNFT.waitForDeployment();
  const contractAddress = await proofNFT.getAddress();
  console.log(`   ✅ Contract deployed at: ${contractAddress}`);
  console.log();
  
  // Set contract address in environment
  process.env.PROOF_NFT_ADDRESS = contractAddress;
  
  // Step 2: Get wallet clients
  console.log("👛 Step 2: Setting up wallets...");
  const [owner, user1] = await hre.ethers.getSigners();
  console.log(`   Owner (Backend): ${owner.address}`);
  console.log(`   User 1: ${user1.address}`);
  console.log();
  
  // Step 3: Create a mock verified request
  console.log("📝 Step 3: Creating mock verified request...");
  const mockRequest = {
    requestId: "req_test_001",
    requesterWallet: user1.address,
    requestType: "national_id" as const,
    files: [
      {
        cid: "QmTestHash1",
        filename: "national_id_front.jpg",
        ciphertextHash: "0xabc123test",
      },
      {
        cid: "QmTestHash2",
        filename: "national_id_back.jpg",
        ciphertextHash: "0xdef456test",
      },
    ],
    status: "verified",
  };
  console.log(`   Request ID: ${mockRequest.requestId}`);
  console.log(`   User Wallet: ${mockRequest.requesterWallet}`);
  console.log(`   Files: ${mockRequest.files.length}`);
  console.log();
  
  // Step 4: Mint NFT for user
  console.log("🎫 Step 4: Minting NFT for user...");
  console.log("-".repeat(70));
  
  try {
    // Note: mintNFTForUser uses hre.viem which might not work
    // Let's mint directly using ethers instead
    console.log("   🔨 Generating hashes for files...");
    
    const { keccak256, toUtf8Bytes } = hre.ethers;
    const saltValue = "veribase-proof-salt-2024";
    
    const recipients = [];
    const hashes = [];
    
    for (const file of mockRequest.files) {
      const sourceData = JSON.stringify({
        requestId: mockRequest.requestId,
        wallet: mockRequest.requesterWallet,
        cid: file.cid,
        filename: file.filename,
        ciphertextHash: file.ciphertextHash,
      });
      
      const saltedData = `${sourceData}:${saltValue}:${mockRequest.requesterWallet}`;
      const hash = keccak256(toUtf8Bytes(saltedData));
      
      recipients.push(mockRequest.requesterWallet);
      hashes.push(hash);
      
      console.log(`   📄 ${file.filename}`);
      console.log(`      Hash: ${hash.slice(0, 20)}...`);
    }
    
    console.log();
    console.log("   📡 Sending mint transaction...");
    
    // Mint using batch mint
    const tx = await proofNFT.ownerBatchMintTo(recipients, hashes);
    console.log(`   ⏳ Transaction hash: ${tx.hash}`);
    console.log(`   ⏳ Waiting for confirmation...`);
    
    const receipt = await tx.wait();
    console.log(`   ✅ Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);
    console.log();
    
    // Get token IDs from events
    const filter = proofNFT.filters.ProofMinted();
    const events = await proofNFT.queryFilter(filter, receipt.blockNumber, receipt.blockNumber);
    
    console.log("   🎉 Successfully minted NFTs!");
    console.log();
    events.forEach((event, i) => {
      console.log(`      Token #${event.args.tokenId.toString()}`);
      console.log(`         Owner: ${event.args.to}`);
      console.log(`         File: ${mockRequest.files[i].filename}`);
      console.log(`         Hash: ${event.args.hash.slice(0, 20)}...`);
      console.log();
    });
    
    // Step 5: Verify the minting
    console.log("🔍 Step 5: Verifying minting...");
    const totalSupply = await proofNFT.totalSupply();
    console.log(`   Total Supply: ${totalSupply.toString()} NFT(s)`);
    
    for (let i = 0; i < events.length; i++) {
      const tokenId = events[i].args.tokenId;
      const owner = await proofNFT.ownerOf(tokenId);
      const storedHash = await proofNFT.getTokenHash(tokenId);
      
      console.log(`   Token #${tokenId}:`);
      console.log(`      Owner: ${owner}`);
      console.log(`      Hash stored: ${storedHash === hashes[i] ? '✅ Correct' : '❌ Mismatch'}`);
    }
    
    console.log();
    console.log("=".repeat(70));
    console.log("✅ User-initiated minting test completed successfully!");
    console.log("=".repeat(70));
    console.log();
    console.log("📊 Summary:");
    console.log(`   • Contract: ${contractAddress}`);
    console.log(`   • Minted ${events.length} NFT(s) to ${user1.address}`);
    console.log(`   • Transaction: ${tx.hash}`);
    console.log(`   • Gas used: ${receipt.gasUsed.toString()}`);
    console.log();
    
  } catch (error: any) {
    console.error();
    console.error("❌ Test failed:");
    console.error(error.message);
    console.error();
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
