# VeriBase — base-own

VeriBase (base-own) is a demo mini-app that enables secure verification of land ownership and national ID documents using blockchain proofs and NFTs. This repository contains frontend (Next.js), backend (server), and smart contracts (Hardhat) for deploying and interacting with the system on Base testnets.

## Overview

- Purpose: Provide a tamper-evident way to register and verify ownership of land and national IDs using NFTs and on-chain proofs. Ideal for demo and hackathon submission on Base.
- Tech: Next.js (app router), TypeScript, Wagmi + viem, Hardhat, IPFS (recommended for metadata), Node/Express or Next.js API routes for server-side tasks.

## Key features

- Wallet connect (MetaMask, Coinbase) via wagmi
- Smart contracts for National ID and Land Ownership (deployed to Base Sepolia testnet)
- Server-side utilities for minting and admin actions (requires admin private key)
- Frontend hooks and components for reading token ownership and contract data
- Deployment scripts (viem-based scripts in `blockchain/scripts`) to deploy contracts and copy ABIs to client & server

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

1. Clone the repo
   git clone <your-repo-url>
2. Install dependencies
   - client: cd client && npm install
   - server: cd server && npm install
   - blockchain: cd blockchain && npm install
3. Create `.env` files
   - Example vars:
     - ADMIN_PRIVATE_KEY=...
     - BASE_SEPOLIA_RPC_URL=...
     - NFT_STORAGE_KEY=...
     - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
4. Deploy contracts (optional)
   - Use the deployment script in `blockchain/scripts/deploy.ts` (requires private key and RPC URL). It will write `blockchain/deployments/baseSepolia.json` and copy ABIs to client & server.
5. Run the app
   - Start server and client as documented in their respective READMEs (or use `npm run dev` in each folder).

## Testing

- Unit tests and scripts: check `blockchain/test` and `hardhat` configurations.
