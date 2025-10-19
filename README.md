# VeriBase — Base Own

VeriBase is a decentralized document verification platform built on Base Sepolia that enables secure verification of land ownership and national ID documents using blockchain technology and NFTs. This full-stack application provides a complete solution for document verification with admin approval workflows and on-chain proof of ownership.

## 🎯 Overview

VeriBase combines the power of blockchain technology with user-friendly interfaces to create a tamper-proof document verification system. Built specifically for Base blockchain, it demonstrates the potential of on-chain identity and property ownership management.

**Purpose**: Provide a secure, transparent, and tamper-evident way to register and verify ownership of land titles and national ID documents using NFTs and on-chain proofs.

**Tech Stack**:

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, TailwindCSS 4, Wagmi v2, Viem
- **Backend**: Node.js, Express, MongoDB, TypeScript
- **Blockchain**: Hardhat 3, Solidity 0.8.19, OpenZeppelin Contracts
- **Storage**: Pinata (IPFS), MongoDB
- **Network**: Base Sepolia Testnet

## ✨ Key Features

### User Features

- 🔐 **Wallet Integration**: Seamless MetaMask and Coinbase Wallet support via Wagmi
- 📝 **Document Submission**: Submit land titles and national IDs for verification
- 🎫 **NFT Minting**: Mint verified documents as soul-bound NFTs on Base Sepolia (users pay gas)
- 📊 **User Dashboard**: Track verification requests with status updates
- 🔍 **Document Viewing**: View owned NFT documents with metadata
- 📈 **Personal Statistics**: Monitor pending, approved, and rejected requests

### Admin Features

- ✅ **Approval Workflow**: Review and approve/reject verification requests
- 📊 **Admin Dashboard**: Comprehensive overview of system statistics
- 👥 **User Management**: View all users and their verification status
- 🔗 **Blockchain Integration**: On-chain data queries and verification
- 📈 **Global Statistics**: System-wide metrics including approval rates
- 🎯 **Quick Actions**: Fast access to common administrative tasks

### Technical Features

- 🏗️ **Smart Contracts**: Secure, audited NFT contracts with specialized features
  - **NationalIdNFT**: Soul-bound (non-transferable) identity tokens
  - **LandOwnershipNFT**: Transferable property ownership tokens
  - **LandTransferContract**: Authorized transfer system for free land transfers
- 🔐 **Client-Side Minting**: Users mint NFTs directly from their wallets (decentralized)
- 📊 **Statistics Dashboard**: Combined database and blockchain data
- 🎨 **Modern UI**: Beautiful, responsive design with Radix UI components
- 🔄 **Data Persistence**: MongoDB for off-chain data, IPFS for metadata
- 🛡️ **Security**: Wallet-based authentication and role-based access control

## 🚀 Deployed Contracts (Base Sepolia)

All contracts are deployed and verified on Base Sepolia testnet:

- **NationalIdNFT**: `0x66fe865e6a737fd58905d2f46d2e952a5633bf4d`
- **LandOwnershipNFT**: `0x5a93b0d7a0e05396f2a4d830ac9bbc4d896ce0ff`
- **LandTransferContract**: `0x9a46b9f558d9dad1973095d0ab3c7c07d1055e0c`

**Deployment Info**:

- Network: Base Sepolia (Chain ID: 84532)
- Deployer: `0xFEf5186c2dB14c06A1918581E85D4B4640d5FABC`
- Deployed: October 17, 2025

View deployment artifacts at `blockchain/deployments/baseSepolia.json`

## � Quick Start

**New to VeriBase?** Check out our [Quick Start Guide](./QUICK-START.md) to get running in 5 minutes!

## �📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 16+ and npm
- **Git** for version control
- **MongoDB** (local or cloud instance via MongoDB Atlas)
- **Base Sepolia ETH** ([get from faucet](https://docs.base.org/docs/tools/network-faucets))
- **Pinata Account** for IPFS storage ([sign up](https://pinata.cloud))
- **MetaMask or Coinbase Wallet** for testing

## 🚀 Quick Setup (Local Development)

1. **Clone the repository**

   ```bash
   git clone https://github.com/BSCS-4B-HACKATHON/base-own.git
   cd base-own
   ```

2. **Install dependencies for all modules**

   ```bash
   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install

   # Install blockchain dependencies
   cd ../blockchain
   npm install
   cd ..
   ```

3. **Set up environment variables**

   Create `.env` files in each directory as detailed in the [Environment Configuration](#-environment-configuration) section below.

4. **Start MongoDB**

   Make sure your MongoDB instance is running (locally or via cloud).

5. **Run the development servers**

   ```bash
   # Terminal 1 - Start the backend server
   cd server
   npm run dev
   # Server runs on http://localhost:6969

   # Terminal 2 - Start the frontend
   cd client
   npm run dev
   # Client runs on http://localhost:3000
   ```

6. **Access the application**
   - 🏠 **Landing Page**: http://localhost:3000
   - 👤 **User Dashboard**: http://localhost:3000/home
   - 🔐 **NFT Documents**: http://localhost:3000/nfts
   - 📋 **Requests**: http://localhost:3000/requests
   - 🛡️ **Admin Dashboard**: http://localhost:3000/admin

## 🔐 Environment Configuration

Detailed environment variable setup for each module. See [ENV-REFERENCE.md](./ENV-REFERENCE.md) for complete variable documentation.

### Server Environment (`.env` in `server/` directory)

Create a `server/.env` file with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/veribase
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/veribase

# Pinata IPFS Configuration
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_API_KEY=your_pinata_secret_api_key_here

# Blockchain Configuration (Base Sepolia)
BLOCKCHAIN_RPC_URL=https://sepolia.base.org
ADMIN_PRIVATE_KEY=0xYOUR_ADMIN_PRIVATE_KEY_HERE

# NFT Contract Addresses (from blockchain/deployments/baseSepolia.json)
NATIONAL_ID_NFT_ADDRESS=0x66fe865e6a737fd58905d2f46d2e952a5633bf4d
LAND_OWNERSHIP_NFT_ADDRESS=0x5a93b0d7a0e05396f2a4d830ac9bbc4d896ce0ff
LAND_TRANSFER_CONTRACT_ADDRESS=0x9a46b9f558d9dad1973095d0ab3c7c07d1055e0c

# Server Configuration
PORT=6969

# CORS Configuration (optional)
FRONTEND_ORIGIN=http://localhost:3000
```

**Important Notes**:

- `ADMIN_PRIVATE_KEY` is optional - only needed for specific admin operations (not minting)
- Users pay their own gas fees when minting NFTs from their wallets
- Get Pinata API keys from [pinata.cloud](https://pinata.cloud)
- Never commit your `.env` file to version control

### Client Environment (`.env.local` in `client/` directory)

Create a `client/.env.local` file with:

```env
# Backend API URL
NEXT_PUBLIC_BE_URL=http://localhost:6969
NEXT_PUBLIC_SERVER_URL=http://localhost:6969
NEXT_PUBLIC_API_URL=http://localhost:6969

# NFT Contract Addresses (must match deployed contracts)
NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS=0x66fe865e6a737fd58905d2f46d2e952a5633bf4d
NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS=0x5a93b0d7a0e05396f2a4d830ac9bbc4d896ce0ff
NEXT_PUBLIC_LAND_TRANSFER_CONTRACT_ADDRESS=0x9a46b9f558d9dad1973095d0ab3c7c07d1055e0c

# Optional: WalletConnect Project ID (for additional wallet support)
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### Blockchain Environment (`.env` in `blockchain/` directory)

Create a `blockchain/.env` file for contract deployment and testing:

```env
# Network Configuration
NETWORK=baseSepolia

# Base Sepolia Configuration
BASE_SEPOLIA_PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY_HERE
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Contract Addresses (auto-populated after deployment)
NATIONAL_ID_NFT_ADDRESS=0x66fe865e6a737fd58905d2f46d2e952a5633bf4d
LAND_OWNERSHIP_NFT_ADDRESS=0x5a93b0d7a0e05396f2a4d830ac9bbc4d896ce0ff
LAND_TRANSFER_CONTRACT_ADDRESS=0x9a46b9f558d9dad1973095d0ab3c7c07d1055e0c

# Admin wallet (same as server admin for consistency)
ADMIN_PRIVATE_KEY=0xYOUR_ADMIN_PRIVATE_KEY_HERE

# Optional: Contract Verification
BASESCAN_API_KEY=your_basescan_api_key_here
```

**Notes**:

- Use the same `ADMIN_PRIVATE_KEY` in both server and blockchain `.env` files
- Get Base Sepolia ETH from [Base faucet](https://docs.base.org/docs/tools/network-faucets)
- Contracts are already deployed; only needed if you want to redeploy

## 🏗️ Project Structure

```
veri-base/
├── blockchain/              # Smart contracts and deployment scripts
│   ├── contracts/          # Solidity smart contracts
│   │   ├── NationalIdNFT.sol
│   │   ├── LandOwnershipNFT.sol
│   │   └── LandTransferContract.sol
│   ├── scripts/            # Deployment and utility scripts
│   ├── test/               # Contract tests
│   ├── ignition/           # Hardhat Ignition modules
│   └── deployments/        # Deployment artifacts
│
├── server/                 # Backend API server
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helper functions
│   │   └── index.ts        # Server entry point
│   └── package.json
│
├── client/                 # Next.js frontend
│   ├── app/                # App router pages
│   │   ├── (public)/       # Public landing page
│   │   ├── (user)/         # User dashboard & features
│   │   │   ├── home/       # User dashboard
│   │   │   ├── nfts/       # NFT documents viewer
│   │   │   └── requests/   # Request management
│   │   └── (admin)/        # Admin dashboard
│   ├── components/         # React components
│   │   ├── ui/             # Radix UI components
│   │   └── ...             # Custom components
│   ├── hooks/              # Custom React hooks
│   │   ├── useWallet.ts    # Wallet connection
│   │   ├── useUserNFTs.ts  # NFT fetching
│   │   └── useClientMint.ts # Client-side minting
│   ├── lib/                # Utilities and helpers
│   │   ├── wagmi.ts        # Wagmi configuration
│   │   ├── contracts.ts    # Contract addresses
│   │   └── helpers.ts      # Helper functions
│   └── package.json
│
└── README.md               # This file
```

## 🔧 Technology Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **TailwindCSS 4** - Styling
- **Wagmi v2** - Ethereum interactions
- **Viem** - Ethereum utilities
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animations
- **Recharts** - Data visualization
- **TanStack Query** - Data fetching and caching

### Backend

- **Node.js** - Runtime environment
- **Express 5** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **Viem** - Blockchain interactions
- **Pinata SDK** - IPFS file storage
- **CORS** - Cross-origin resource sharing

### Blockchain

- **Hardhat 3** - Development framework
- **Solidity 0.8.19** - Smart contract language
- **OpenZeppelin** - Security standards
- **Viem** - Contract interactions
- **Base Sepolia** - Test network

## 📚 Documentation

Comprehensive documentation is available in the repository:

### Getting Started

| Document                                                       | Description                                |
| -------------------------------------------------------------- | ------------------------------------------ |
| [QUICK-START.md](./QUICK-START.md)                             | 5-minute setup guide for new developers    |
| [SETUP-CHECKLIST.md](./SETUP-CHECKLIST.md)                     | Comprehensive setup verification checklist |
| [ENV-REFERENCE.md](./ENV-REFERENCE.md)                         | Complete environment variables reference   |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                           | System architecture and data flow diagrams |
| [DOCUMENTATION-CORRECTIONS.md](./DOCUMENTATION-CORRECTIONS.md) | Recent corrections to documentation        |

### Module-Specific Documentation

| Document                                                                       | Description                                        |
| ------------------------------------------------------------------------------ | -------------------------------------------------- |
| [blockchain/README.md](./blockchain/README.md)                                 | Blockchain contracts overview and deployment guide |
| [blockchain/NFT-CONTRACTS-README.md](./blockchain/NFT-CONTRACTS-README.md)     | Detailed NFT contract specifications               |
| [blockchain/LAND-TRANSFER-CONTRACT.md](./blockchain/LAND-TRANSFER-CONTRACT.md) | Instant land transfer system documentation         |
| [client/README.md](./client/README.md)                                         | Frontend setup and architecture                    |
| [server/README.md](./server/README.md)                                         | Backend API documentation                          |

## 🧪 Testing

### Smart Contract Tests

```bash
cd blockchain

# Run all tests
npm test

# Run specific test files
npx hardhat test test/NationalIdNFT.ts
npx hardhat test test/LandOwnershipNFT.ts

# Run with coverage
npx hardhat coverage
```

### Local Blockchain Testing

```bash
cd blockchain

# Start local Hardhat node
npx hardhat node

# Deploy to local network (in another terminal)
npx hardhat run scripts/deploy.ts --network localhost
```

## 🚢 Deployment

### Deploying Smart Contracts

The contracts are already deployed to Base Sepolia, but if you need to redeploy:

```bash
cd blockchain

# Set your private key in .env
export BASE_SEPOLIA_PRIVATE_KEY="your-private-key"

# Deploy all contracts
npx hardhat run scripts/deploy.ts --network baseSepolia

# Verify contracts on BaseScan
npx hardhat run scripts/verify-basescan.ts --network baseSepolia
```

### Deploying Backend

```bash
cd server

# Build TypeScript
npm run build

# Start production server
npm start
```

### Deploying Frontend

```bash
cd client

# Build for production
npm run build

# Start production server
npm start
```

**Recommended Platforms**:

- Frontend: Vercel, Netlify
- Backend: Railway, Render, Heroku
- Database: MongoDB Atlas

## 🎮 Usage Guide

### For Users

1. **Connect Wallet**: Click "Connect Wallet" and choose MetaMask or Coinbase Wallet
2. **Submit Request**: Navigate to "Requests" → "New Request"
3. **Upload Documents**: Fill in the form and upload required documents
4. **Wait for Approval**: Admin will review your request
5. **Mint NFT**: Once approved, mint your document as an NFT
6. **View NFTs**: Check your NFT documents in the "NFTs" section

### For Admins

1. **Access Admin Panel**: Navigate to `/admin`
2. **Review Requests**: View pending verification requests
3. **Approve/Reject**: Review documents and approve or reject
4. **Monitor Stats**: Track system-wide statistics
5. **Manage Users**: View all users and their verification status

## 🔒 Security Considerations

- ✅ Client-side minting ensures users control their own transactions
- ✅ Wallet-based authentication prevents unauthorized access
- ✅ CORS protection on API endpoints
- ✅ Soul-bound National ID NFTs (non-transferable)
- ✅ Controlled Land NFT transfers via authorized transfer contract
- ✅ IPFS storage for immutable document metadata
- ✅ MongoDB for sensitive user data (encrypted in production)

**Best Practices**:

- Users should use hardware wallets for valuable NFTs
- Implement rate limiting on API endpoints
- Enable MongoDB authentication in production
- Use environment-specific RPC endpoints
- Regular security audits for smart contracts

## 🌐 Base Blockchain Integration

This project is built specifically for the Base ecosystem:

- **Network**: Base Sepolia Testnet
- **Chain ID**: 84532
- **RPC**: https://sepolia.base.org
- **Explorer**: https://sepolia.basescan.org
- **Faucet**: [Base Faucet](https://docs.base.org/docs/tools/network-faucets)

### Why Base?

- ⚡ Low transaction fees
- 🚀 Fast block times (~2 seconds)
- 🔗 Ethereum L2 with full EVM compatibility
- 🛡️ Inherits Ethereum security
- 🌍 Backed by Coinbase

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with ❤️ for the Base ecosystem
- OpenZeppelin for secure smart contract libraries
- Hardhat team for excellent development tools
- Wagmi and Viem for seamless Web3 integration
- Next.js and Vercel for amazing developer experience

## 📞 Support

For questions, issues, or feature requests:

- Open an issue on [GitHub](https://github.com/BSCS-4B-HACKATHON/base-own/issues)
- Check existing documentation in the repo
- Review smart contract code in `blockchain/contracts/`

## 🎯 Roadmap

- [ ] Enhanced document types
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Batch operations for admins
- [ ] Email notifications
- [ ] Document expiration system
- [ ] QR code verification

---

**Made with 💚 for Base** | [View on GitHub](https://github.com/BSCS-4B-HACKATHON/base-own)
