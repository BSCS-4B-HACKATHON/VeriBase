# Visual Flow Diagram - User-Initiated NFT Minting

## Complete System Flow

```
┌───────────────────────────────────────────────────────────────────────┐
│                         STEP 1: USER SUBMITS REQUEST                   │
└───────────────────────────────────────────────────────────────────────┘

    [User Browser]
         │
         │ 1. Upload documents (national ID, land ownership)
         ▼
    [Frontend Form]
         │
         │ POST /api/requests
         │ { requestType, requesterWallet, files }
         ▼
    [Backend Server]
         │
         │ Create request in MongoDB
         │ status: "pending"
         ▼
    [MongoDB]
         │
    ┌────┴─────┐
    │ Request  │  status: "pending"
    │          │  nftMinted: false
    │ [View]   │  ← Button shows "View"
    └──────────┘


┌───────────────────────────────────────────────────────────────────────┐
│                      STEP 2: ADMIN VERIFIES REQUEST                    │
└───────────────────────────────────────────────────────────────────────┘

    [Admin Dashboard]
         │
         │ 2. Admin reviews documents
         │    Admin checks authenticity
         ▼
    [Admin Approval]
         │
         │ PATCH /api/requests/:id/status
         │ { status: "verified" }
         ▼
    [Backend Server]
         │
         │ Update request in MongoDB
         │ status: "verified"
         ▼
    [MongoDB]
         │
    ┌────┴─────┐
    │ Request  │  status: "verified" ✅
    │          │  nftMinted: false
    │ [Mint]   │  ← Button changes to "Mint" ⭐
    └──────────┘


┌───────────────────────────────────────────────────────────────────────┐
│                    STEP 3: USER MINTS NFT (NEW!)                       │
└───────────────────────────────────────────────────────────────────────┘

    [User Browser]
         │
         │ 3. User clicks [Mint] button
         ▼
    [Frontend Component]
         │
         │ POST /api/requests/:id/mint
         │ { userWalletAddress: "0x..." }
         ▼
    [Backend Server]
    ┌────────────────────────────────────────────────┐
    │ nft.controller.ts                              │
    │                                                │
    │ • Validate: status === "verified"             │
    │ • Validate: !nftMinted                        │
    │ • Validate: wallet matches requester          │
    └────────────────────────────────────────────────┘
         │
         │ Call mintNFTForUser()
         ▼
    [Blockchain Script]
    ┌────────────────────────────────────────────────┐
    │ userMintNFT.ts                                 │
    │                                                │
    │ • Generate salted hash:                       │
    │   hash = keccak256(fileData + salt)           │
    │                                                │
    │ • Call smart contract:                        │
    │   proofNFT.ownerMintTo(user, hash)            │
    │                                                │
    │ • Wait for confirmation                       │
    │                                                │
    │ • Return: { tokenId, txHash }                 │
    └────────────────────────────────────────────────┘
         │
         │ Transaction submitted
         ▼
    [Smart Contract]
    ┌────────────────────────────────────────────────┐
    │ ProofNFT.sol                                   │
    │                                                │
    │ function ownerMintTo(address to, bytes32 hash) │
    │ {                                              │
    │   uint256 tokenId = _nextTokenId++;           │
    │   _tokenHashes[tokenId] = hash;               │
    │   _mint(to, tokenId);                         │
    │   emit ProofMinted(tokenId, to, hash);        │
    │ }                                              │
    └────────────────────────────────────────────────┘
         │
         │ NFT minted! 🎉
         │ tokenId: 42
         │ txHash: 0xabc123...
         ▼
    [Backend Server]
         │
         │ Update MongoDB:
         │ nftMinted: true
         │ nftTokenId: 42
         │ nftTransactionHash: "0xabc123..."
         │ nftMintedAt: Date.now()
         ▼
    [MongoDB]
         │
    ┌────┴─────────┐
    │ Request      │  status: "verified" ✅
    │              │  nftMinted: true ✅
    │              │  nftTokenId: 42
    │              │  nftTransactionHash: "0xabc123..."
    │ [View NFT]   │  ← Button changes to "View NFT" 🎉
    └──────────────┘
         │
         │ Response to frontend
         ▼
    [Frontend]
         │
         │ Show success message:
         │ "NFT minted successfully!"
         │ "Token ID: 42"
         │
         │ Refresh page
         ▼
    [User sees "View NFT" button]


┌───────────────────────────────────────────────────────────────────────┐
│                       STEP 4: USER VIEWS NFT                           │
└───────────────────────────────────────────────────────────────────────┘

    [User Browser]
         │
         │ 4. User clicks [View NFT] button
         ▼
    [Blockchain Explorer]
         │
    Opens: https://etherscan.io/tx/0xabc123...
         │
    Shows:
    • Transaction hash
    • Token ID: 42
    • Minted to: 0x7099... (user wallet)
    • Block number
    • Gas used
```

---

## Button State Transition Diagram

```
                    ┌─────────────────────────┐
                    │   Request Created       │
                    │   status: "pending"     │
                    └───────────┬─────────────┘
                                │
                                │
                    ┌───────────▼─────────────┐
                    │     Button: [View]      │
                    │   (View request details)│
                    └───────────┬─────────────┘
                                │
                                │ Admin verifies ✅
                                │
                    ┌───────────▼─────────────┐
                    │   Request Verified      │
                    │   status: "verified"    │
                    │   nftMinted: false      │
                    └───────────┬─────────────┘
                                │
                                │
                    ┌───────────▼─────────────┐
                    │    Button: [Mint] ⭐    │
                    │  (Mint NFT blockchain)  │
                    └───────────┬─────────────┘
                                │
                                │ User clicks Mint 👆
                                │
                    ┌───────────▼─────────────┐
                    │   Blockchain Minting    │
                    │   (Processing...)       │
                    └───────────┬─────────────┘
                                │
                                │ Transaction confirmed ⛓️
                                │
                    ┌───────────▼─────────────┐
                    │   NFT Minted!           │
                    │   nftMinted: true       │
                    │   tokenId: 42           │
                    └───────────┬─────────────┘
                                │
                                │
                    ┌───────────▼─────────────┐
                    │  Button: [View NFT] 🎉  │
                    │ (Open blockchain explorer)│
                    └─────────────────────────┘
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          REQUEST DATA                                │
└──────────────────────────────────────────────────────────────────────┘

MongoDB Request Document:
{
  requestId: "REQ-123",
  requestType: "national_id",
  requesterWallet: "0x7099...",
  status: "pending" → "verified",         // Admin changes this
  files: [
    {
      name: "id_front.jpg",
      uri: "ipfs://Qm...",
      hash: "abc123"
    }
  ],
  
  // NEW FIELDS ADDED ⭐
  nftMinted: false → true,                // User minting changes this
  nftTokenId: null → 42,                  // Set by blockchain
  nftTransactionHash: null → "0xabc...",  // Set by blockchain
  nftMintedAt: null → Date                // Set by blockchain
}

         ↓ User clicks [Mint]

┌──────────────────────────────────────────────────────────────────────┐
│                      BLOCKCHAIN TRANSACTION                          │
└──────────────────────────────────────────────────────────────────────┘

Hash Generation:
  fileHash = "abc123" (from IPFS)
  salt = requestId + "_" + requesterWallet
  combinedData = fileHash + salt
  
  hash = keccak256(combinedData)
       = 0x7f3b8c...42a1 (32 bytes)

Smart Contract Call:
  function: ownerMintTo(address to, bytes32 hash)
  to: "0x7099..." (user wallet)
  hash: 0x7f3b8c...42a1
  
  Result:
  ✅ Token ID: 42
  ✅ Hash stored on-chain
  ✅ NFT transferred to user

         ↓ Transaction confirmed

┌──────────────────────────────────────────────────────────────────────┐
│                      DATABASE UPDATE                                 │
└──────────────────────────────────────────────────────────────────────┘

MongoDB Request Document (Updated):
{
  requestId: "REQ-123",
  status: "verified",
  nftMinted: true,              ✅ Updated
  nftTokenId: 42,               ✅ Updated
  nftTransactionHash: "0xabc123...", ✅ Updated
  nftMintedAt: "2024-01-15T10:30:00Z" ✅ Updated
}

         ↓ Frontend refreshes

┌──────────────────────────────────────────────────────────────────────┐
│                      UI UPDATE                                       │
└──────────────────────────────────────────────────────────────────────┘

Button Changes:
  [Mint] → [View NFT]
  
User Sees:
  ✅ "NFT minted successfully!"
  ✅ "Token ID: 42"
  ✅ "Transaction: 0xabc123..."
```

---

## API Request/Response Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                   1. CHECK MINT ELIGIBILITY                          │
└──────────────────────────────────────────────────────────────────────┘

REQUEST:
  GET /api/requests/REQ-123/can-mint

RESPONSE:
  {
    "success": true,
    "data": {
      "requestId": "REQ-123",
      "status": "verified",
      "canMint": true,              ← ⭐ User can mint!
      "buttonText": "Mint",         ← ⭐ Show this on button
      "buttonAction": "mint",       ← ⭐ What button does
      "reason": "Request is verified and ready to mint",
      "nftMinted": false,
      "nftTokenId": null,
      "nftTransactionHash": null
    }
  }


┌──────────────────────────────────────────────────────────────────────┐
│                   2. MINT NFT (User Clicks Button)                   │
└──────────────────────────────────────────────────────────────────────┘

REQUEST:
  POST /api/requests/REQ-123/mint
  {
    "userWalletAddress": "0x7099..."
  }

PROCESSING:
  1. Validate request status = "verified"
  2. Validate !nftMinted
  3. Validate wallet matches requester
  4. Call blockchain: mintNFTForUser()
  5. Wait for transaction confirmation
  6. Update database with NFT data

RESPONSE (Success):
  {
    "success": true,
    "message": "NFT minted successfully!",
    "data": {
      "requestId": "REQ-123",
      "tokenId": 42,                      ← ⭐ NFT token ID
      "transactionHash": "0xabc123...",   ← ⭐ Blockchain TX
      "mintedAt": "2024-01-15T10:30:00Z"
    }
  }

RESPONSE (Error - Already Minted):
  {
    "success": false,
    "error": "NFT already minted for this request",
    "nftTokenId": 42,
    "nftTransactionHash": "0xabc123..."
  }

RESPONSE (Error - Not Verified):
  {
    "success": false,
    "error": "Cannot mint: Request status is \"pending\". Must be \"verified\"."
  }


┌──────────────────────────────────────────────────────────────────────┐
│                   3. GET WALLET REQUESTS                             │
└──────────────────────────────────────────────────────────────────────┘

REQUEST:
  GET /api/wallet/0x7099.../requests

RESPONSE:
  {
    "success": true,
    "data": [
      {
        "requestId": "REQ-123",
        "requestType": "national_id",
        "status": "verified",
        "canMint": false,             ← Already minted
        "buttonText": "View NFT",     ← Show this
        "buttonAction": "viewNFT",    ← Open explorer
        "nftMinted": true,
        "nftTokenId": 42,
        "nftTransactionHash": "0xabc123..."
      },
      {
        "requestId": "REQ-456",
        "requestType": "land_ownership",
        "status": "verified",
        "canMint": true,              ← Can mint this one!
        "buttonText": "Mint",         ← Show this
        "buttonAction": "mint",       ← Trigger minting
        "nftMinted": false,
        "nftTokenId": null,
        "nftTransactionHash": null
      },
      {
        "requestId": "REQ-789",
        "requestType": "national_id",
        "status": "pending",
        "canMint": false,             ← Not verified yet
        "buttonText": "View",         ← Show this
        "buttonAction": "view",       ← View details
        "nftMinted": false,
        "nftTokenId": null,
        "nftTransactionHash": null
      }
    ]
  }
```

---

## Component Integration

```
┌──────────────────────────────────────────────────────────────────────┐
│                     FRONTEND COMPONENT TREE                          │
└──────────────────────────────────────────────────────────────────────┘

app/
└── (user)/
    └── requests/
        └── page.tsx
            │
            ├─ useWallet() ──────────→ Get user wallet address
            │                          "0x7099..."
            │
            ├─ useEffect() ──────────→ Fetch requests from API
            │   │                      GET /api/wallet/:address/requests
            │   │
            │   └─ setRequests() ───→ Store requests in state
            │
            └─ requests.map() ───────→ Render each request
                │
                └─ <MintButton
                     requestId={request.requestId}
                     status={request.status}
                     nftMinted={request.nftMinted}
                     userWalletAddress={address}
                   />
                   │
                   ├─ Determine button state
                   │  (View / Mint / View NFT)
                   │
                   ├─ handleClick() ──────→ Based on buttonAction:
                   │   │
                   │   ├─ "view" ─────────→ Navigate to /requests/:id
                   │   │
                   │   ├─ "mint" ─────────→ POST /api/requests/:id/mint
                   │   │                     Show loading spinner
                   │   │                     Wait for response
                   │   │                     Show success/error toast
                   │   │                     Refresh page
                   │   │
                   │   └─ "viewNFT" ──────→ Open blockchain explorer
                   │                         etherscan.io/tx/:hash
                   │
                   └─ <Button> ───────────→ Display with dynamic text
                                            "View" / "Mint" / "View NFT"
```

---

## File Structure Reference

```
base-own/
│
├── blockchain/
│   ├── contracts/
│   │   └── ProofNFT.sol ────────────────→ ERC-721 NFT contract
│   │                                      • ownerMintTo() function
│   │                                      • stores hash per token
│   │
│   ├── scripts/
│   │   ├── deployProofNFT.ts ───────────→ Deploy contract
│   │   │
│   │   └── userMintNFT.ts ──────────────→ ⭐ USER MINTING SCRIPT
│   │                                      • mintNFTForUser() function
│   │                                      • Called by server API
│   │
│   └── test/
│       └── ProofNFT.ts ─────────────────→ 18 passing tests
│
├── server/
│   └── src/
│       ├── controllers/
│       │   └── nft.controller.ts ───────→ ⭐ NFT API ENDPOINTS
│       │                                  • checkMintEligibility()
│       │                                  • mintNFT()
│       │                                  • getWalletRequests()
│       │
│       ├── routes/
│       │   └── nft.route.ts ────────────→ Express routes
│       │
│       ├── models/
│       │   └── DocMetaSchema.ts ────────→ MongoDB schema
│       │                                  • nftMinted field
│       │                                  • nftTokenId field
│       │
│       └── index.ts ────────────────────→ Register routes
│
└── client/
    ├── components/
    │   └── mint-button.tsx ─────────────→ ⭐ MINT BUTTON COMPONENT
    │                                      • Dynamic button text
    │                                      • Handles minting
    │                                      • Shows loading states
    │
    └── app/
        └── (user)/
            └── requests/
                └── page.tsx ────────────→ User requests page
                                           • Displays requests
                                           • Uses MintButton
```

---

## Summary

This system implements a **three-stage approval and minting process**:

1. **User submits** → Status: pending → Button: [View]
2. **Admin verifies** → Status: verified → Button: [Mint] ⭐
3. **User mints** → NFT created → Button: [View NFT] 🎉

The key innovation is that minting is **user-initiated** (they click the button) but **server-executed** (backend owns the contract and pays gas fees).

---

For implementation details, see:
- `IMPLEMENTATION-CHECKLIST.md` - Step-by-step checklist
- `BLOCKCHAIN-INTEGRATION.md` - Connect blockchain to server
- `FRONTEND-INTEGRATION.md` - Build the frontend button
- `IMPLEMENTATION-SUMMARY.md` - System overview
