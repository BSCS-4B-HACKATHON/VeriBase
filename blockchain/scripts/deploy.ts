import fs from "fs";
import path from "path";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { config as loadEnv } from "dotenv";

// Load environment variables
loadEnv();

async function main() {
  console.log(
    "🚀 Deploying NationalIdNFT, LandOwnershipNFT, and LandTransferContract"
  );
  console.log("=".repeat(70));
  console.log();

  // Get private key from environment
  const privateKey = process.env.BASE_SEPOLIA_PRIVATE_KEY as `0x${string}`;
  if (!privateKey) {
    throw new Error("BASE_SEPOLIA_PRIVATE_KEY not found in environment");
  }

  // Create account and clients
  const account = privateKeyToAccount(
    privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
  );

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http("https://sepolia.base.org"),
  });

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http("https://sepolia.base.org"),
  });

  console.log("📋 Deployment Details:");
  console.log(`   Deployer: ${account.address}`);
  console.log(`   Network: Base Sepolia (chainId: ${baseSepolia.id})`);
  console.log();

  // Read compiled contract artifacts
  const nationalIdArtifact = JSON.parse(
    fs.readFileSync(
      path.resolve(
        process.cwd(),
        "artifacts/contracts/NationalIdNFT.sol/NationalIdNFT.json"
      ),
      "utf-8"
    )
  );

  const landOwnershipArtifact = JSON.parse(
    fs.readFileSync(
      path.resolve(
        process.cwd(),
        "artifacts/contracts/LandOwnershipNFT.sol/LandOwnershipNFT.json"
      ),
      "utf-8"
    )
  );

  const landTransferArtifact = JSON.parse(
    fs.readFileSync(
      path.resolve(
        process.cwd(),
        "artifacts/contracts/LandTransferContract.sol/LandTransferContract.json"
      ),
      "utf-8"
    )
  );

  // Deploy NationalIdNFT
  console.log("🔨 Deploying NationalIdNFT...");
  const nationalIdHash = await walletClient.deployContract({
    abi: nationalIdArtifact.abi,
    bytecode: nationalIdArtifact.bytecode,
    args: [],
  });

  console.log(`   Transaction hash: ${nationalIdHash}`);
  console.log(`   Waiting for confirmation...`);
  const nationalIdReceipt = await publicClient.waitForTransactionReceipt({
    hash: nationalIdHash,
    confirmations: 2,
  });
  const nationalIdAddress = nationalIdReceipt.contractAddress!;
  console.log(`   ✅ NationalIdNFT deployed to: ${nationalIdAddress}`);
  console.log();

  // Get current nonce for next transaction
  const currentNonce = await publicClient.getTransactionCount({
    address: account.address,
  });
  console.log(`   Current nonce: ${currentNonce}`);

  // Deploy LandOwnershipNFT
  console.log("🔨 Deploying LandOwnershipNFT...");
  const landOwnershipHash = await walletClient.deployContract({
    abi: landOwnershipArtifact.abi,
    bytecode: landOwnershipArtifact.bytecode,
    args: [],
    nonce: currentNonce,
  });

  console.log(`   Transaction hash: ${landOwnershipHash}`);
  console.log(`   Waiting for confirmation...`);
  const landOwnershipReceipt = await publicClient.waitForTransactionReceipt({
    hash: landOwnershipHash,
    confirmations: 2,
  });
  const landOwnershipAddress = landOwnershipReceipt.contractAddress!;
  console.log(`   ✅ LandOwnershipNFT deployed to: ${landOwnershipAddress}`);
  console.log();

  // Get nonce for next transaction
  const transferNonce = await publicClient.getTransactionCount({
    address: account.address,
  });

  // Deploy LandTransferContract (FREE transfers - no fees)
  console.log("🔨 Deploying LandTransferContract...");

  const landTransferHash = await walletClient.deployContract({
    abi: landTransferArtifact.abi,
    bytecode: landTransferArtifact.bytecode,
    args: [landOwnershipAddress],
    nonce: transferNonce,
  });

  console.log(`   Transaction hash: ${landTransferHash}`);
  console.log(`   Waiting for confirmation...`);
  const landTransferReceipt = await publicClient.waitForTransactionReceipt({
    hash: landTransferHash,
    confirmations: 2,
  });
  const landTransferAddress = landTransferReceipt.contractAddress!;
  console.log(`   ✅ LandTransferContract deployed to: ${landTransferAddress}`);
  console.log(`   Transfer Type: FREE (no payment required)`);
  console.log();

  // Get nonce for authorization transaction
  const authNonce = await publicClient.getTransactionCount({
    address: account.address,
  });

  // Set the transfer contract as authorized on LandOwnershipNFT
  console.log("🔗 Authorizing LandTransferContract on LandOwnershipNFT...");
  const authHash = await walletClient.writeContract({
    address: landOwnershipAddress,
    abi: landOwnershipArtifact.abi,
    functionName: "setTransferContract",
    args: [landTransferAddress],
    nonce: authNonce,
  });

  console.log(`   Transaction hash: ${authHash}`);
  console.log(`   Waiting for confirmation...`);
  await publicClient.waitForTransactionReceipt({ 
    hash: authHash,
    confirmations: 2,
  });
  console.log("   ✅ LandTransferContract authorized");
  console.log();

  // Summary
  console.log("=".repeat(70));
  console.log("📊 Deployment Summary");
  console.log("=".repeat(70));
  console.log(`Network:                Base Sepolia (${baseSepolia.id})`);
  console.log(`Deployer:               ${account.address}`);
  console.log(`NationalIdNFT:          ${nationalIdAddress}`);
  console.log(`LandOwnershipNFT:       ${landOwnershipAddress}`);
  console.log(`LandTransferContract:   ${landTransferAddress}`);
  console.log("=".repeat(70));
  console.log();

  // Save addresses to a file
  const addresses = {
    nationalIdNFT: nationalIdAddress,
    landOwnershipNFT: landOwnershipAddress,
    landTransferContract: landTransferAddress,
    deployer: account.address,
    network: "baseSepolia",
    chainId: baseSepolia.id,
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = path.resolve(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, "baseSepolia.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(addresses, null, 2));
  console.log(`💾 Addresses saved to deployments/baseSepolia.json`);
  console.log();

  // Copy ABIs to client
  console.log("📋 Copying ABIs to client...");
  const clientAbiDir = path.resolve(process.cwd(), "../client/src/abis");
  if (!fs.existsSync(clientAbiDir)) {
    fs.mkdirSync(clientAbiDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(clientAbiDir, "NationalIdNFT.json"),
    JSON.stringify(
      { abi: nationalIdArtifact.abi, address: nationalIdAddress },
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(clientAbiDir, "LandOwnershipNFT.json"),
    JSON.stringify(
      { abi: landOwnershipArtifact.abi, address: landOwnershipAddress },
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(clientAbiDir, "LandTransferContract.json"),
    JSON.stringify(
      { abi: landTransferArtifact.abi, address: landTransferAddress },
      null,
      2
    )
  );

  console.log(`   ✅ ABIs copied to ${clientAbiDir}`);
  console.log();

  console.log("✅ Deployment complete!");
  console.log();
  console.log("🔗 View your contracts on BaseScan:");
  console.log(
    `   NationalIdNFT: https://sepolia.basescan.org/address/${nationalIdAddress}`
  );
  console.log(
    `   LandOwnershipNFT: https://sepolia.basescan.org/address/${landOwnershipAddress}`
  );
  console.log(
    `   LandTransferContract: https://sepolia.basescan.org/address/${landTransferAddress}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
