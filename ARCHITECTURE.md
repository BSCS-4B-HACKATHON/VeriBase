# 🏗️ VeriBase Architecture Overview

Visual guide to understand how VeriBase components work together.

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Landing    │  │     User     │  │    Admin     │        │
│  │     Page     │  │  Dashboard   │  │  Dashboard   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│         │                  │                  │                │
│         └──────────────────┴──────────────────┘                │
│                            │                                    │
│                    Next.js Frontend                            │
│                    (Port 3000)                                 │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             │ HTTP/REST API
                             │
┌────────────────────────────▼───────────────────────────────────┐
│                      EXPRESS BACKEND                           │
│                       (Port 6969)                              │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Upload    │  │  Requests   │  │    Admin    │          │
│  │   Routes    │  │   Routes    │  │   Routes    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│         │                 │                 │                  │
│         └─────────────────┴─────────────────┘                  │
│                           │                                    │
└───────────────────────────┼───────────────────────────────────┘
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │  MongoDB   │  │   Pinata   │  │    Base    │
    │  Database  │  │   (IPFS)   │  │  Sepolia   │
    └────────────┘  └────────────┘  └────────────┘
         │               │                 │
         │               │                 │
         ▼               ▼                 ▼
    User Data      File Storage     Smart Contracts
```

## 🔄 Data Flow

### 1. Document Submission Flow

```
User Wallet
    │
    │ 1. Connect Wallet
    ▼
Frontend (Next.js)
    │
    │ 2. Fill Form & Upload Documents
    ▼
Backend (Express)
    │
    ├─► 3a. Upload files to Pinata (IPFS)
    │       └─► Returns IPFS hash
    │
    └─► 3b. Store request in MongoDB
            └─► Status: "pending"
```

### 2. Admin Approval Flow

```
Admin Dashboard
    │
    │ 1. Review Request
    ▼
Backend API
    │
    │ 2. Approve/Reject
    ▼
MongoDB
    │
    │ 3. Update Status
    └─► Status: "verified" or "rejected"
```

### 3. NFT Minting Flow

```
User Dashboard
    │
    │ 1. Click "Mint NFT"
    ▼
Frontend (useClientMint hook)
    │
    ├─► 2a. Fetch metadata URI from backend
    │       └─► IPFS hash from request
    │
    ├─► 2b. User approves transaction in wallet
    │       └─► User pays gas fee
    │
    └─► 2c. Mint NFT on blockchain
            └─► Direct contract call from user's wallet
```

## 🧩 Component Interactions

### Frontend Components

```
┌─────────────────────────────────────────┐
│            Client (Next.js)             │
├─────────────────────────────────────────┤
│                                         │
│  Hooks:                                 │
│  ├─ useWallet.ts ────────► Wagmi/Viem  │
│  ├─ useUserNFTs.ts ──────► Contracts   │
│  ├─ useClientMint.ts ────► Contracts   │
│  └─ useTransferNFT.ts ───► Contracts   │
│                                         │
│  Pages:                                 │
│  ├─ /home ──────► User Dashboard       │
│  ├─ /nfts ──────► NFT Documents        │
│  ├─ /requests ──► Request Management   │
│  └─ /admin ─────► Admin Panel          │
│                                         │
│  Components:                            │
│  ├─ ConnectWallet ──────► Wagmi        │
│  ├─ RequestCard ────────► API          │
│  └─ DataTable ──────────► TanStack     │
│                                         │
└─────────────────────────────────────────┘
```

### Backend Services

```
┌─────────────────────────────────────────┐
│          Server (Express)               │
├─────────────────────────────────────────┤
│                                         │
│  Routes:                                │
│  ├─ /api/upload ────► Pinata Service   │
│  ├─ /api/requests ──► Request Service  │
│  ├─ /api/admin ─────► Admin Service    │
│  ├─ /api/wallet ────► NFT Data Service │
│  └─ /api/stats ─────► Stats Service    │
│                                         │
│  Services:                              │
│  ├─ uploadService ──► Pinata SDK       │
│  ├─ requestService ─► MongoDB + Viem   │
│  └─ statsService ───► MongoDB + Viem   │
│                                         │
│  Models:                                │
│  ├─ User ───────────► MongoDB Schema   │
│  ├─ Request ────────► MongoDB Schema   │
│  └─ NFT ────────────► MongoDB Schema   │
│                                         │
└─────────────────────────────────────────┘
```

### Smart Contracts

```
┌─────────────────────────────────────────┐
│       Base Sepolia Blockchain           │
├─────────────────────────────────────────┤
│                                         │
│  NationalIdNFT (ERC721)                 │
│  ├─ Soul-bound (non-transferable)      │
│  ├─ One per wallet limit               │
│  └─ Encrypted metadata                 │
│                                         │
│  LandOwnershipNFT (ERC721)              │
│  ├─ Transferable via contract          │
│  ├─ Multiple per wallet                │
│  └─ Property metadata                  │
│                                         │
│  LandTransferContract                   │
│  ├─ Instant transfer system            │
│  ├─ FREE transfers (no fees)           │
│  └─ Legal documents                    │
│                                         │
└─────────────────────────────────────────┘
```

## 🔐 Security Layers

```
┌─────────────────────────────────────────┐
│          Security Model                 │
├─────────────────────────────────────────┤
│                                         │
│  Layer 1: Wallet Authentication         │
│  └─► User must connect wallet          │
│                                         │
│  Layer 2: Server Validation             │
│  └─► Backend validates all requests    │
│                                         │
│  Layer 3: Admin Approval                │
│  └─► Only verified requests can mint   │
│                                         │
│  Layer 4: Smart Contract Rules          │
│  └─► On-chain validation & limits      │
│                                         │
│  Layer 5: User Transaction Control      │
│  └─► Users sign and pay for minting    │
│                                         │
└─────────────────────────────────────────┘
```

## 📊 Data Storage

### Off-Chain Storage (MongoDB)

```json
{
  "requests": {
    "requestId": "unique_id",
    "requesterWallet": "0x...",
    "requestType": "national_id | land_title",
    "status": "pending | verified | rejected",
    "ipfsHash": "Qm...",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  },
  "users": {
    "wallet": "0x...",
    "requests": ["request_ids"],
    "nfts": ["token_ids"]
  }
}
```

### On-Chain Storage (Blockchain)

```solidity
// NationalIdNFT
mapping(address => uint256) public tokenOfOwner;
mapping(uint256 => string) public tokenURI;

// LandOwnershipNFT
mapping(uint256 => string) public tokenURI;
mapping(uint256 => bool) public isLocked;
```

### Decentralized Storage (IPFS/Pinata)

```json
{
  "name": "National ID #1234",
  "description": "Government-issued ID verification",
  "image": "ipfs://Qm.../image.png",
  "attributes": [
    { "trait_type": "Type", "value": "National ID" },
    { "trait_type": "Verified", "value": "true" }
  ]
}
```

## 🚀 Deployment Architecture

### Development Environment

```
Localhost
├── Frontend: http://localhost:3000
├── Backend: http://localhost:6969
├── MongoDB: mongodb://localhost:27017
└── Network: Base Sepolia Testnet
```

### Production Environment (Recommended)

```
Production
├── Frontend: Vercel/Netlify
├── Backend: Railway/Render/Heroku
├── MongoDB: MongoDB Atlas
└── Network: Base Mainnet (when ready)
```

## 🔄 State Management

### Frontend State

```
Wagmi/TanStack Query
    │
    ├─► Wallet Connection State
    ├─► Blockchain Data (NFTs, Contracts)
    ├─► API Data (Requests, Stats)
    └─► UI State (Loading, Errors)
```

### Backend State

```
MongoDB
    │
    ├─► User Sessions
    ├─► Request Status
    ├─► NFT Records
    └─► Admin Actions
```

### Blockchain State

```
Smart Contracts
    │
    ├─► NFT Ownership
    ├─► Token Metadata
    ├─► Transfer Status
    └─► Contract Configuration
```

## 📡 API Endpoints

### Public Endpoints

```
GET  /api/stats/global          - Global statistics
GET  /api/stats/user/:address   - User-specific stats
POST /api/upload                - Upload to IPFS
```

### Authenticated Endpoints

```
POST /api/requests              - Submit verification request
GET  /api/requests/:id          - Get request details
```

### Admin Endpoints

```
GET    /api/admin/requests      - List all requests
PUT    /api/admin/requests/:id/approve - Approve request
PUT    /api/admin/requests/:id/reject  - Reject request
POST   /api/nft/mint            - Mint NFT (server-side)
```

## 🎯 Key Integration Points

1. **Wallet ↔ Frontend**: Wagmi + Viem for blockchain interactions
2. **Frontend ↔ Backend**: REST API with fetch/axios
3. **Backend ↔ MongoDB**: Mongoose ODM
4. **Backend ↔ IPFS**: Pinata SDK
5. **Backend ↔ Blockchain**: Viem for reading contract data
6. **Frontend ↔ Contracts**: Direct user wallet interactions for minting

---

**Understanding the Architecture**: This document provides a high-level overview of how VeriBase components interact. For detailed implementation, refer to the code in each module.
