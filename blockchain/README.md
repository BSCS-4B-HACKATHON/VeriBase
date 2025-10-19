# Blockchain Smart Contracts

NFT-based document verification and land ownership system deployed on Base Sepolia.

## 🎯 Project Overview

This project contains three interconnected smart contracts for managing identity verification and land ownership:

1. **NationalIdNFT** - Soul-bound identity verification NFTs (non-transferable)
2. **LandOwnershipNFT** - Property ownership NFTs (controlled transfers)
3. **LandTransferContract** - Instant authorized transfer system (FREE)

## 📁 Project Structure

```
blockchain/
├── contracts/
│   ├── NationalIdNFT.sol          # Soul-bound identity NFTs
│   ├── LandOwnershipNFT.sol       # Property ownership NFTs
│   └── LandTransferContract.sol   # Instant transfer system
├── scripts/
│   └── deployNFTs.ts              # Unified deployment script
├── ignition/
│   └── modules/                   # Hardhat Ignition modules
├── test/                          # Contract tests
└── docs/
    ├── NFT-CONTRACTS-README.md           # Complete contracts guide
    ├── LAND-TRANSFER-CONTRACT.md         # Transfer contract details
    ├── CONTRACT-REVISION-SUMMARY.md      # Migration summary
    └── DEPLOYMENT-CHECKLIST.md           # Deployment guide
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- Base Sepolia test ETH ([get from faucet](https://docs.base.org/docs/tools/network-faucets))
- Private key with funds

### Installation

```bash
cd blockchain
npm install
```

### Deploy Contracts

```bash
# Set environment variables
export BASE_SEPOLIA_PRIVATE_KEY="your-private-key"

# Deploy all contracts
npx hardhat run scripts/deployNFTs.ts --network baseSepolia
```

Deployment automatically:

- ✅ Deploys all three contracts
- ✅ Authorizes transfer contract on LandOwnershipNFT
- ✅ Saves addresses to `deployments/nfts-baseSepolia.json`

## 📋 Contract Overview

### NationalIdNFT

**Purpose:** Soul-bound identity verification tokens (one per wallet, non-transferable)

**Key Features:**

- ✅ One NFT per wallet limit
- ✅ Completely non-transferable (soul-bound)
- ✅ Stores encrypted identity metadata
- ✅ Permanent identity binding

**Use Case:** Government-issued digital IDs, KYC verification

[→ Full Documentation](./NFT-CONTRACTS-README.md#nationalidnft)

### LandOwnershipNFT

**Purpose:** Property ownership tokens with controlled transfers

**Key Features:**

- ✅ Multiple NFTs per wallet
- ✅ Only transferable via authorized contract
- ✅ Stores encrypted property metadata
- ✅ Prevents unauthorized transfers

**Use Case:** Real estate ownership, land registry

[→ Full Documentation](./NFT-CONTRACTS-README.md#landownershipnft)

### LandTransferContract

**Purpose:** Authorized instant transfer management (FREE)

**Key Features:**

- ✅ FREE instant transfers
- ✅ No payment or fees required
- ✅ Legal document linking (IPFS)
- ✅ Simple one-step process
- ✅ Authorized transfers only
- ✅ Immediate completion

**Use Case:** Regulated land sales, property transfers

[→ Full Documentation](./LAND-TRANSFER-CONTRACT.md)

## 🔧 Usage

### Running Tests

To run all the tests in the project:

```bash
npx hardhat test
```

Run specific test types:

```bash
npx hardhat test solidity  # Solidity tests
npx hardhat test nodejs    # TypeScript tests
```

### Local Development

Start a local Hardhat node:

```bash
npx hardhat node
```

Deploy to local node:

```bash
npx hardhat run scripts/deployNFTs.ts --network localhost
```

### Network Configuration

This project is configured for Base Sepolia testnet:

- Network: Base Sepolia
- Chain ID: 84532
- RPC: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org

## 🔐 Environment Variables

Create a `.env` file:

```bash
# Required for deployment
BASE_SEPOLIA_PRIVATE_KEY=your-private-key-here

# Optional for verification
BASESCAN_API_KEY=your-api-key-here
```

⚠️ **Never commit your `.env` file!**

## 📚 Documentation

| Document                                                       | Description                         |
| -------------------------------------------------------------- | ----------------------------------- |
| [NFT-CONTRACTS-README.md](./NFT-CONTRACTS-README.md)           | Complete guide to all NFT contracts |
| [LAND-TRANSFER-CONTRACT.md](./LAND-TRANSFER-CONTRACT.md)       | Transfer contract detailed docs     |
| [CONTRACT-REVISION-SUMMARY.md](./CONTRACT-REVISION-SUMMARY.md) | Migration and backend integration   |
| [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)           | Step-by-step deployment guide       |

## 🎨 Contract Addresses

After deployment, addresses are saved to `deployments/nfts-{network}.json`:

```json
{
  "nationalIdNFT": "0x...",
  "landOwnershipNFT": "0x...",
  "landTransferContract": "0x...",
  "network": "baseSepolia",
  "deployer": "0x...",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 🛠️ Tech Stack

- **Hardhat 3 Beta** - Development framework
- **Viem** - Ethereum interactions
- **Solidity 0.8.19** - Smart contract language
- **OpenZeppelin Contracts** - Security standards
- **TypeScript** - Type-safe testing
- **Node.js test runner** - Native testing

## 🔗 Integrations

### Backend Integration

See [CONTRACT-REVISION-SUMMARY.md](./CONTRACT-REVISION-SUMMARY.md#backend-changes) for:

- Minting logic updates
- Contract initialization
- Request type handling

### Frontend Integration

Update your frontend with deployed contract addresses:

```typescript
// lib/contracts.ts
export const NATIONAL_ID_NFT_ADDRESS =
  process.env.NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS;
export const LAND_OWNERSHIP_NFT_ADDRESS =
  process.env.NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS;
export const LAND_TRANSFER_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_LAND_TRANSFER_CONTRACT_ADDRESS;
```

## 📊 Contract Features Comparison

| Feature            | NationalIdNFT      | LandOwnershipNFT     |
| ------------------ | ------------------ | -------------------- |
| Transferable       | ❌ Never           | ✅ Via contract only |
| Max per wallet     | 1                  | Unlimited            |
| Metadata           | Encrypted identity | Encrypted property   |
| Transfer mechanism | Blocked            | Authorized contract  |
| Use case           | Identity           | Property ownership   |

## 🧪 Testing

The project includes comprehensive tests for:

- ✅ NFT minting
- ✅ Transfer restrictions
- ✅ Instant transfer functionality
- ✅ Authorization checks
- ✅ Access control
- ✅ Edge cases

## 🚨 Security

- **Audited patterns** - Uses OpenZeppelin standards
- **Access control** - Role-based permissions
- **Ownership verification** - Only NFT owners can initiate transfers
- **Authorized transfers** - Only this contract can transfer LandOwnershipNFTs
- **Legal audit trail** - IPFS document linking for compliance

## 📖 Additional Resources

- [Hardhat 3 Beta](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3)
- [Viem Documentation](https://viem.sh/)
- [Base Sepolia Docs](https://docs.base.org/docs/using-base)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## 🤝 Contributing

1. Follow Solidity style guide
2. Add tests for new features
3. Update documentation
4. Test on local network first

## 📄 License

MIT
