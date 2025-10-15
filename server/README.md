# Server - NFT Minting Backend

Backend API for minting National ID and Land Ownership NFTs on Base Sepolia.

## Overview

This Express server handles:

- Document request submissions
- Admin verification
- **NFT minting** (National ID and Land Ownership)
- **Request deletion after minting** (data moves to blockchain)

## Key Concept

**Once an NFT is minted, the request is DELETED from the database.**

The data no longer lives in MongoDB—it lives on the blockchain as NFT metadata. This ensures:

- ✅ Single source of truth (blockchain)
- ✅ No data duplication
- ✅ Privacy (encrypted metadata on-chain)
- ✅ Immutability

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Copy Contract ABIs

After deploying contracts, copy the ABIs:

```bash
# From project root
cp blockchain/artifacts/contracts/NationalIdNFT.sol/NationalIdNFT.json server/src/abis/
cp blockchain/artifacts/contracts/LandOwnershipNFT.sol/LandOwnershipNFT.json server/src/abis/
```

### 3. Configure Environment

Copy `.env.example` to `.env` and fill in:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/veribase

# Pinata IPFS
PINATA_API_KEY=your_key
PINATA_SECRET_API_KEY=your_secret

# Blockchain (Base Sepolia)
BLOCKCHAIN_RPC_URL=https://sepolia.base.org
ADMIN_PRIVATE_KEY=0x...  # Admin wallet private key

# NFT Contracts (from blockchain/deployments/nfts-baseSepolia.json)
NATIONAL_ID_NFT_ADDRESS=0x...
LAND_OWNERSHIP_NFT_ADDRESS=0x...
LAND_TRANSFER_CONTRACT_ADDRESS=0x...
```

**Important:** The `ADMIN_PRIVATE_KEY` wallet must have Base Sepolia ETH for gas fees.

### 4. Run the Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Minting Flow

#### 1. Submit Request

```http
POST /api/requests
Content-Type: application/json

{
  "requesterWallet": "0x...",
  "requestType": "national_id" | "land_ownership",
  "files": [...],
  "consent": {...}
}
```

Status: `pending`

#### 2. Admin Verifies (separate endpoint)

```http
PATCH /api/requests/:requestId/status
Content-Type: application/json

{
  "status": "verified"
}
```

Status: `verified` → User can now mint

#### 3. User Mints NFT

```http
POST /api/requests/:requestId/mint
Content-Type: application/json

{
  "userWalletAddress": "0x..."
}
```

**What happens:**

1. ✅ Backend mints NFT on blockchain
2. ✅ Metadata stored on-chain
3. ✅ Request DELETED from database
4. ✅ Returns transaction hash and token ID

Response:

```json
{
  "success": true,
  "message": "NFT minted successfully! Request data has been moved to blockchain.",
  "data": {
    "requestId": "REQ-123",
    "requestType": "national_id",
    "tokenId": "1",
    "transactionHash": "0x...",
    "contractAddress": "0x...",
    "network": "Base Sepolia",
    "explorerUrl": "https://sepolia.basescan.org/tx/0x...",
    "note": "Request has been deleted from database. All data is now on blockchain."
  }
}
```

#### 4. Check Eligibility

```http
GET /api/requests/:requestId/can-mint
```

Returns whether the request can be minted.

#### 5. Get Wallet Requests

```http
GET /api/wallet/:address/requests
```

Returns only **unminted** requests (minted ones are deleted).

## How It Works

### Before Minting

```
User submits → MongoDB stores request
                    ↓
               Status: pending
                    ↓
            Admin verifies
                    ↓
               Status: verified
```

### After Minting

```
User clicks mint → Backend mints NFT
                         ↓
                 Metadata on blockchain
                         ↓
              Request DELETED from MongoDB
                         ↓
            User sees NFT in wallet
```

### Data Flow

**Before Minting:**

```json
// MongoDB
{
  "requestId": "REQ-123",
  "requesterWallet": "0xUser...",
  "requestType": "national_id",
  "files": [
    {
      "cid": "Qm...",
      "filename": "id_photo.jpg",
      "ciphertextHash": "0xabc..."
    }
  ],
  "status": "verified"
}
```

**After Minting:**

```solidity
// Blockchain (NationalIdNFT contract)
tokenId: 1
owner: 0xUser...
metadata: [
  {label: "document_type", value: "national_id", encrypted: false},
  {label: "id_photo.jpg", value: "0xabc...", encrypted: true},
  {label: "request_id", value: "REQ-123", encrypted: false}
]
```

**MongoDB:**

```
// Request deleted - no longer exists in DB
```

## Services

### NFT Service (`src/services/nft.service.ts`)

Handles blockchain interactions using Viem:

```typescript
import { mintNFT } from "./services/nft.service";

const result = await mintNFT({
  requestId: "REQ-123",
  requesterWallet: "0x...",
  requestType: "national_id",
  documents: [{ label: "photo", value: "ipfs://...", encrypted: true }],
});
```

**Functions:**

- `mintNFT(request)` - Mints NFT based on request type
- `areContractsInitialized()` - Checks if contracts loaded
- `getContractAddresses()` - Returns contract addresses

### Conditional Minting

The service automatically selects the correct contract:

```typescript
if (requestType === "national_id") {
  // Mints to NationalIdNFT (soul-bound)
  contract = nationalIdNFT;
} else if (requestType === "land_ownership") {
  // Mints to LandOwnershipNFT (transferable)
  contract = landOwnershipNFT;
}
```

## Database Schema

### Request Document

```typescript
interface IRequest {
  requestId: string;
  requesterWallet: string;
  requestType: 'national_id' | 'land_ownership';
  files: IDocMeta[];
  consent: {...};
  status: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
```

**Note:** No `nftMinted`, `nftTokenId`, or `nftTransactionHash` fields. Requests are deleted after minting.

## Error Handling

### Contract Not Initialized

```json
{
  "success": false,
  "error": "NFT contracts not initialized. Check environment variables."
}
```

**Fix:** Ensure ABIs are copied and .env has contract addresses.

### Request Already Minted

```json
{
  "success": false,
  "error": "Request not found or already minted (deleted from DB)"
}
```

This is expected! The request was successfully minted and deleted.

### Minting Failed

```json
{
  "success": false,
  "error": "Blockchain minting failed",
  "details": "insufficient funds for gas"
}
```

**Fix:** Admin wallet needs more Base Sepolia ETH.

## Gas Fees

The admin wallet pays gas fees for minting:

| Operation           | Estimated Gas | Cost (1 gwei) |
| ------------------- | ------------- | ------------- |
| Mint National ID    | ~150,000      | ~0.00015 ETH  |
| Mint Land Ownership | ~150,000      | ~0.00015 ETH  |

**Note:** Base Sepolia has very low gas fees (often <1 gwei).

## Security

### Private Keys

- ⚠️ **Never commit `.env` files**
- Admin private key has minting power
- Use a dedicated admin wallet (not your personal wallet)

### Access Control

- Only verified requests can be minted
- Only request owner can trigger minting
- Admin-only endpoints should be protected (add auth middleware)

### Data Privacy

- Sensitive data is encrypted before storing
- Only hashes/CIDs stored on blockchain
- Original files on IPFS (encrypted)

## Testing

### Test Minting Flow

```bash
# 1. Start server
npm run dev

# 2. Create request
curl -X POST http://localhost:6969/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "requesterWallet": "0x...",
    "requestType": "national_id",
    "files": [...]
  }'

# 3. Verify request (admin)
curl -X PATCH http://localhost:6969/api/requests/REQ-123/status \
  -H "Content-Type: application/json" \
  -d '{"status": "verified"}'

# 4. Check can mint
curl http://localhost:6969/api/requests/REQ-123/can-mint

# 5. Mint NFT
curl -X POST http://localhost:6969/api/requests/REQ-123/mint \
  -H "Content-Type: application/json" \
  -d '{"userWalletAddress": "0x..."}'

# 6. Verify request deleted
curl http://localhost:6969/api/requests/REQ-123
# Should return 404
```

## Monitoring

### Logs to Watch

```
✅ Contract ABIs loaded successfully
✅ Blockchain clients initialized
🎫 Minting national_id NFT for 0x...
   Sending transaction...
   Transaction sent: 0x...
   Waiting for confirmation...
✅ Transaction confirmed in block 12345
   Token ID: 1
🗑️  Request REQ-123 deleted from database (data now on blockchain)
```

### Failed Minting

```
❌ Minting failed: insufficient funds for gas
```

**Fix:** Add ETH to admin wallet

## Deployment

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Environment

- Development: Local Hardhat or Base Sepolia testnet
- Production: Base Mainnet

## Next Steps

1. ✅ Deploy NFT contracts (see `blockchain/` folder)
2. ✅ Copy contract addresses to `.env`
3. ✅ Copy ABIs to `src/abis/`
4. ✅ Fund admin wallet with Base Sepolia ETH
5. ✅ Start server
6. ✅ Test minting flow

## Troubleshooting

**ABIs not found:**

```bash
cp blockchain/artifacts/contracts/*/**.json server/src/abis/
```

**Contract not initialized:**
Check `.env` has all required variables.

**Transaction failed:**
Admin wallet needs ETH for gas fees.

**Request not found:**
Request was already minted (and deleted). Check blockchain explorer.

## License

MIT
