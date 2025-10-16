import { config as loadEnv } from "dotenv";
import fs from "fs";
import path from "path";

loadEnv();

const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;
const BASESCAN_API_URL = "https://api-sepolia.basescan.org/api";

async function verifyOnBaseScan(
  address: string,
  sourceCode: string,
  contractName: string,
  constructorArguments: string = ""
) {
  const params = new URLSearchParams({
    apikey: BASESCAN_API_KEY || "",
    module: "contract",
    action: "verifysourcecode",
    contractaddress: address,
    sourceCode: sourceCode,
    codeformat: "solidity-single-file",
    contractname: contractName,
    compilerversion: "v0.8.28+commit.7893614a", // Match your Solidity version
    optimizationUsed: "1",
    runs: "200",
    constructorArguements: constructorArguments,
    evmversion: "cancun", // Or default, depends on your settings
    licenseType: "3", // MIT License
  });

  const response = await fetch(BASESCAN_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const result = await response.json();
  return result;
}

async function checkVerificationStatus(guid: string) {
  const params = new URLSearchParams({
    apikey: BASESCAN_API_KEY || "",
    module: "contract",
    action: "checkverifystatus",
    guid: guid,
  });

  const response = await fetch(`${BASESCAN_API_URL}?${params.toString()}`);
  const result = await response.json();
  return result;
}

async function main() {
  console.log("🔍 Verifying contracts on BaseScan via API...");
  console.log("=".repeat(70));
  console.log();

  if (!BASESCAN_API_KEY) {
    console.error("❌ BASESCAN_API_KEY not found in .env file!");
    console.log();
    console.log("   Get your API key from: https://basescan.org/myapikey");
    console.log("   Add it to .env: BASESCAN_API_KEY=your_key_here");
    process.exit(1);
  }

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

  // Read contract source code
  const nationalIdSource = fs.readFileSync(
    path.join(process.cwd(), "contracts/NationalIdNFT.sol"),
    "utf-8"
  );

  const landOwnershipSource = fs.readFileSync(
    path.join(process.cwd(), "contracts/LandOwnershipNFT.sol"),
    "utf-8"
  );

  const landTransferSource = fs.readFileSync(
    path.join(process.cwd(), "contracts/LandTransferContract.sol"),
    "utf-8"
  );

  console.log("🔨 Verifying NationalIdNFT...");
  try {
    const result = await verifyOnBaseScan(
      deployment.nationalIdNFT,
      nationalIdSource,
      "NationalIdNFT"
    );

    if (result.status === "1") {
      console.log(`   ✅ Verification submitted! GUID: ${result.result}`);

      // Wait and check status
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const status = await checkVerificationStatus(result.result);
      console.log(`   Status: ${status.result}`);
    } else {
      console.log(`   ⚠️  ${result.result}`);
    }
  } catch (err: any) {
    console.log(`   ❌ Error: ${err.message}`);
  }

  console.log();
  console.log("🔨 Verifying LandOwnershipNFT...");
  try {
    const result = await verifyOnBaseScan(
      deployment.landOwnershipNFT,
      landOwnershipSource,
      "LandOwnershipNFT"
    );

    if (result.status === "1") {
      console.log(`   ✅ Verification submitted! GUID: ${result.result}`);

      await new Promise((resolve) => setTimeout(resolve, 5000));
      const status = await checkVerificationStatus(result.result);
      console.log(`   Status: ${status.result}`);
    } else {
      console.log(`   ⚠️  ${result.result}`);
    }
  } catch (err: any) {
    console.log(`   ❌ Error: ${err.message}`);
  }

  console.log();
  console.log("🔨 Verifying LandTransferContract...");
  try {
    // Encode constructor arguments (landOwnershipNFT address)
    const constructorArgs = deployment.landOwnershipNFT.slice(2); // Remove 0x prefix

    const result = await verifyOnBaseScan(
      deployment.landTransferContract,
      landTransferSource,
      "LandTransferContract",
      constructorArgs
    );

    if (result.status === "1") {
      console.log(`   ✅ Verification submitted! GUID: ${result.result}`);

      await new Promise((resolve) => setTimeout(resolve, 5000));
      const status = await checkVerificationStatus(result.result);
      console.log(`   Status: ${status.result}`);
    } else {
      console.log(`   ⚠️  ${result.result}`);
    }
  } catch (err: any) {
    console.log(`   ❌ Error: ${err.message}`);
  }

  console.log();
  console.log("=".repeat(70));
  console.log("✅ Verification requests submitted!");
  console.log();
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
  console.log("💡 Note: Verification can take a few minutes to process.");
  console.log("   Visit the links above to check verification status.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
