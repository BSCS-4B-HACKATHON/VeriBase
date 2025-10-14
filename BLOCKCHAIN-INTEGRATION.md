# Connecting Blockchain Minting to Server API

## Overview

This guide explains how to integrate the actual blockchain minting script (`userMintNFT.ts`) with your Express.js API endpoint.

---

## Current State

### ✅ What's Ready
- `scripts/userMintNFT.ts` - User-initiated minting script
- `server/src/controllers/nft.controller.ts` - API endpoint (using mock data)
- `server/src/routes/nft.route.ts` - Express routes
- `server/src/models/DocMetaSchema.ts` - MongoDB schema with NFT fields

### ⚠️ What's Pending
- Connecting the blockchain script to the API controller
- Replacing mock data with actual blockchain transactions

---

## Integration Steps

### Step 1: Update the Controller

Replace the mock minting section in `server/src/controllers/nft.controller.ts`:

#### Current (Mock) Code:
```typescript
// Simulated minting (replace with actual blockchain call)
const mockTokenId = Math.floor(Math.random() * 10000);
const mockTxHash = "0x" + "a".repeat(64); // Mock transaction hash

// Update request in database
request.nftMinted = true;
request.nftTokenId = mockTokenId;
request.nftTransactionHash = mockTxHash;
request.nftMintedAt = new Date();
```

#### Replace With:
```typescript
// Import the blockchain minting function at the top of the file
import { mintNFTForUser } from "../../../blockchain/scripts/userMintNFT";

// Then in the mintNFT function, replace the mock section with:
try {
    // Prepare request data for blockchain minting
    const mintRequest = {
        _id: request._id.toString(),
        requestId: request.requestId,
        requestType: request.requestType,
        requesterWallet: request.requesterWallet,
        files: request.files,
    };

    // Call blockchain minting function
    console.log(`🚀 Minting NFT for request ${request.requestId}...`);
    const mintResult = await mintNFTForUser(mintRequest, userWalletAddress);

    // Update request in database with actual blockchain data
    request.nftMinted = true;
    request.nftTokenId = mintResult.tokenIds[0]; // First token ID
    request.nftTransactionHash = mintResult.transactionHash;
    request.nftMintedAt = new Date();

    await request.save();

    console.log(`✅ NFT minted: Token ID ${mintResult.tokenIds[0]}`);

    res.json({
        success: true,
        message: "NFT minted successfully!",
        data: {
            requestId: request.requestId,
            tokenId: mintResult.tokenIds[0],
            transactionHash: mintResult.transactionHash,
            mintedAt: request.nftMintedAt,
            totalTokensMinted: mintResult.tokenIds.length,
        },
    });
} catch (mintError: any) {
    console.error(`❌ Minting failed for ${request.requestId}:`, mintError);
    
    // Return detailed error to frontend
    return res.status(500).json({
        success: false,
        error: "Blockchain minting failed",
        details: mintError.message,
    });
}
```

---

## Complete Updated Controller

Here's the full updated `mintNFT` function in `server/src/controllers/nft.controller.ts`:

```typescript
import RequestModel from "../models/DocMetaSchema";
import { Request, Response } from "express";
import { mintNFTForUser } from "../../../blockchain/scripts/userMintNFT";

export const mintNFT = async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;
        const { userWalletAddress } = req.body;

        const request = await RequestModel.findOne({ requestId });

        if (!request) {
            return res.status(404).json({
                success: false,
                error: "Request not found",
            });
        }

        // Validation checks
        if (request.status !== "verified") {
            return res.status(400).json({
                success: false,
                error: `Cannot mint: Request status is "${request.status}". Must be "verified".`,
            });
        }

        if (request.nftMinted) {
            return res.status(400).json({
                success: false,
                error: "NFT already minted for this request",
                nftTokenId: request.nftTokenId,
                nftTransactionHash: request.nftTransactionHash,
            });
        }

        if (
            request.requesterWallet.toLowerCase() !==
            userWalletAddress.toLowerCase()
        ) {
            return res.status(403).json({
                success: false,
                error: "Wallet address does not match request owner",
            });
        }

        // ============================================
        // ACTUAL BLOCKCHAIN MINTING
        // ============================================
        try {
            // Prepare request data for blockchain minting
            const mintRequest = {
                _id: request._id.toString(),
                requestId: request.requestId,
                requestType: request.requestType,
                requesterWallet: request.requesterWallet,
                files: request.files,
            };

            // Call blockchain minting function
            console.log(`🚀 Minting NFT for request ${request.requestId}...`);
            const mintResult = await mintNFTForUser(mintRequest, userWalletAddress);

            // Update request in database with actual blockchain data
            request.nftMinted = true;
            request.nftTokenId = mintResult.tokenIds[0]; // First token ID
            request.nftTransactionHash = mintResult.transactionHash;
            request.nftMintedAt = new Date();

            await request.save();

            console.log(`✅ NFT minted successfully!`);
            console.log(`   Token ID: ${mintResult.tokenIds[0]}`);
            console.log(`   Transaction: ${mintResult.transactionHash}`);

            res.json({
                success: true,
                message: "NFT minted successfully!",
                data: {
                    requestId: request.requestId,
                    tokenId: mintResult.tokenIds[0],
                    transactionHash: mintResult.transactionHash,
                    mintedAt: request.nftMintedAt,
                    totalTokensMinted: mintResult.tokenIds.length,
                },
            });
        } catch (mintError: any) {
            console.error(`❌ Blockchain minting failed:`, mintError);
            
            // Return detailed error to frontend
            return res.status(500).json({
                success: false,
                error: "Blockchain minting failed",
                details: mintError.message,
            });
        }
    } catch (error: any) {
        console.error("Server error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
            details: error.message,
        });
    }
};
```

---

## TypeScript Configuration

### Issue: Import Path
The `userMintNFT.ts` script is in the `blockchain/` folder, but your server is in `server/src/`. You have two options:

#### Option 1: Relative Import (Recommended)
```typescript
import { mintNFTForUser } from "../../../blockchain/scripts/userMintNFT";
```

#### Option 2: Update tsconfig.json with Path Aliases
Add this to `server/tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@blockchain/*": ["../blockchain/*"]
    }
  }
}
```

Then import as:
```typescript
import { mintNFTForUser } from "@blockchain/scripts/userMintNFT";
```

---

## Environment Variables

Make sure your `.env` file in the `blockchain/` folder has:

```env
# Hardhat Network (for development)
HARDHAT_NETWORK=localhost

# Contract Address (after deployment)
PROOF_NFT_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Private Key (for minting - this should be the contract owner's key)
DEPLOYER_PRIVATE_KEY=your_private_key_here
```

---

## Running the Integrated System

### Step 1: Start Hardhat Node
```bash
cd blockchain
npx hardhat node
```

### Step 2: Deploy Contract
```bash
cd blockchain
npx hardhat run scripts/deployProofNFT.ts --network localhost
```

Copy the deployed contract address and update your `.env`:
```env
PROOF_NFT_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Step 3: Start MongoDB
```bash
# If using Docker
docker run -d -p 27017:27017 mongo

# Or start your local MongoDB
```

### Step 4: Start Backend Server
```bash
cd server
npm run dev
```

### Step 5: Start Frontend
```bash
cd client
npm run dev
```

---

## Testing the Integration

### 1. Create a Test Request
```bash
curl -X POST http://localhost:6969/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "requestType": "national_id",
    "requesterWallet": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "files": [
      {
        "name": "id_front.jpg",
        "uri": "ipfs://Qm...",
        "hash": "abc123"
      }
    ]
  }'
```

### 2. Verify the Request (Admin Action)
```bash
curl -X PATCH http://localhost:6969/api/requests/REQ-123/status \
  -H "Content-Type: application/json" \
  -d '{"status": "verified"}'
```

### 3. Check Mint Eligibility
```bash
curl http://localhost:6969/api/requests/REQ-123/can-mint
```

Expected response:
```json
{
  "success": true,
  "data": {
    "requestId": "REQ-123",
    "status": "verified",
    "canMint": true,
    "buttonText": "Mint",
    "buttonAction": "mint"
  }
}
```

### 4. Mint NFT (User Action)
```bash
curl -X POST http://localhost:6969/api/requests/REQ-123/mint \
  -H "Content-Type: application/json" \
  -d '{
    "userWalletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "NFT minted successfully!",
  "data": {
    "requestId": "REQ-123",
    "tokenId": 1,
    "transactionHash": "0xabc123...",
    "mintedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Error Handling

### Common Errors and Solutions

#### 1. Contract Not Deployed
```
Error: Contract not deployed at address 0x0000...
```
**Solution:** Deploy the contract first using `deployProofNFT.ts`

#### 2. Network Mismatch
```
Error: Could not detect network
```
**Solution:** Make sure Hardhat node is running and `HARDHAT_NETWORK=localhost` in `.env`

#### 3. Insufficient Permissions
```
Error: Only owner can mint
```
**Solution:** Make sure the private key in `.env` is the contract owner's key

#### 4. Invalid Wallet Address
```
Error: Wallet address does not match request owner
```
**Solution:** Make sure the `userWalletAddress` matches the `requesterWallet` in the request

---

## Production Considerations

### 1. Gas Estimation
Add gas estimation before minting:
```typescript
const gasEstimate = await proofNFT.estimateGas.ownerMintTo(
    userWalletAddress,
    hash
);
console.log(`Estimated gas: ${gasEstimate}`);
```

### 2. Transaction Confirmation
Wait for multiple confirmations:
```typescript
const receipt = await tx.wait(3); // Wait for 3 confirmations
```

### 3. Rate Limiting
Add rate limiting to prevent spam:
```typescript
import rateLimit from 'express-rate-limit';

const mintLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 mints per 15 minutes
    message: 'Too many mint requests, please try again later',
});

router.post('/requests/:requestId/mint', mintLimiter, mintNFT);
```

### 4. Transaction Queue
Implement a queue system for handling multiple mint requests:
```typescript
import Queue from 'bull';

const mintQueue = new Queue('nft-minting');

mintQueue.process(async (job) => {
    const { requestId, userWalletAddress } = job.data;
    return await mintNFTForUser(requestId, userWalletAddress);
});
```

---

## Next Steps

1. ✅ Update controller with actual blockchain calls
2. ✅ Test integration with local Hardhat network
3. ✅ Deploy to testnet (Sepolia/Goerli)
4. ✅ Test with real wallet (MetaMask)
5. ✅ Add frontend integration (see FRONTEND-INTEGRATION.md)
6. ✅ Add error monitoring (Sentry, LogRocket)
7. ✅ Deploy to production

---

## Troubleshooting

### Check Contract Deployment
```bash
cd blockchain
npx hardhat console --network localhost

# In console:
const ProofNFT = await ethers.getContractFactory("ProofNFT");
const contract = await ProofNFT.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");
const name = await contract.name();
console.log("Contract Name:", name); // Should print "ProofNFT"
```

### Check Server Connection
```bash
# Test server health
curl http://localhost:6969/

# Test MongoDB connection
curl http://localhost:6969/api/requests
```

### View Hardhat Logs
The Hardhat node will show transaction logs:
```
eth_sendTransaction
  Contract call:       ProofNFT#ownerMintTo
  From:                0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
  To:                  0x5fbdb2315678afecb367f032d93f642f64180aa3
  Value:               0 ETH
  Gas used:            123456 of 200000
```

---

## Support

If you encounter issues:
1. Check all services are running (Hardhat, MongoDB, Server, Frontend)
2. Verify contract is deployed and address is correct in `.env`
3. Check server logs for errors
4. Use `console.log` in controller to debug request flow
5. Test blockchain functions directly using Hardhat console
