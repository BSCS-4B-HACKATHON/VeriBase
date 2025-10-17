# Complete Smart Contract Rebuild & Redeploy Guide

## Step 1: Clean & Compile

```bash
cd d:\veri-base\blockchain

# Clean old artifacts
rm -rf artifacts cache

# Compile contracts
npx hardhat compile
```

## Step 2: Deploy to Base Sepolia

```bash
# Make sure you have your private key in .env
# ADMIN_PRIVATE_KEY=your_private_key_here

# Deploy contracts
npx hardhat run scripts/deploy.ts --network baseSepolia
```

## Step 3: Update Contract Addresses

After deployment, you'll get new addresses. Update these files:

### A. Update `blockchain/deployments/baseSepolia.json`
```json
{
  "nationalIdNFT": "0x...",
  "landOwnershipNFT": "0x...",
  "landTransferContract": "0x...",
  "deployer": "0x...",
  "network": "baseSepolia",
  "chainId": 84532,
  "deployedAt": "..."
}
```

### B. Update `blockchain/.env`
```env
NATIONAL_ID_NFT_ADDRESS=0x...
LAND_OWNERSHIP_NFT_ADDRESS=0x...
LAND_TRANSFER_CONTRACT_ADDRESS=0x...
```

### C. Update `client/.env`
```env
NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS=0x...
NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS=0x...
NEXT_PUBLIC_LAND_TRANSFER_CONTRACT_ADDRESS=0x...
```

### D. Update `server/.env`
```env
NATIONAL_ID_NFT_ADDRESS=0x...
LAND_OWNERSHIP_NFT_ADDRESS=0x...
LAND_TRANSFER_CONTRACT_ADDRESS=0x...
```

## Step 4: Copy Fresh ABIs

```bash
# Copy ABIs to client
Copy-Item "blockchain\artifacts\contracts\NationalIdNFT.sol\NationalIdNFT.json" "client\src\abis\"
Copy-Item "blockchain\artifacts\contracts\LandOwnershipNFT.sol\LandOwnershipNFT.json" "client\src\abis\"
Copy-Item "blockchain\artifacts\contracts\LandTransferContract.sol\LandTransferContract.json" "client\src\abis\"

# Copy ABIs to server
Copy-Item "blockchain\artifacts\contracts\NationalIdNFT.sol\NationalIdNFT.json" "server\src\abis\"
Copy-Item "blockchain\artifacts\contracts\LandOwnershipNFT.sol\LandOwnershipNFT.json" "server\src\abis\"
Copy-Item "blockchain\artifacts\contracts\LandTransferContract.sol\LandTransferContract.json" "server\src\abis\"
```

## Step 5: Update Client contracts.ts

Edit `client/lib/contracts.ts`:

```typescript
// Update these addresses with new deployment addresses
export const CONTRACT_ADDRESSES = {
  NationalIdNFT: "0x..." as `0x${string}`,
  LandOwnershipNFT: "0x..." as `0x${string}`,
  LandTransferContract: "0x..." as `0x${string}`,
} as const;
```

## Step 6: Update Server contracts.ts

Edit `server/src/utils/contracts.ts`:

```typescript
// Update fallback addresses
export const CONTRACT_ADDRESSES = {
  NationalIdNFT: (process.env.NATIONAL_ID_NFT_ADDRESS || "0x...") as `0x${string}`,
  LandOwnershipNFT: (process.env.LAND_OWNERSHIP_NFT_ADDRESS || "0x...") as `0x${string}`,
  LandTransferContract: (process.env.LAND_TRANSFER_CONTRACT_ADDRESS || "0x...") as `0x${string}`,
} as const;
```

## Step 7: Restart Everything

```bash
# Terminal 1 - Client
cd d:\veri-base\client
npm run dev

# Terminal 2 - Server  
cd d:\veri-base\server
npm run dev
```

## Step 8: Verify Deployment

1. Check contracts on BaseScan:
   - https://sepolia.basescan.org/address/YOUR_CONTRACT_ADDRESS

2. Test minting with a fresh wallet

## Troubleshooting

### If compile fails:
```bash
npm install
npx hardhat clean
npx hardhat compile
```

### If deploy fails:
- Check you have testnet ETH
- Verify ADMIN_PRIVATE_KEY in .env
- Check RPC endpoint is working

### If ABIs don't match:
- Make sure you copied from the correct artifact path
- ABIs should include an "address" field at the bottom
- Regenerate if needed

## Quick Test After Deployment

```bash
# Check contract is deployed
npx hardhat run scripts/quickTest.ts --network baseSepolia
```

This will verify:
- ✅ Contracts are deployed
- ✅ Contract addresses are correct  
- ✅ You can read from contracts
- ✅ Network connection works
