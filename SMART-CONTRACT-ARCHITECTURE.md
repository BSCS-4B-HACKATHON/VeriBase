# Smart Contract Architecture - Complete Overview

## 🎯 System Architecture

This document provides a high-level overview of the complete smart contract system for identity verification and land ownership management.

## 📊 Contract Ecosystem

```
┌─────────────────────────────────────────────────────────────┐
│                      User Wallets                            │
│  (MetaMask, Coinbase, etc. via Wagmi)                       │
└────────┬──────────────────────────────────────┬─────────────┘
         │                                       │
         ↓                                       ↓
┌──────────────────────┐            ┌──────────────────────┐
│   NationalIdNFT      │            │  LandOwnershipNFT    │
│  (Soul-bound)        │            │  (Transferable)      │
├──────────────────────┤            ├──────────────────────┤
│ • One per wallet     │            │ • Multiple per wallet│
│ • Non-transferable   │            │ • Controlled transfer│
│ • Identity metadata  │            │ • Property metadata  │
└──────────────────────┘            └──────────┬───────────┘
                                               │
                                               │ Authorized
                                               │ Transfers
                                               ↓
                              ┌──────────────────────────────┐
                              │  LandTransferContract        │
                              │  (Escrow & Regulation)       │
                              ├──────────────────────────────┤
                              │ • Escrow management          │
                              │ • Fee collection             │
                              │ • Legal compliance           │
                              │ • Multi-party control        │
                              └──────────────────────────────┘
```

## 🔐 Contract Relationships

### 1. NationalIdNFT (Standalone)

- **Independence:** Does not depend on other contracts
- **Purpose:** Identity verification layer
- **Interaction:** Only backend mints, wallets hold forever

### 2. LandOwnershipNFT (Connected)

- **Dependency:** Requires authorized transfer contract
- **Purpose:** Property ownership layer
- **Interaction:** Backend mints, transfers via LandTransferContract only

### 3. LandTransferContract (Coordinator)

- **Dependency:** Must be authorized by LandOwnershipNFT
- **Purpose:** Transfer orchestration and regulation
- **Interaction:** Sellers initiate, buyers pay, admins approve

## 🌊 Data Flow

### Identity NFT Flow

```
User Request → Backend API → MongoDB DocMeta
                    ↓
            Mint NationalIdNFT
                    ↓
            NFT → User Wallet (permanent)
```

### Property NFT Flow

```
User Request → Backend API → MongoDB DocMeta
                    ↓
          Mint LandOwnershipNFT
                    ↓
            NFT → User Wallet
```

### Land Transfer Flow

```
1. Seller initiates transfer
   ↓
2. LandTransferContract locks NFT
   ↓
3. Buyer deposits escrow
   ↓
4. Admin verifies legal docs
   ↓
5. Admin completes transfer
   ↓
6. NFT transferred + Funds released
```

## 🏗️ Technical Architecture

### Smart Contract Layer

```
Solidity 0.8.19
├── NationalIdNFT.sol (ERC721 + Soul-bound logic)
├── LandOwnershipNFT.sol (ERC721 + Authorization)
└── LandTransferContract.sol (Escrow + Regulation)
```

### Blockchain Layer

```
Base Sepolia Testnet (Chain ID: 84532)
├── RPC: https://sepolia.base.org
├── Explorer: https://sepolia.basescan.org
└── Faucet: https://docs.base.org/docs/tools/network-faucets
```

### Backend Layer

```typescript
// Minting Service
class NFTService {
  async mintNFT(request: Request) {
    if (request.requestType === "national_id") {
      return mintNationalId(request);
    } else if (request.requestType === "land_ownership") {
      return mintLandOwnership(request);
    }
  }
}
```

### Frontend Layer

```typescript
// Wagmi v2 integration
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { baseSepolia } from "wagmi/chains";

// Contract interaction
import { useReadContract, useWriteContract } from "wagmi";
```

## 📁 Repository Structure

```
base_own/
├── blockchain/                    # Smart contracts
│   ├── contracts/
│   │   ├── NationalIdNFT.sol
│   │   ├── LandOwnershipNFT.sol
│   │   └── LandTransferContract.sol
│   ├── scripts/
│   │   └── deployNFTs.ts         # Unified deployment
│   ├── ignition/modules/         # Deployment modules
│   ├── test/                     # Contract tests
│   └── docs/                     # Technical docs
│
├── client/                        # Next.js frontend
│   ├── lib/wagmi.ts              # Wagmi config
│   ├── app/providers.tsx         # Wallet providers
│   ├── hooks/useWallet.ts        # Wallet hook
│   └── components/
│       ├── connect-wallet.tsx    # Connection UI
│       └── nav-user.tsx          # User navigation
│
├── server/                        # Express backend
│   └── src/
│       ├── services/
│       │   └── nft.service.ts    # Minting logic
│       └── routes/
│           └── request.routes.ts  # API endpoints
│
└── docs/                          # High-level docs
    ├── SMART-CONTRACT-ARCHITECTURE.md (this file)
    ├── START-HERE.md
    └── IMPLEMENTATION-SUMMARY.md
```

## 🔄 Deployment Sequence

### Order Matters!

```
1. Deploy NationalIdNFT
   ↓
2. Deploy LandOwnershipNFT
   ↓
3. Deploy LandTransferContract
   (pass LandOwnershipNFT address)
   ↓
4. Authorize LandTransferContract
   (call setTransferContract on LandOwnershipNFT)
   ↓
5. Save all addresses to deployments/
```

This is handled automatically by `scripts/deployNFTs.ts`

## 🎨 Metadata Structure

### National ID NFT Metadata

```json
{
  "tokenId": 1,
  "metadata": [
    {
      "label": "document_type",
      "value": "national_id",
      "encrypted": false
    },
    {
      "label": "full_name",
      "value": "encrypted_data_here",
      "encrypted": true
    },
    {
      "label": "id_number",
      "value": "encrypted_data_here",
      "encrypted": true
    }
  ]
}
```

### Land Ownership NFT Metadata

```json
{
  "tokenId": 1,
  "metadata": [
    {
      "label": "document_type",
      "value": "land_ownership",
      "encrypted": false
    },
    {
      "label": "property_address",
      "value": "encrypted_data_here",
      "encrypted": true
    },
    {
      "label": "lot_number",
      "value": "encrypted_data_here",
      "encrypted": true
    }
  ]
}
```

## 🔐 Security Model

### Multi-Layer Security

1. **Smart Contract Level**

   - OpenZeppelin audited libraries
   - ReentrancyGuard protection
   - Access control (Ownable)
   - Custom authorization system

2. **Transfer Level**

   - Soul-bound for identity (blocked at `_update()`)
   - Controlled transfers for property (authorized contract only)
   - Escrow protection for payments
   - Time-limited transfer requests

3. **Data Level**

   - Encrypted metadata (AES-256)
   - IPFS for legal documents
   - On-chain verification only
   - Off-chain sensitive data

4. **Access Level**
   - Admin-only minting
   - Multi-party cancellation rights
   - Emergency withdrawal (owner only)
   - Role-based permissions

## 💰 Economic Model

### Fee Structure

```
Transfer Price: 100 ETH
Fee Rate: 2.5% (250 basis points)

Distribution:
├── Fee Collector: 2.5 ETH (2.5%)
├── Seller: 97.5 ETH (97.5%)
└── Excess Escrow: Refunded to buyer
```

### Gas Estimates

| Action              | Estimated Gas | Estimated Cost (at 1 gwei) |
| ------------------- | ------------- | -------------------------- |
| Mint National ID    | ~150,000      | ~0.00015 ETH               |
| Mint Land Ownership | ~150,000      | ~0.00015 ETH               |
| Initiate Transfer   | ~100,000      | ~0.0001 ETH                |
| Deposit Escrow      | ~50,000       | ~0.00005 ETH               |
| Complete Transfer   | ~150,000      | ~0.00015 ETH               |
| Cancel Transfer     | ~70,000       | ~0.00007 ETH               |

## 📈 Scalability Considerations

### Current Design

- **Network:** Base Sepolia (testnet)
- **TPS:** ~10-20 transactions per second
- **Cost:** Very low gas fees on Base L2

### Production Recommendations

1. **Mainnet Migration:** Base Mainnet for production
2. **Batch Operations:** Batch minting for multiple users
3. **Caching:** Cache metadata off-chain, verify on-chain
4. **Indexing:** Use The Graph for efficient queries

## 🧪 Testing Strategy

### Unit Tests

```bash
npx hardhat test test/NationalIdNFT.ts
npx hardhat test test/LandOwnershipNFT.ts
npx hardhat test test/LandTransferContract.ts
```

### Integration Tests

```bash
npx hardhat test test/integration/
```

### Coverage Goals

- ✅ >90% code coverage
- ✅ All state transitions tested
- ✅ Access control verified
- ✅ Edge cases covered

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] Compile contracts: `npx hardhat compile`
- [ ] Run tests: `npx hardhat test`
- [ ] Set BASE_SEPOLIA_PRIVATE_KEY in .env
- [ ] Fund deployer wallet with test ETH

### Deployment

- [ ] Deploy contracts: `npx hardhat run scripts/deployNFTs.ts --network baseSepolia`
- [ ] Verify addresses in `deployments/nfts-baseSepolia.json`
- [ ] Verify contracts on Basescan

### Post-Deployment

- [ ] Update backend .env with contract addresses
- [ ] Update frontend .env with contract addresses
- [ ] Test minting flow end-to-end
- [ ] Test transfer flow end-to-end
- [ ] Monitor gas usage and optimize

## 🔗 Integration Points

### Backend Integration

```typescript
// services/nft.service.ts
import NationalIdNFTABI from "../abis/NationalIdNFT.json";
import LandOwnershipNFTABI from "../abis/LandOwnershipNFT.json";

const nationalIdNFT = new ethers.Contract(
  process.env.NATIONAL_ID_NFT_ADDRESS,
  NationalIdNFTABI,
  signer
);

const landOwnershipNFT = new ethers.Contract(
  process.env.LAND_OWNERSHIP_NFT_ADDRESS,
  LandOwnershipNFTABI,
  signer
);
```

### Frontend Integration

```typescript
// lib/contracts.ts
import { baseSepolia } from "wagmi/chains";
import NationalIdNFTABI from "./abis/NationalIdNFT.json";
import LandOwnershipNFTABI from "./abis/LandOwnershipNFT.json";
import LandTransferContractABI from "./abis/LandTransferContract.json";

export const contracts = {
  nationalIdNFT: {
    address: process.env.NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS,
    abi: NationalIdNFTABI,
    chainId: baseSepolia.id,
  },
  landOwnershipNFT: {
    address: process.env.NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS,
    abi: LandOwnershipNFTABI,
    chainId: baseSepolia.id,
  },
  landTransferContract: {
    address: process.env.NEXT_PUBLIC_LAND_TRANSFER_CONTRACT_ADDRESS,
    abi: LandTransferContractABI,
    chainId: baseSepolia.id,
  },
};
```

## 📚 Documentation Index

| Document                                                                  | Purpose                   | Audience            |
| ------------------------------------------------------------------------- | ------------------------- | ------------------- |
| [START-HERE.md](./START-HERE.md)                                          | Quick start guide         | All developers      |
| [NFT-CONTRACTS-README.md](./blockchain/NFT-CONTRACTS-README.md)           | Complete contract guide   | Smart contract devs |
| [LAND-TRANSFER-CONTRACT.md](./blockchain/LAND-TRANSFER-CONTRACT.md)       | Transfer contract details | Smart contract devs |
| [CONTRACT-REVISION-SUMMARY.md](./blockchain/CONTRACT-REVISION-SUMMARY.md) | Migration summary         | Backend devs        |
| [DEPLOYMENT-CHECKLIST.md](./blockchain/DEPLOYMENT-CHECKLIST.md)           | Deployment steps          | DevOps              |
| [WAGMI-MIGRATION.md](./client/WAGMI-MIGRATION.md)                         | Wagmi setup               | Frontend devs       |
| [WAGMI-QUICKSTART.md](./client/WAGMI-QUICKSTART.md)                       | Quick reference           | Frontend devs       |
| [SMART-CONTRACT-ARCHITECTURE.md](./SMART-CONTRACT-ARCHITECTURE.md)        | System overview (this)    | Architects          |

## 🎓 Learning Resources

### For Smart Contract Developers

- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)

### For Frontend Developers

- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)
- [Base Documentation](https://docs.base.org/)

### For Backend Developers

- [Ethers.js Documentation](https://docs.ethers.org/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)

## 🤝 Support

- **Issues:** Open GitHub issues for bugs
- **Questions:** Ask in team chat
- **Documentation:** Update docs when making changes

## 📄 License

MIT License - See LICENSE file for details

---

**Last Updated:** 2025-01-XX
**Version:** 1.0.0
**Status:** ✅ Complete and ready for deployment
