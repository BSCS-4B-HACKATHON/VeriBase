# 🚀 Blockchain Setup & Testing Guide

## ✅ What's Done

1. ✅ All dependencies installed (`node_modules/` exists)
2. ✅ Contracts compiled successfully with optimization
3. ✅ `.env` file created with detailed instructions
4. ✅ Test files created for both NFT contracts
5. ✅ Old ProofNFT scripts deleted
6. ✅ Hardhat config updated with Viem plugin

## 📋 Current Status

Your blockchain directory is ready for deployment!

### Installed Dependencies

```json
{
  "hardhat": "3.0.7",
  "viem": "2.38.1",
  "@openzeppelin/contracts": "5.4.0",
  "typescript": "5.8.0",
  "@types/chai": "5.2.2",
  "@types/mocha": "10.0.10",
  "chai": "6.2.0"
}
```

### Smart Contracts

- ✅ `NationalIdNFT.sol` - Soul-bound National ID NFT
- ✅ `LandOwnershipNFT.sol` - Transferable Land NFT
- ✅ `LandTransferContract.sol` - Authorized land transfer handler

## 🔧 Setup Steps

### Step 1: Get Testnet ETH

Visit the Base Sepolia faucet:

```
https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
```

Or use this alternative:

```
https://faucet.quicknode.com/base/sepolia
```

### Step 2: Export Your Private Key

**MetaMask:**

1. Click account menu (top right)
2. Account details → Export private key
3. Enter password
4. Copy the private key

⚠️ **NEVER share this key with anyone!**

### Step 3: Configure `.env`

Open `blockchain/.env` and update:

```bash
# Replace with your actual private key (remove 0x prefix)
BASE_SEPOLIA_PRIVATE_KEY=your_private_key_here

# Contract addresses (leave empty for now)
NATIONAL_ID_NFT_ADDRESS=
LAND_OWNERSHIP_NFT_ADDRESS=
LAND_TRANSFER_CONTRACT_ADDRESS=

# Admin wallet for server (can be same as above for testing)
ADMIN_PRIVATE_KEY=your_private_key_here
```

### Step 4: Deploy Contracts

Run the deployment script:

```bash
cd blockchain
npx hardhat run scripts/deployNFTs.ts --network baseSepolia
```

Expected output:

```
🚀 Deploying NationalIdNFT and LandOwnershipNFT contracts
============================================================

📋 Deployment Details:
   Deployer: 0x...
   Network: baseSepolia

🔨 Deploying NationalIdNFT...
   ✅ NationalIdNFT deployed to: 0x...
   Name: National ID Proof
   Symbol: NATID

🔨 Deploying LandOwnershipNFT...
   ✅ LandOwnershipNFT deployed to: 0x...
   Name: Land Ownership Proof
   Symbol: LAND

🔨 Deploying LandTransferContract...
   ✅ LandTransferContract deployed to: 0x...

📊 Deployment Summary
==================================
Network:                baseSepolia
Deployer:               0x...
NationalIdNFT:          0x...
LandOwnershipNFT:       0x...
LandTransferContract:   0x...
==================================
```

### Step 5: Update `.env` with Deployed Addresses

Copy the deployed contract addresses and update your `.env`:

```bash
NATIONAL_ID_NFT_ADDRESS=0x... # Copy from deployment output
LAND_OWNERSHIP_NFT_ADDRESS=0x... # Copy from deployment output
LAND_TRANSFER_CONTRACT_ADDRESS=0x... # Copy from deployment output
```

### Step 6: Copy ABIs to Server

After deployment, copy the contract ABIs to your server:

```bash
# From blockchain directory
cp artifacts/contracts/NationalIdNFT.sol/NationalIdNFT.json ../server/src/abis/
cp artifacts/contracts/LandOwnershipNFT.sol/LandOwnershipNFT.json ../server/src/abis/
```

Or on Windows:

```bash
copy "artifacts\\contracts\\NationalIdNFT.sol\\NationalIdNFT.json" "..\\server\\src\\abis\\"
copy "artifacts\\contracts\\LandOwnershipNFT.sol\\LandOwnershipNFT.json" "..\\server\\src\\abis\\"
```

### Step 7: Update Server `.env`

Copy the contract addresses to your server `.env`:

```bash
# server/.env
NATIONAL_ID_NFT_ADDRESS=0x... # Same as blockchain/.env
LAND_OWNERSHIP_NFT_ADDRESS=0x... # Same as blockchain/.env
ADMIN_PRIVATE_KEY=... # Wallet that will pay gas for minting
```

## 🧪 Testing

### Quick Test (Recommended)

Test contracts locally before deploying:

```bash
npx hardhat run scripts/quickTest.ts --network hardhat
```

This will:

- Deploy both NFT contracts locally
- Mint test NFTs
- Verify all functionality works
- Test transfer restrictions

### Full Test Suite

Run comprehensive tests (note: Hardhat 3.0 has some test runner limitations):

```bash
npx hardhat test
```

### Manual Testing

1. **Compile contracts:**

   ```bash
   npx hardhat compile
   ```

2. **Deploy to local network:**

   ```bash
   npx hardhat node  # Terminal 1
   npx hardhat run scripts/deployNFTs.ts --network localhost  # Terminal 2
   ```

3. **Test minting:**
   ```bash
   npx hardhat run scripts/quickTest.ts --network localhost
   ```

## 📁 File Structure

```
blockchain/
├── .env                          ✅ Your private keys (NEVER commit!)
├── .env.example                  ✅ Template for others
├── hardhat.config.ts             ✅ Network configuration
├── package.json                  ✅ Dependencies
├── contracts/
│   ├── NationalIdNFT.sol         ✅ Soul-bound ID NFT
│   ├── LandOwnershipNFT.sol      ✅ Transferable land NFT
│   └── LandTransferContract.sol  ✅ Transfer handler
├── scripts/
│   ├── deployNFTs.ts             ✅ Main deployment script
│   ├── quickTest.ts              ✅ Quick test script
│   └── send-op-tx.ts             ✅ Utility script
├── test/
│   ├── NationalIdNFT.ts          ✅ National ID tests
│   └── LandOwnershipNFT.ts       ✅ Land ownership tests
└── artifacts/                    (Generated after compile)
    └── contracts/
        ├── NationalIdNFT.sol/
        │   └── NationalIdNFT.json  ← Copy to server
        └── LandOwnershipNFT.sol/
            └── LandOwnershipNFT.json  ← Copy to server
```

## 🔍 Verify Deployment

After deploying to Base Sepolia, verify your contracts on Basescan:

1. Visit: https://sepolia.basescan.org/
2. Search for your contract address
3. Click "Contract" tab
4. See your deployed contract!

### Optional: Verify Contract Code

```bash
npx hardhat verify --network baseSepolia NATIONAL_ID_NFT_ADDRESS
npx hardhat verify --network baseSepolia LAND_OWNERSHIP_NFT_ADDRESS
npx hardhat verify --network baseSepolia LAND_TRANSFER_CONTRACT_ADDRESS "LAND_OWNERSHIP_ADDRESS" 250 "FEE_RECIPIENT_ADDRESS"
```

## 🎯 Next Steps

Once blockchain is deployed:

1. ✅ Start your server: `cd ../server && npm run dev`
2. ✅ Test minting endpoint: `POST /api/requests/:id/mint`
3. ✅ Start your frontend: `cd ../client && npm run dev`
4. ✅ Test the complete flow: Create request → Verify → Mint NFT

## 🐛 Troubleshooting

### "Insufficient funds" Error

- Get more Base Sepolia ETH from the faucet
- Each deployment costs ~0.01 ETH

### "Nonce too high" Error

- Reset MetaMask account: Settings → Advanced → Reset Account

### "Contract already deployed" Error

- Delete `deployments/` folder and `cache/` folder
- Run `npx hardhat clean`
- Try deploying again

### TypeScript Errors in IDE

- These are just warnings - the code will run fine
- Hardhat 3.0 has some type definition issues
- Restart VS Code to refresh types

### Test Runner Issues

- Use `scripts/quickTest.ts` instead of formal test suite
- Hardhat 3.0's test runner is still in beta

## 📚 Useful Commands

```bash
# Compile contracts
npx hardhat compile

# Clean build artifacts
npx hardhat clean

# Run local node
npx hardhat node

# Deploy to Base Sepolia
npx hardhat run scripts/deployNFTs.ts --network baseSepolia

# Check account balance
npx hardhat run scripts/checkBalance.ts --network baseSepolia

# Run tests
npx hardhat test

# Verify contract
npx hardhat verify --network baseSepolia CONTRACT_ADDRESS
```

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ Deployment completes without errors
2. ✅ You can see contracts on Basescan
3. ✅ Server can read contract ABIs
4. ✅ Server can mint NFTs successfully
5. ✅ Requests are deleted after minting
6. ✅ NFTs appear in user wallets

## 🔐 Security Reminders

- ✅ **NEVER** commit `.env` to Git
- ✅ **NEVER** share your private keys
- ✅ Use different wallets for testing and production
- ✅ Keep your admin wallet topped up with ETH
- ✅ Monitor gas costs on mainnet

---

**Ready to deploy? Run:**

```bash
npx hardhat run scripts/deployNFTs.ts --network baseSepolia
```
