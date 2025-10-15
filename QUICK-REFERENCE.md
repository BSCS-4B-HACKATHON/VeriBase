# 📋 Quick Reference Card

> **TL;DR:** Everything you need to know in one page

---

## 🎯 What You Have

**3 Smart Contracts:**

1. **NationalIdNFT** - Soul-bound identity tokens (non-transferable)
2. **LandOwnershipNFT** - Property tokens (controlled transfer)
3. **LandTransferContract** - Escrow and transfer management

**Frontend:** Next.js with Wagmi v2 wallet connection (MetaMask + Coinbase)
**Backend:** Express API for minting NFTs
**Network:** Base Sepolia testnet (chainId: 84532)

---

## 🚀 Deploy in 5 Minutes

```bash
# 1. Get test ETH from faucet
# https://docs.base.org/docs/tools/network-faucets

# 2. Set private key
cd base_own/blockchain
echo "BASE_SEPOLIA_PRIVATE_KEY=0x..." > .env

# 3. Deploy all contracts
npx hardhat run scripts/deployNFTs.ts --network baseSepolia

# 4. Save addresses from deployments/nfts-baseSepolia.json
# ✅ Done! Contracts are live.
```

---

## 📂 File Structure

```
base_own/
├── blockchain/
│   ├── contracts/           # Smart contracts (.sol)
│   ├── scripts/             # Deployment scripts
│   ├── deployments/         # Contract addresses (after deploy)
│   └── docs/               # Technical docs
├── client/
│   ├── lib/wagmi.ts        # Wallet config
│   ├── hooks/useWallet.ts  # Wallet hook
│   └── components/         # React components
├── server/
│   └── src/services/       # Backend logic
└── docs/
    ├── NEXT-STEPS.md       # Detailed deployment guide
    └── SMART-CONTRACT-ARCHITECTURE.md  # System overview
```

---

## 🔐 Contract Addresses (After Deployment)

**Location:** `blockchain/deployments/nfts-baseSepolia.json`

```json
{
  "nationalIdNFT": "0x...",
  "landOwnershipNFT": "0x...",
  "landTransferContract": "0x..."
}
```

**Update these in:**

- `server/.env` → `NATIONAL_ID_NFT_ADDRESS=...`
- `client/.env.local` → `NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS=...`

---

## 💻 Key Commands

### Blockchain

```bash
cd base_own/blockchain

# Compile
npx hardhat compile

# Test
npx hardhat test

# Deploy
npx hardhat run scripts/deployNFTs.ts --network baseSepolia

# Verify
npx hardhat verify --network baseSepolia <ADDRESS>
```

### Backend

```bash
cd base_own/server

# Install
npm install

# Copy ABIs
cp ../blockchain/artifacts/contracts/*/**.json src/abis/

# Run
npm run dev
```

### Frontend

```bash
cd base_own/client

# Install
npm install

# Copy ABIs
cp ../blockchain/artifacts/contracts/*/**.json lib/abis/

# Run
npm run dev
```

---

## 🎨 Contract Functions

### NationalIdNFT (Soul-bound)

```solidity
safeMint(address to, DocMeta[] metadata) → tokenId
getDocumentMetadata(uint256 tokenId) → DocMeta[]
ownerOf(uint256 tokenId) → address
balanceOf(address owner) → uint256 (always 0 or 1)
```

**⚠️ Non-transferable!** All transfer functions will revert.

### LandOwnershipNFT (Transferable via contract)

```solidity
safeMint(address to, DocMeta[] metadata) → tokenId
getDocumentMetadata(uint256 tokenId) → DocMeta[]
ownerOf(uint256 tokenId) → address
balanceOf(address owner) → uint256
setTransferContract(address _transferContract) → void  // Admin only
```

**⚠️ Only transfer via LandTransferContract!**

### LandTransferContract (Escrow)

```solidity
// Seller initiates
initiateTransfer(tokenId, buyer, price, duration, legalDocCid) → transferId

// Buyer pays
depositEscrow(transferId) payable → void

// Admin completes
completeTransfer(transferId) → void

// Anyone can cancel
cancelTransfer(transferId) → void

// View
getTransferDetails(transferId) → TransferRequest
hasActiveTransfer(tokenId) → bool
```

---

## 🔄 User Flows

### Mint Identity NFT

```
User submits request → Backend API → MongoDB
                                    ↓
                            Mint NationalIdNFT
                                    ↓
                            NFT → User wallet (permanent)
```

### Mint Property NFT

```
User submits request → Backend API → MongoDB
                                    ↓
                          Mint LandOwnershipNFT
                                    ↓
                            NFT → User wallet
```

### Transfer Property

```
1. Seller.initiateTransfer(tokenId, buyer, price, duration, cid)
2. Buyer.depositEscrow(transferId) {value: price}
3. [Admin verifies legal docs off-chain]
4. Admin.completeTransfer(transferId)
   → NFT transferred to buyer
   → Funds released to seller (minus 2.5% fee)
```

---

## 🔧 Frontend Integration

### Connect Wallet

```typescript
import { useAccount, useConnect } from "wagmi";

const { address, isConnected } = useAccount();
const { connectors, connect } = useConnect();

// MetaMask
connect({ connector: connectors.find((c) => c.id === "metaMaskSDK") });

// Coinbase
connect({ connector: connectors.find((c) => c.id === "coinbaseWalletSDK") });
```

### Read NFT Data

```typescript
import { useReadContract } from "wagmi";
import { contracts } from "@/lib/contracts";

const { data: metadata } = useReadContract({
  ...contracts.nationalIdNFT,
  functionName: "getDocumentMetadata",
  args: [tokenId],
});
```

### Initiate Transfer

```typescript
import { useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { contracts } from "@/lib/contracts";

const { writeContract } = useWriteContract();

writeContract({
  ...contracts.landTransferContract,
  functionName: "initiateTransfer",
  args: [tokenId, buyerAddress, parseEther("100"), 30n, "QmCid..."],
});
```

---

## 🛠️ Backend Integration

### Mint NFT

```typescript
import { ethers } from "ethers";
import NationalIdNFTABI from "./abis/NationalIdNFT.json";

const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

const nationalIdNFT = new ethers.Contract(
  process.env.NATIONAL_ID_NFT_ADDRESS!,
  NationalIdNFTABI.abi,
  signer
);

// Mint
const tx = await nationalIdNFT.safeMint(userWallet, metadata);
const receipt = await tx.wait();

const tokenId = receipt.logs[0].topics[3]; // From Transfer event
```

---

## 📊 Fee Structure

**Default:** 2.5% (250 basis points)

| Sale Price | Fee (2.5%) | Seller Gets | Fee Collector Gets |
| ---------- | ---------- | ----------- | ------------------ |
| 10 ETH     | 0.25 ETH   | 9.75 ETH    | 0.25 ETH           |
| 100 ETH    | 2.5 ETH    | 97.5 ETH    | 2.5 ETH            |
| 1000 ETH   | 25 ETH     | 975 ETH     | 25 ETH             |

Update fees (admin only):

```solidity
updateFees(300, feeRecipientAddress) // 3%
```

---

## 🔗 Important Links

**Network:**

- RPC: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org
- Faucet: https://docs.base.org/docs/tools/network-faucets

**Documentation:**

- [Full Deployment Guide](./NEXT-STEPS.md)
- [Contract Details](./blockchain/NFT-CONTRACTS-README.md)
- [Transfer Contract](./blockchain/LAND-TRANSFER-CONTRACT.md)
- [System Architecture](./SMART-CONTRACT-ARCHITECTURE.md)
- [Wagmi Guide](./client/WAGMI-QUICKSTART.md)

**Resources:**

- [Wagmi Docs](https://wagmi.sh/)
- [Viem Docs](https://viem.sh/)
- [Base Docs](https://docs.base.org/)
- [Hardhat Docs](https://hardhat.org/docs)

---

## 🚨 Troubleshooting

| Problem                 | Solution                                                |
| ----------------------- | ------------------------------------------------------- |
| Contract not found      | Check addresses in deployments/ match .env              |
| Transaction reverted    | Ensure wallet has ETH, contract authorized              |
| Wallet connection fails | Use connector IDs: 'metaMaskSDK' or 'coinbaseWalletSDK' |
| NFT not showing         | Add token manually in MetaMask                          |
| Build errors            | Run `npm install` and `npx hardhat compile`             |

---

## ✅ Post-Deployment Checklist

- [ ] Contracts deployed to Base Sepolia
- [ ] Addresses saved in deployments/
- [ ] Backend .env updated with addresses
- [ ] Frontend .env.local updated with addresses
- [ ] ABIs copied to backend src/abis/
- [ ] ABIs copied to frontend lib/abis/
- [ ] Test mint National ID NFT
- [ ] Test mint Land Ownership NFT
- [ ] Test land transfer initiation
- [ ] Test land transfer completion
- [ ] Verify contracts on Basescan

---

## 🎯 Success Metrics

**Working System:**
✅ User can submit request
✅ Admin can mint NFT to user
✅ User sees NFT in wallet
✅ Owner can initiate land transfer
✅ Buyer can deposit escrow
✅ Admin can complete transfer
✅ NFT ownership updates correctly

---

## 📞 Need Help?

1. Check [NEXT-STEPS.md](./NEXT-STEPS.md) for detailed guide
2. Read [NFT-CONTRACTS-README.md](./blockchain/NFT-CONTRACTS-README.md)
3. Review [TROUBLESHOOTING](./NEXT-STEPS.md#-common-issues--solutions)
4. Ask in team chat

---

**Last Updated:** 2025-01-XX
**Version:** 1.0.0
**Status:** ✅ Ready to deploy

---

**Quick Deploy Command:**

```bash
cd base_own/blockchain && \
echo "BASE_SEPOLIA_PRIVATE_KEY=0x..." > .env && \
npx hardhat run scripts/deployNFTs.ts --network baseSepolia
```

**That's it! You're ready to go! 🚀**
