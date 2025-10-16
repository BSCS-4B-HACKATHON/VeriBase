# VeriBase — base-own

VeriBase (base-own) is a demo mini-app that enables secure verification of land ownership and national ID documents using blockchain proofs and NFTs. This repository contains frontend (Next.js), backend (server), and smart contracts (Hardhat) for deploying and interacting with the system on Base testnets.

## Overview

- Purpose: Provide a tamper-evident way to register and verify ownership of land and national IDs using NFTs and on-chain proofs. Ideal for demo and hackathon submission on Base.
- Tech: Next.js (app router), TypeScript, Wagmi + viem, Hardhat, IPFS (recommended for metadata), Node/Express or Next.js API routes for server-side tasks.

## Key features

- **Wallet Connect**: MetaMask and Coinbase wallet integration via wagmi
- **Smart Contracts**: National ID and Land Ownership NFTs deployed to Base Sepolia testnet
- **Admin Approval Flow**: Backend routes for admins to approve/reject verification requests
- **Real-Time Statistics**: Combined database and blockchain stats on user and admin dashboards
- **On-Chain Verification**: Read NFT ownership directly from Base Sepolia blockchain
- **Server-Side Minting**: Admin-controlled minting with private key security
- **Frontend Components**: React hooks and UI components for wallet connection and contract interaction
- **Deployment Scripts**: viem-based scripts for contract deployment and ABI management

## Deployed contracts (Base Sepolia)

- NationalIdNFT: 0xbe5fb46274763165a8e9bda180273b75d817fec0
- LandOwnershipNFT: 0xdfaf754cc95a9060bd6e467a652f9642e9e33c26
- LandTransferContract: 0xecc7d23c7d82bbaf59cd0b40329d24fd42617467

Deployment artifacts and tx hashes are stored under `blockchain/deployments/baseSepolia.json`.

## Base integration details

- Network: Base Sepolia (testnet) — contracts deployed to this network. The app uses wagmi/viem to connect wallets and call contract methods.
- Recommended additions:
  - IPFS (NFT.Storage or Pinata) for storing token metadata and images (use server-side upload endpoint)
  - QuickNode / Alchemy RPC for stable node access
  - WalletConnect v2 (optional) for broader wallet support (requires PROJECT_ID)

## Quick setup (local)

1. **Clone the repo**

   ```bash
   git clone <your-repo-url>
   ```

2. **Install dependencies**

   ```bash
   cd client && npm install
   cd ../server && npm install
   cd ../blockchain && npm install
   ```

3. **Create `.env` files**

   **Server** (`server/.env`):

   ```env
   MONGO_URI=mongodb+srv://...
   ADMIN_PRIVATE_KEY=0x...
   BLOCKCHAIN_RPC_URL=https://sepolia.base.org
   NATIONAL_ID_NFT_ADDRESS=0x57c236c2097c49c6f3c998b2fcf07f67596dc5f4
   LAND_OWNERSHIP_NFT_ADDRESS=0x7d59c36de7c8825b55c73038fa6bcfd52f903c7a
   PINATA_API_KEY=...
   PINATA_API_SECRET=...
   PORT=6969
   ```

   **Client** (`client/.env`):

   ```env
   NEXT_PUBLIC_BE_URL=http://localhost:6969
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=... (optional)
   ```

4. **Run the app**

   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev

   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

5. **Access the app**
   - User Dashboard: http://localhost:3000/home
   - Admin Dashboard: http://localhost:3000/admin
   - Landing Page: http://localhost:3000

## Documentation

- **[ADMIN-APPROVAL-FLOW.md](./ADMIN-APPROVAL-FLOW.md)** - Complete admin approval workflow
- **[STATS-INTEGRATION.md](./STATS-INTEGRATION.md)** - Real-time statistics implementation
- **[STATS-ARCHITECTURE.md](./STATS-ARCHITECTURE.md)** - Data flow diagrams
- **[STATS-QUICK-REFERENCE.md](./STATS-QUICK-REFERENCE.md)** - API endpoints quick reference

## Testing

- Unit tests and scripts: check `blockchain/test` and `hardhat` configurations.
