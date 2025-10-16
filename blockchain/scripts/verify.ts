import { config as loadEnv } from "dotenv";
import fs from "fs";
import path from "path";

loadEnv();

async function main() {
  console.log("🔍 Verifying contracts on BaseScan...");
  console.log("=".repeat(70));
  console.log();

  // Read deployment info
  const deploymentFile = path.join(
    process.cwd(),
    "deployments/baseSepolia.json"
  );

  if (!fs.existsSync(deploymentFile)) {
    throw new Error("Deployment file not found. Deploy contracts first.");
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));

  console.log("📋 Contract Addresses:");
  console.log(`   NationalIdNFT: ${deployment.nationalIdNFT}`);
  console.log(`   LandOwnershipNFT: ${deployment.landOwnershipNFT}`);
  console.log(`   LandTransferContract: ${deployment.landTransferContract}`);
  console.log();

  // With Hardhat v3, use hardhat-ignition:verify instead
  console.log("🔨 Using Hardhat Ignition verification...");
  console.log("   This will verify all contracts deployed via Ignition.");
  console.log();

  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  try {
    const command = `npx hardhat ignition verify chain-84532`;
    console.log(`   Executing: ${command}`);
    console.log();

    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes("Successfully")) console.error(stderr);

    console.log();
    console.log("✅ Verification complete!");
  } catch (error: any) {
    if (
      error.message.includes("verified") ||
      error.message.includes("Successfully")
    ) {
      console.log("   ✅ Contracts verified successfully!");
    } else {
      console.log(`   ⚠️  Verification status: ${error.message}`);
      console.log();
      console.log("   💡 If contracts are already verified, this is normal.");
      console.log("   💡 Check the links below to see verification status.");
    }
  }

  console.log();
  console.log("=".repeat(70));
  console.log("🔗 View on BaseScan:");
  console.log(
    `   NationalIdNFT: https://sepolia.basescan.org/address/${deployment.nationalIdNFT}#code`
  );
  console.log(
    `   LandOwnershipNFT: https://sepolia.basescan.org/address/${deployment.landOwnershipNFT}#code`
  );
  console.log(
    `   LandTransferContract: https://sepolia.basescan.org/address/${deployment.landTransferContract}#code`
  );
  console.log();
  console.log(
    "💡 Tip: Visit the links above to confirm contracts are verified."
  );
  console.log("   Look for the 'Contract' tab with a green checkmark.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
