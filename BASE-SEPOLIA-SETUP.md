# 🚀 Base Sepolia Integration Setup Guide

## Overview
Your server is now connected to the blockchain! This guide will help you deploy and configure everything for Base Sepolia (no API key needed).

---

## Step 1: Set Up Blockchain Environment

### 1.1 Create blockchain/.env file

```bash
cd blockchain
cp .env.example .env
```

### 1.2 Edit blockchain/.env

```env
# Network Configuration
NETWORK=baseSepolia

# Your wallet private key (the one that will deploy and own the contract)
BASE_SEPOLIA_PRIVATE_KEY=your_private_key_here

# Contract address (leave empty for now, will update after deployment)
PROOF_NFT_ADDRESS=

# Hashing Configuration (don't change this)
HASH_SALT=veribase-proof-salt-2024
```

**⚠️ IMPORTANT:** 
- Never commit your `.env` file
- Make sure your wallet has Base Sepolia ETH
- Get free testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

---

## Step 2: Deploy Contract to Base Sepolia

### 2.1 Make sure you have testnet ETH

Check your balance at: https://sepolia.basescan.org/

### 2.2 Deploy the ProofNFT contract

```bash
cd blockchain
npx hardhat run scripts/deployProofNFT.ts --network baseSepolia
```

### 2.3 Copy the deployed contract address

The script will output something like:
```
✅ ProofNFT deployed to: 0x1234567890abcdef...
```

### 2.4 Update blockchain/.env with the contract address

```env
PROOF_NFT_ADDRESS=0x1234567890abcdef...
```

---

## Step 3: Set Up Server Environment

### 3.1 Create server/.env file

```bash
cd server
cp .env.example .env
```

### 3.2 Edit server/.env

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/veribase

# Server Port
PORT=6969

# Frontend Origin
FRONTEND_ORIGIN=http://localhost:3000

# Blockchain Network
BLOCKCHAIN_NETWORK=baseSepolia

# Pinata (optional - for IPFS)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

---

## Step 4: Test the Integration

### 4.1 Start MongoDB

```bash
# If using Docker
docker run -d -p 27017:27017 mongo

# Or start your local MongoDB
```

### 4.2 Start the server

```bash
cd server
npm run dev
```

### 4.3 Test the minting flow

#### Create a test request:

```bash
curl -X POST http://localhost:6969/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "requestType": "national_id",
    "requesterWallet": "0xYourWalletAddress",
    "files": [
      {
        "name": "id_front.jpg",
        "uri": "ipfs://QmTest",
        "hash": "abc123"
      }
    ]
  }'
```

#### Verify the request (simulate admin action):

```bash
curl -X PATCH http://localhost:6969/api/requests/REQ-123/status \
  -H "Content-Type: application/json" \
  -d '{"status": "verified"}'
```

#### Mint NFT (user action):

```bash
curl -X POST http://localhost:6969/api/requests/REQ-123/mint \
  -H "Content-Type: application/json" \
  -d '{"userWalletAddress": "0xYourWalletAddress"}'
```

---

## Step 5: Verify on Base Sepolia

After successful minting, you can verify:

### Check transaction on Basescan:
```
https://sepolia.basescan.org/tx/YOUR_TX_HASH
```

### Check NFT ownership:
```
https://sepolia.basescan.org/address/YOUR_CONTRACT_ADDRESS
```

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    USER FLOW                                │
└─────────────────────────────────────────────────────────────┘

1. User clicks [Mint] button in frontend
   │
   ▼
2. Frontend → POST /api/requests/:id/mint
   │
   ▼
3. Server validates request
   • Status = "verified"
   • nftMinted = false
   • Wallet matches requester
   │
   ▼
4. Server → blockchain.service.ts
   │
   ▼
5. Service executes → scripts/userMintNFT.ts
   │
   ▼
6. Script connects to Base Sepolia
   • Uses public RPC (no API key needed!)
   • Signs with your private key
   • Mints NFT on-chain
   │
   ▼
7. Returns transaction hash & token IDs
   │
   ▼
8. Server updates MongoDB
   • nftMinted = true
   • nftTokenId = 42
   • nftTransactionHash = "0x..."
   │
   ▼
9. Response to frontend with success!
```

---

## Network Configuration

### Base Sepolia Details:
- **Chain ID:** 84532
- **RPC URL:** https://sepolia.base.org (public, no API key!)
- **Block Explorer:** https://sepolia.basescan.org
- **Faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

---

## Troubleshooting

### Error: "Insufficient funds"
- Get testnet ETH from the faucet
- Each mint costs ~0.001 ETH in gas

### Error: "Contract not found"
- Make sure you deployed the contract
- Check that PROOF_NFT_ADDRESS is set correctly in blockchain/.env

### Error: "Cannot read properties of undefined"
- Ensure hardhat.config.ts has baseSepolia network configured
- Check that BASE_SEPOLIA_PRIVATE_KEY is set

### Error: "Network mismatch"
- Verify BLOCKCHAIN_NETWORK=baseSepolia in server/.env
- Check hardhat.config.ts has the correct network name

---

## Production Checklist

Before deploying to mainnet:

- [ ] Deploy contract to Base Mainnet (not Sepolia)
- [ ] Update NETWORK=base in .env files
- [ ] Use a secure wallet (hardware wallet recommended)
- [ ] Implement rate limiting on mint endpoint
- [ ] Add transaction monitoring/alerts
- [ ] Set up error logging (Sentry, etc.)
- [ ] Test with small amounts first
- [ ] Add gas estimation before minting
- [ ] Implement transaction retry logic
- [ ] Set up automated backups

---

## API Endpoints Reference

### Check Mint Eligibility
```
GET /api/requests/:requestId/can-mint
```

Returns button state (View/Mint/View NFT)

### Mint NFT
```
POST /api/requests/:requestId/mint
Body: { "userWalletAddress": "0x..." }
```

Triggers blockchain minting on Base Sepolia

### Get Wallet Requests
```
GET /api/wallet/:address/requests
```

Returns all requests with mint status

---

## Next Steps

1. ✅ Complete this setup
2. Deploy frontend with Mint button component
3. Test complete user flow
4. Deploy to production (Base Mainnet)

---

## Support

**Blockchain Explorer:** https://sepolia.basescan.org  
**Base Documentation:** https://docs.base.org  
**Get Testnet ETH:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

---

**Status:** ✅ Ready to deploy!  
**Network:** Base Sepolia (Testnet)  
**Cost:** FREE (testnet ETH)
