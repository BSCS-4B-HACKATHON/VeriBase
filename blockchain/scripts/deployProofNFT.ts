/**
 * Deployment script for ProofNFT contract
 * 
 * Usage:
 *   npx hardhat run scripts/deployProofNFT.ts --network localhost
 *   npx hardhat run scripts/deployProofNFT.ts --network sepolia
 */

import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

async function main() {
  console.log("🚀 Deploying ProofNFT Contract");
  console.log("=" .repeat(60));
  console.log();
  
  // Get deployer
  const [deployer] = await hre.viem.getWalletClients();
  console.log("📋 Deployment Details:");
  console.log(`   Deployer: ${deployer.account.address}`);
  console.log(`   Network: ${hre.network.name}`);
  console.log();
  
  // Deploy contract
  console.log("🔨 Deploying ProofNFT...");
  const proofNFT = await hre.viem.deployContract("ProofNFT");
  console.log(`   ✅ ProofNFT deployed to: ${proofNFT.address}`);
  console.log();
  
  // Verify contract details
  console.log("🔍 Verifying deployment...");
  const name = await proofNFT.read.name();
  const symbol = await proofNFT.read.symbol();
  const owner = await proofNFT.read.owner();
  const totalSupply = await proofNFT.read.totalSupply();
  
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Owner: ${owner}`);
  console.log(`   Total Supply: ${totalSupply}`);
  console.log();
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: proofNFT.address,
    deployer: deployer.account.address,
    timestamp: new Date().toISOString(),
    contractDetails: {
      name,
      symbol,
      owner,
    },
  };
  
  const deploymentPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    `../deployments/ProofNFT-${hre.network.name}.json`
  );
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.dirname(deploymentPath);
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:");
  console.log(`   ${deploymentPath}`);
  console.log();
  
  console.log("=" .repeat(60));
  console.log("✅ Deployment completed successfully!");
  console.log("=" .repeat(60));
  console.log();
  console.log("📝 Next steps:");
  console.log("   1. Update PROOF_NFT_ADDRESS in scripts/mintFromServerModel.ts");
  console.log(`      export PROOF_NFT_ADDRESS=${proofNFT.address}`);
  console.log("   2. Run minting script:");
  console.log("      npx hardhat run scripts/mintFromServerModel.ts --network localhost");
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
