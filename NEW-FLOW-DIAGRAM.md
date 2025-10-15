# Visual Flow Diagram - New NFT System

## 🎯 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User (Frontend)                          │
│                    Next.js + Wagmi v2                            │
└────────┬────────────────────────────────────────┬────────────────┘
         │                                         │
         │ Submit Request                          │ Connect Wallet
         │                                         │ (MetaMask/Coinbase)
         ↓                                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Express Backend                             │
│                   (server/src/*)                                 │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/requests         → Create request (status: pending)  │
│  PATCH /api/requests/:id/status → Admin verify                  │
│  POST /api/requests/:id/mint    → Mint NFT + DELETE request     │
└────────┬───────────────────────────────────────┬────────────────┘
         │                                        │
         │ Store                                  │ Mint + Delete
         ↓                                        ↓
┌──────────────────────┐            ┌──────────────────────────────┐
│      MongoDB         │            │   Blockchain (Base Sepolia)  │
│                      │            │                              │
│  Before Mint:        │            │  After Mint:                 │
│  ✅ Request stored   │            │  ✅ NFT minted               │
│                      │   ────────→│  ✅ Metadata on-chain        │
│  After Mint:         │   Delete   │  ✅ Permanent ownership      │
│  ❌ Request deleted  │            │                              │
└──────────────────────┘            └──────────────────────────────┘
```

## 📊 Data Lifecycle

### Phase 1: Request Submission

```
User (Frontend)
    ↓
    POST /api/requests
    ↓
┌─────────────────────────────────┐
│         MongoDB                 │
│                                 │
│  {                              │
│    requestId: "REQ-123",        │
│    requesterWallet: "0xUser",   │
│    requestType: "national_id",  │
│    files: [{                    │
│      cid: "Qm...",              │
│      ciphertextHash: "0xabc"    │
│    }],                          │
│    status: "pending" ⬅️         │
│  }                              │
└─────────────────────────────────┘
```

### Phase 2: Admin Verification

```
Admin (Frontend/Backend)
    ↓
    PATCH /api/requests/REQ-123/status
    {status: "verified"}
    ↓
┌─────────────────────────────────┐
│         MongoDB                 │
│                                 │
│  {                              │
│    ...                          │
│    status: "verified" ⬅️        │
│  }                              │
│                                 │
│  (Ready to mint!)               │
└─────────────────────────────────┘
```

### Phase 3: NFT Minting & Deletion

```
User (Frontend)
    ↓
    POST /api/requests/REQ-123/mint
    {userWalletAddress: "0xUser"}
    ↓
Backend (server/src/services/nft.service.ts)
    ↓
    1. Select contract based on requestType
    2. Prepare metadata from request files
    3. Call contract.safeMint()
    ↓
┌──────────────────────────────────────────────────┐
│           Blockchain (Base Sepolia)              │
│                                                  │
│  NationalIdNFT / LandOwnershipNFT                │
│                                                  │
│  safeMint(0xUser, metadata[])                    │
│      ↓                                           │
│  Token #1 created ✅                             │
│  Owner: 0xUser                                   │
│  Metadata: [                                     │
│    {label: "document_type", value: "national_id"}│
│    {label: "file.jpg", value: "0xabc..."}       │
│    {label: "request_id", value: "REQ-123"}      │
│  ]                                               │
└──────────────────────────────────────────────────┘
    ↓
    Transaction confirmed
    ↓
Backend: await RequestModel.deleteOne({requestId})
    ↓
┌─────────────────────────────────┐
│         MongoDB                 │
│                                 │
│  (Request deleted) ❌           │
│                                 │
│  Data now lives on blockchain   │
│  only!                          │
└─────────────────────────────────┘
    ↓
    Return to user:
    {
      tokenId: "1",
      transactionHash: "0x...",
      explorerUrl: "https://sepolia.basescan.org/tx/0x...",
      note: "Request deleted from database"
    }
```

## 🔄 Request Type Routing

```
POST /api/requests/:id/mint
         ↓
    Check requestType
         ↓
    ┌────────────────┐
    │  national_id?  │
    └────────────────┘
         ↓
    ┌────┴────┐
    │         │
   Yes       No
    │         │
    ↓         ↓
┌─────────────────────┐    ┌─────────────────────┐
│  NationalIdNFT      │    │ LandOwnershipNFT    │
│  (Soul-bound)       │    │ (Transferable)      │
├─────────────────────┤    ├─────────────────────┤
│ • One per wallet    │    │ • Multiple allowed  │
│ • Non-transferable  │    │ • Via contract only │
│ • Identity proof    │    │ • Property ownership│
└─────────────────────┘    └─────────────────────┘
         ↓                          ↓
    Mint to user wallet        Mint to user wallet
         ↓                          ↓
    Delete request             Delete request
```

## 🗂️ Metadata Structure

### Before Minting (MongoDB)

```json
{
  "requestId": "REQ-123",
  "requesterWallet": "0xUser...",
  "requestType": "national_id",
  "files": [
    {
      "cid": "QmPhoto123...",
      "filename": "id_photo.jpg",
      "ciphertextHash": "0xabc123..."
    },
    {
      "cid": "QmSignature456...",
      "filename": "signature.png",
      "ciphertextHash": "0xdef456..."
    }
  ],
  "status": "verified"
}
```

### After Minting (Blockchain)

```solidity
// NationalIdNFT Contract
mapping(uint256 => DocMeta[]) private _tokenMetadata;

// Token #1
_tokenMetadata[1] = [
  {
    label: "document_type",
    value: "national_id",
    encrypted: false
  },
  {
    label: "id_photo.jpg",
    value: "0xabc123...",  // ciphertextHash
    encrypted: true
  },
  {
    label: "signature.png",
    value: "0xdef456...",  // ciphertextHash
    encrypted: true
  },
  {
    label: "request_id",
    value: "REQ-123",
    encrypted: false
  }
]

_owners[1] = 0xUser...  // Owner of token
_balances[0xUser...] = 1  // One token (soul-bound limit)
```

## 🚀 NFT Service Flow

```
mintNFT(request)
    ↓
┌──────────────────────────────────────┐
│  1. Validate inputs                  │
│     - Check contracts initialized    │
│     - Check ABIs loaded              │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│  2. Select contract                  │
│     if (requestType === 'national_id')│
│       → NationalIdNFT               │
│     else                             │
│       → LandOwnershipNFT            │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│  3. Prepare metadata                 │
│     [                                │
│       {label, value, encrypted},     │
│       ...                            │
│     ]                                │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│  4. Send transaction (Viem)          │
│     walletClient.writeContract({     │
│       address: contractAddress,      │
│       abi,                           │
│       functionName: 'safeMint',      │
│       args: [wallet, metadata]       │
│     })                               │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│  5. Wait for confirmation            │
│     publicClient.waitForTransactionReceipt()│
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│  6. Extract tokenId from logs        │
│     Find Transfer event              │
│     tokenId = log.topics[3]          │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│  7. Return result                    │
│     {                                │
│       tokenId,                       │
│       transactionHash,               │
│       contractAddress,               │
│       explorerUrl                    │
│     }                                │
└──────────────────────────────────────┘
```

## 🔐 Security & Privacy

```
┌─────────────────────────────────────────────────────────────┐
│                      User's Data                             │
│                                                              │
│  Original Files (IPFS):                                      │
│  • id_photo.jpg → Encrypted with AES-256                    │
│  • signature.png → Encrypted with AES-256                   │
│                                                              │
│  Encryption:                                                 │
│  plaintext --[AES-256]--> ciphertext                        │
│  ciphertext --[SHA-256]--> ciphertextHash                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  What Goes On Blockchain                     │
│                                                              │
│  NFT Metadata:                                               │
│  • document_type: "national_id" (plaintext)                 │
│  • id_photo.jpg: "0xabc123..." (hash only) ✅               │
│  • signature.png: "0xdef456..." (hash only) ✅              │
│  • request_id: "REQ-123" (plaintext)                        │
│                                                              │
│  ❌ NO original files                                        │
│  ❌ NO personal information                                  │
│  ✅ ONLY hashes and metadata                                 │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Frontend Integration

```
User Wallet (MetaMask/Coinbase)
    ↓
    Connected via Wagmi v2
    ↓
┌──────────────────────────────────────┐
│  View Requests Page                  │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ Request REQ-123                │ │
│  │ Type: National ID              │ │
│  │ Status: verified               │ │
│  │                                │ │
│  │ [Mint NFT] ⬅️ Click here      │ │
│  └────────────────────────────────┘ │
└──────────────────────────────────────┘
    ↓
    POST /api/requests/REQ-123/mint
    ↓
┌──────────────────────────────────────┐
│  Minting...                          │
│  ⏳ Transaction pending              │
└──────────────────────────────────────┘
    ↓
    Transaction confirmed
    ↓
┌──────────────────────────────────────┐
│  ✅ Success!                          │
│                                      │
│  Your NFT has been minted:           │
│  • Token ID: #1                      │
│  • Transaction: 0xabc...             │
│  • View on Basescan                  │
│                                      │
│  Note: Request has been deleted      │
│  from database. Data now lives       │
│  on blockchain.                      │
└──────────────────────────────────────┘
    ↓
┌──────────────────────────────────────┐
│  View in Wallet                      │
│                                      │
│  MetaMask/Coinbase:                  │
│  • National ID NFT #1                │
│  • Contract: 0x...                   │
│  • Non-transferable (soul-bound)     │
└──────────────────────────────────────┘
```

## 🔍 Querying NFTs

### From Frontend

```typescript
// Using Wagmi
import { useReadContract } from "wagmi";

const { data: metadata } = useReadContract({
  address: NATIONAL_ID_NFT_ADDRESS,
  abi: NationalIdNFTABI,
  functionName: "getDocumentMetadata",
  args: [tokenId],
});

// Returns:
// [
//   {label: "document_type", value: "national_id", encrypted: false},
//   {label: "id_photo.jpg", value: "0xabc...", encrypted: true},
//   ...
// ]
```

### From Backend

```typescript
// Using Viem
const metadata = await publicClient.readContract({
  address: NATIONAL_ID_NFT_ADDRESS,
  abi: NationalIdNFTABI,
  functionName: "getDocumentMetadata",
  args: [tokenId],
});
```

### From Blockchain Explorer

```
1. Go to: https://sepolia.basescan.org
2. Search contract: 0x... (NATIONAL_ID_NFT_ADDRESS)
3. Go to "Read Contract" tab
4. Call getDocumentMetadata(tokenId)
5. See all metadata on-chain
```

## 🎭 State Diagram

```
┌──────────┐
│ Pending  │
└────┬─────┘
     │
     │ Admin verifies
     ↓
┌──────────┐
│ Verified │ ⬅️ User can mint
└────┬─────┘
     │
     │ User mints NFT
     ↓
┌──────────────────┐
│ Minted & Deleted │ ⬅️ Request no longer exists
└──────────────────┘
     │
     │ Data lives on blockchain
     ↓
┌──────────────────┐
│ NFT in Wallet    │ ⬅️ Permanent ownership
└──────────────────┘
```

## 💰 Gas Costs

```
User submits request
    ↓
    FREE (just API call)
    ↓
Admin verifies
    ↓
    FREE (just API call)
    ↓
User mints NFT
    ↓
    GAS PAID BY ADMIN WALLET
    ↓
┌──────────────────────────────────┐
│ Minting Cost:                    │
│ • National ID: ~150,000 gas      │
│ • Land Ownership: ~150,000 gas   │
│                                  │
│ At 1 gwei:                       │
│ • Cost: ~0.00015 ETH             │
│ • USD: ~$0.30 (at $2000 ETH)     │
│                                  │
│ Base Sepolia Testnet:            │
│ • Often <1 gwei                  │
│ • Very cheap!                    │
└──────────────────────────────────┘
```

## 📦 Complete Tech Stack

```
┌────────────────────────────────────────────────────────┐
│                     Frontend                            │
│  • Next.js 15.5.4                                      │
│  • React 19                                            │
│  • Wagmi v2.18.0 (wallet connection)                   │
│  • Viem v2.38.2 (blockchain interactions)              │
│  • @tanstack/react-query v5 (state management)         │
│  • TailwindCSS (styling)                               │
└────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────┐
│                     Backend                             │
│  • Express 5                                           │
│  • TypeScript 5.9                                      │
│  • Mongoose (MongoDB ODM)                              │
│  • Viem v2.38.2 (blockchain client)                    │
│  • Pinata SDK (IPFS)                                   │
└────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────┐
│                    Blockchain                           │
│  • Solidity 0.8.19                                     │
│  • OpenZeppelin Contracts                              │
│  • Hardhat 3 Beta                                      │
│  • Base Sepolia (testnet)                              │
│  • Chain ID: 84532                                     │
└────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────┐
│                     Storage                             │
│  • MongoDB (temporary request storage)                 │
│  • IPFS/Pinata (encrypted files)                       │
│  • Base Sepolia (permanent NFT metadata)               │
└────────────────────────────────────────────────────────┘
```

## 🎉 Summary

**Key Points:**

1. ✅ Requests stored in MongoDB while pending/verified
2. ✅ After minting, requests are DELETED from MongoDB
3. ✅ All data lives on blockchain as NFT metadata
4. ✅ Two contract types: soul-bound (ID) and transferable (property)
5. ✅ Clean separation of concerns
6. ✅ Type-safe end-to-end
7. ✅ Production-ready on Base Sepolia

**Ready to deploy! 🚀**
