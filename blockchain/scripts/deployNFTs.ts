import hre from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying NationalIdNFT and LandOwnershipNFT contracts");
  console.log("=".repeat(70));
  console.log();

  // Get the deployer account
  const [deployer] = await hre.viem.getWalletClients();
  console.log("📋 Deployment Details:");
  console.log(`   Deployer: ${deployer.account.address}`);
  console.log(`   Network: ${hre.network.name}`);
  console.log();

  // Deploy NationalIdNFT
  console.log("🔨 Deploying NationalIdNFT...");
  const nationalIdNFT = await hre.viem.deployContract("NationalIdNFT", []);
  console.log(`   ✅ NationalIdNFT deployed to: ${nationalIdNFT.address}`);

  // Verify NationalIdNFT
  const natIdName = await nationalIdNFT.read.name();
  const natIdSymbol = await nationalIdNFT.read.symbol();
  console.log(`   Name: ${natIdName}`);
  console.log(`   Symbol: ${natIdSymbol}`);
  console.log();

  // Deploy LandOwnershipNFT
  console.log("🔨 Deploying LandOwnershipNFT...");
  const landOwnershipNFT = await hre.viem.deployContract(
    "LandOwnershipNFT",
    []
  );
  console.log(
    `   ✅ LandOwnershipNFT deployed to: ${landOwnershipNFT.address}`
  );

  // Verify LandOwnershipNFT
  const landName = await landOwnershipNFT.read.name();
  const landSymbol = await landOwnershipNFT.read.symbol();
  console.log(`   Name: ${landName}`);
  console.log(`   Symbol: ${landSymbol}`);
  console.log();

  // Deploy LandTransferContract
  console.log("🔨 Deploying LandTransferContract...");
  const transferFeeBasisPoints = 250n; // 2.5% fee
  const feeRecipient = deployer.account.address; // Deployer receives fees
  const landTransferContract = await hre.viem.deployContract(
    "LandTransferContract",
    [landOwnershipNFT.address, transferFeeBasisPoints, feeRecipient]
  );
  console.log(
    `   ✅ LandTransferContract deployed to: ${landTransferContract.address}`
  );
  console.log(`   Transfer Fee: ${transferFeeBasisPoints / 100n}%`);
  console.log(`   Fee Recipient: ${feeRecipient}`);
  console.log();

  // Set the transfer contract as authorized on LandOwnershipNFT
  console.log("🔗 Authorizing LandTransferContract on LandOwnershipNFT...");
  await landOwnershipNFT.write.setTransferContract([
    landTransferContract.address,
  ]);
  console.log("   ✅ LandTransferContract authorized");
  console.log();

  // Summary
  console.log("=".repeat(70));
  console.log("📊 Deployment Summary");
  console.log("=".repeat(70));
  console.log(`Network:                ${hre.network.name}`);
  console.log(`Deployer:               ${deployer.account.address}`);
  console.log(`NationalIdNFT:          ${nationalIdNFT.address}`);
  console.log(`LandOwnershipNFT:       ${landOwnershipNFT.address}`);
  console.log(`LandTransferContract:   ${landTransferContract.address}`);
  console.log("=".repeat(70));
  console.log();

  // Save addresses to a file for easy reference
  const addresses = {
    nationalIdNFT: nationalIdNFT.address,
    landOwnershipNFT: landOwnershipNFT.address,
    landTransferContract: landTransferContract.address,
    deployer: deployer.account.address,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
  };

  const deploymentsDir = path.resolve(process.cwd(), "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(deploymentsDir, `nfts-${hre.network.name}.json`),
    JSON.stringify(addresses, null, 2)
  );
  console.log(
    "💾 Addresses saved to deployments/nfts-" + hre.network.name + ".json"
  );
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
