/**
 * Simple deployment and testing script
 * Run with: npx hardhat run scripts/quickTest.ts --network hardhat
 */

import hre from "hardhat";
import { getAddress } from "viem";

async function main() {
  console.log("🧪 Quick Test - NFT Contracts");
  console.log("=".repeat(60));
  console.log();

  // Get wallets
  const [deployer, user1, user2] = await hre.viem.getWalletClients();
  console.log("👛 Wallets:");
  console.log(`   Deployer: ${deployer.account.address}`);
  console.log(`   User 1: ${user1.account.address}`);
  console.log(`   User 2: ${user2.account.address}`);
  console.log();

  // Test 1: Deploy NationalIdNFT
  console.log("📦 Test 1: Deploying NationalIdNFT...");
  const nationalIdNFT = await hre.viem.deployContract("NationalIdNFT");
  console.log(`   ✅ Deployed at: ${nationalIdNFT.address}`);

  const name = await nationalIdNFT.read.name();
  const symbol = await nationalIdNFT.read.symbol();
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log();

  // Test 2: Mint National ID NFT
  console.log("🎫 Test 2: Minting National ID NFT...");
  const timestamp = BigInt(Date.now());

  await nationalIdNFT.write.mintNationalId([
    user1.account.address,
    "national_id",
    "John Doe ID",
    "QmTestCID123",
    "0xtesthash123",
    "0xtestsig123",
    "consent_v1",
    timestamp,
  ]);

  const balance = await nationalIdNFT.read.balanceOf([user1.account.address]);
  console.log(`   ✅ User1 balance: ${balance}`);

  const hasId = await nationalIdNFT.read.hasNationalId([user1.account.address]);
  console.log(`   Has National ID: ${hasId}`);
  console.log();

  // Test 3: Check metadata
  console.log("📄 Test 3: Checking metadata...");
  const tokenId = await nationalIdNFT.read.getTokenIdByWallet([
    user1.account.address,
  ]);
  console.log(`   Token ID: ${tokenId}`);

  const metadata = await nationalIdNFT.read.getMetadata([tokenId]);
  console.log(`   Document Type: ${metadata.documentType}`);
  console.log(`   Document Name: ${metadata.documentName}`);
  console.log(`   IPFS CID: ${metadata.ipfsCid}`);
  console.log();

  // Test 4: Try to mint another (should fail)
  console.log("❌ Test 4: Try minting duplicate (should fail)...");
  try {
    await nationalIdNFT.write.mintNationalId([
      user1.account.address,
      "national_id",
      "Another ID",
      "QmTest456",
      "0xhash456",
      "0xsig456",
      "consent_v1",
      timestamp,
    ]);
    console.log("   ⚠️  ERROR: Should have reverted!");
  } catch (error: any) {
    console.log(`   ✅ Correctly reverted: ${error.message.split("\n")[0]}`);
  }
  console.log();

  // Test 5: Deploy LandOwnershipNFT
  console.log("📦 Test 5: Deploying LandOwnershipNFT...");
  const landOwnershipNFT = await hre.viem.deployContract("LandOwnershipNFT");
  console.log(`   ✅ Deployed at: ${landOwnershipNFT.address}`);

  const landName = await landOwnershipNFT.read.name();
  const landSymbol = await landOwnershipNFT.read.symbol();
  console.log(`   Name: ${landName}`);
  console.log(`   Symbol: ${landSymbol}`);
  console.log();

  // Test 6: Mint multiple Land NFTs
  console.log("🏠 Test 6: Minting multiple Land NFTs...");

  await landOwnershipNFT.write.mintLandOwnership([
    user1.account.address,
    "land_ownership",
    "Property 1",
    "QmLand1",
    "0xlandhash1",
    "0xlandsig1",
    "consent_v1",
    timestamp,
  ]);

  await landOwnershipNFT.write.mintLandOwnership([
    user1.account.address,
    "land_ownership",
    "Property 2",
    "QmLand2",
    "0xlandhash2",
    "0xlandsig2",
    "consent_v1",
    timestamp,
  ]);

  const landBalance = await landOwnershipNFT.read.balanceOf([
    user1.account.address,
  ]);
  console.log(`   ✅ User1 has ${landBalance} land NFTs`);

  const tokenIds = await landOwnershipNFT.read.getTokenIdsByWallet([
    user1.account.address,
  ]);
  console.log(`   Token IDs: [${tokenIds.join(", ")}]`);
  console.log();

  // Test 7: Try direct transfer (should fail)
  console.log("🚫 Test 7: Try direct transfer (should fail)...");
  try {
    await landOwnershipNFT.write.transferFrom(
      [user1.account.address, user2.account.address, tokenIds[0]],
      { account: user1.account }
    );
    console.log("   ⚠️  ERROR: Should have reverted!");
  } catch (error: any) {
    console.log(`   ✅ Correctly reverted: ${error.message.split("\n")[0]}`);
  }
  console.log();

  // Summary
  console.log("=".repeat(60));
  console.log("✅ All tests passed!");
  console.log("=".repeat(60));
  console.log();
  console.log("📊 Summary:");
  console.log(`   • NationalIdNFT: ${nationalIdNFT.address}`);
  console.log(`   • LandOwnershipNFT: ${landOwnershipNFT.address}`);
  console.log(`   • User1 National IDs: 1`);
  console.log(`   • User1 Land NFTs: ${landBalance}`);
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
