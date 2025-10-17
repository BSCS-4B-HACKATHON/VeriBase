# Complete Rebuild Script for VeriBase
# Run this script from the blockchain directory

Write-Host "🚀 VeriBase Smart Contract Complete Rebuild" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean
Write-Host "🧹 Step 1: Cleaning old artifacts..." -ForegroundColor Yellow
Remove-Item -Path "artifacts" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "cache" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "   ✅ Cleaned" -ForegroundColor Green
Write-Host ""

# Step 2: Compile
Write-Host "🔨 Step 2: Compiling smart contracts..." -ForegroundColor Yellow
npx hardhat compile
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Compilation failed" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Compiled successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Deploy
Write-Host "🚀 Step 3: Deploying to Base Sepolia..." -ForegroundColor Yellow
npx hardhat run scripts/deploy.ts --network baseSepolia
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Deployment failed" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Deployed successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Copy ABIs to server
Write-Host "📋 Step 4: Copying ABIs to server..." -ForegroundColor Yellow
$serverAbiDir = "..\server\src\abis"
if (!(Test-Path $serverAbiDir)) {
    New-Item -ItemType Directory -Path $serverAbiDir -Force | Out-Null
}

Copy-Item "artifacts\contracts\NationalIdNFT.sol\NationalIdNFT.json" "$serverAbiDir\" -Force
Copy-Item "artifacts\contracts\LandOwnershipNFT.sol\LandOwnershipNFT.json" "$serverAbiDir\" -Force
Copy-Item "artifacts\contracts\LandTransferContract.sol\LandTransferContract.json" "$serverAbiDir\" -Force

# Read addresses from deployment file
$deployment = Get-Content "deployments\baseSepolia.json" | ConvertFrom-Json

# Update server ABI files with addresses
$nationalIdAbi = Get-Content "$serverAbiDir\NationalIdNFT.json" | ConvertFrom-Json
$nationalIdAbi | Add-Member -NotePropertyName "address" -NotePropertyValue $deployment.nationalIdNFT -Force
$nationalIdAbi | ConvertTo-Json -Depth 100 | Set-Content "$serverAbiDir\NationalIdNFT.json"

$landOwnershipAbi = Get-Content "$serverAbiDir\LandOwnershipNFT.json" | ConvertFrom-Json
$landOwnershipAbi | Add-Member -NotePropertyName "address" -NotePropertyValue $deployment.landOwnershipNFT -Force
$landOwnershipAbi | ConvertTo-Json -Depth 100 | Set-Content "$serverAbiDir\LandOwnershipNFT.json"

$landTransferAbi = Get-Content "$serverAbiDir\LandTransferContract.json" | ConvertFrom-Json
$landTransferAbi | Add-Member -NotePropertyName "address" -NotePropertyValue $deployment.landTransferContract -Force
$landTransferAbi | ConvertTo-Json -Depth 100 | Set-Content "$serverAbiDir\LandTransferContract.json"

Write-Host "   ✅ ABIs copied to server" -ForegroundColor Green
Write-Host ""

# Step 5: Update environment files
Write-Host "📝 Step 5: Updating environment files..." -ForegroundColor Yellow

# Update client .env
$clientEnv = Get-Content "..\client\.env" -Raw
$clientEnv = $clientEnv -replace "NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS=0x[a-fA-F0-9]{40}", "NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS=$($deployment.nationalIdNFT)"
$clientEnv = $clientEnv -replace "NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS=0x[a-fA-F0-9]{40}", "NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS=$($deployment.landOwnershipNFT)"
$clientEnv = $clientEnv -replace "NEXT_PUBLIC_LAND_TRANSFER_CONTRACT_ADDRESS=0x[a-fA-F0-9]{40}", "NEXT_PUBLIC_LAND_TRANSFER_CONTRACT_ADDRESS=$($deployment.landTransferContract)"
$clientEnv | Set-Content "..\client\.env"
Write-Host "   ✅ Updated client/.env" -ForegroundColor Green

# Update server .env
$serverEnv = Get-Content "..\server\.env" -Raw
$serverEnv = $serverEnv -replace "NATIONAL_ID_NFT_ADDRESS=0x[a-fA-F0-9]{40}", "NATIONAL_ID_NFT_ADDRESS=$($deployment.nationalIdNFT)"
$serverEnv = $serverEnv -replace "LAND_OWNERSHIP_NFT_ADDRESS=0x[a-fA-F0-9]{40}", "LAND_OWNERSHIP_NFT_ADDRESS=$($deployment.landOwnershipNFT)"
$serverEnv = $serverEnv -replace "LAND_TRANSFER_CONTRACT_ADDRESS=0x[a-fA-F0-9]{40}", "LAND_TRANSFER_CONTRACT_ADDRESS=$($deployment.landTransferContract)"
$serverEnv | Set-Content "..\server\.env"
Write-Host "   ✅ Updated server/.env" -ForegroundColor Green

Write-Host ""

# Step 6: Update TypeScript files
Write-Host "📝 Step 6: Updating TypeScript contract files..." -ForegroundColor Yellow

# Update client/lib/contracts.ts
$contractsTs = @"
/**
 * Smart Contract Configuration
 * Deployed on Base Sepolia - $(Get-Date -Format "MMMM dd, yyyy")
 */

import NationalIdNFTData from "@/src/abis/NationalIdNFT.json";
import LandOwnershipNFTData from "@/src/abis/LandOwnershipNFT.json";
import LandTransferContractData from "@/src/abis/LandTransferContract.json";
import { baseSepolia } from "viem/chains";

// Contract addresses - deployed on Base Sepolia
export const CONTRACT_ADDRESSES = {
  NationalIdNFT: "$($deployment.nationalIdNFT)" as ``0x`${string}``,
  LandOwnershipNFT: "$($deployment.landOwnershipNFT)" as ``0x`${string}``,
  LandTransferContract: "$($deployment.landTransferContract)" as ``0x`${string}``,
} as const;

// Full contract configs for wagmi
export const CONTRACTS = {
  NationalIdNFT: {
    address: NationalIdNFTData.address as ``0x`${string}``,
    abi: NationalIdNFTData.abi,
    chainId: baseSepolia.id,
  },
  LandOwnershipNFT: {
    address: LandOwnershipNFTData.address as ``0x`${string}``,
    abi: LandOwnershipNFTData.abi,
    chainId: baseSepolia.id,
  },
  LandTransferContract: {
    address: LandTransferContractData.address as ``0x`${string}``,
    abi: LandTransferContractData.abi,
    chainId: baseSepolia.id,
  },
} as const;

export type ContractName = keyof typeof CONTRACTS;

// Export individual ABIs for direct use
export const NationalIdNFTABI = NationalIdNFTData.abi;
export const LandOwnershipNFTABI = LandOwnershipNFTData.abi;
export const LandTransferContractABI = LandTransferContractData.abi;

// Chain info
export const CHAIN = baseSepolia;
"@

$contractsTs | Set-Content "..\client\lib\contracts.ts"
Write-Host "   ✅ Updated client/lib/contracts.ts" -ForegroundColor Green

Write-Host ""

# Summary
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "✅ Rebuild Complete!" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Deployed Contract Addresses:" -ForegroundColor Yellow
Write-Host "   NationalIdNFT:        $($deployment.nationalIdNFT)"
Write-Host "   LandOwnershipNFT:     $($deployment.landOwnershipNFT)"
Write-Host "   LandTransferContract: $($deployment.landTransferContract)"
Write-Host ""
Write-Host "🔗 View on BaseScan:" -ForegroundColor Yellow
Write-Host "   https://sepolia.basescan.org/address/$($deployment.nationalIdNFT)"
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Restart client:  cd ..\client; npm run dev"
Write-Host "   2. Restart server:  cd ..\server; npm run dev"
Write-Host "   3. Test minting with a FRESH wallet (one that has not minted before)"
Write-Host ""
