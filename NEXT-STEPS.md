# 🎯 Next Steps - Deployment & Integration Guide

## ✅ What's Complete

You now have a fully-functional smart contract system with:

- ✅ **NationalIdNFT** - Soul-bound identity NFTs
- ✅ **LandOwnershipNFT** - Property ownership NFTs
- ✅ **LandTransferContract** - Escrow and transfer management
- ✅ **Deployment script** - Automated deployment and linking
- ✅ **Comprehensive documentation** - 8 detailed markdown files
- ✅ **Wagmi integration** - Modern wallet connection
- ✅ **Clean architecture** - Old files removed

## 🚀 What's Next - Step by Step

### Phase 1: Deploy Contracts (15 minutes)

#### Step 1.1: Get Test ETH

```bash
# Visit Base Sepolia faucet
# https://docs.base.org/docs/tools/network-faucets
# Request ETH to your deployer wallet
```

#### Step 1.2: Set Environment Variables

```bash
cd base_own/blockchain

# Create .env file
echo "BASE_SEPOLIA_PRIVATE_KEY=your_private_key_here" > .env

# Optional: For contract verification
echo "BASESCAN_API_KEY=your_api_key_here" >> .env
```

⚠️ **Security:** Never commit `.env` files!

#### Step 1.3: Compile Contracts

```bash
npx hardhat compile

# Expected output:
# ✓ Compiled 3 contracts
# ✓ NationalIdNFT
# ✓ LandOwnershipNFT
# ✓ LandTransferContract
```

#### Step 1.4: Deploy to Base Sepolia

```bash
npx hardhat run scripts/deployNFTs.ts --network baseSepolia

# Expected output:
# 🚀 Deploying NFT Contracts to baseSepolia...
# ✅ NationalIdNFT deployed: 0x...
# ✅ LandOwnershipNFT deployed: 0x...
# ✅ LandTransferContract deployed: 0x...
# ✅ Authorization complete
# 📝 Addresses saved to deployments/nfts-baseSepolia.json
```

#### Step 1.5: Verify Contracts (Optional but Recommended)

```bash
# Get contract addresses from deployments/nfts-baseSepolia.json
NATIONAL_ID_ADDRESS="0x..."
LAND_OWNERSHIP_ADDRESS="0x..."
TRANSFER_CONTRACT_ADDRESS="0x..."

# Verify each contract
npx hardhat verify --network baseSepolia $NATIONAL_ID_ADDRESS
npx hardhat verify --network baseSepolia $LAND_OWNERSHIP_ADDRESS
npx hardhat verify --network baseSepolia $TRANSFER_CONTRACT_ADDRESS $LAND_OWNERSHIP_ADDRESS 250 "deployer_address"
```

**✅ Checkpoint:** Contracts are now live on Base Sepolia!

---

### Phase 2: Update Backend (30 minutes)

#### Step 2.1: Copy Contract ABIs

```bash
cd base_own

# Copy ABIs from blockchain artifacts to server
mkdir -p server/src/abis

# Copy the ABIs
cp blockchain/artifacts/contracts/NationalIdNFT.sol/NationalIdNFT.json server/src/abis/
cp blockchain/artifacts/contracts/LandOwnershipNFT.sol/LandOwnershipNFT.json server/src/abis/
cp blockchain/artifacts/contracts/LandTransferContract.sol/LandTransferContract.json server/src/abis/
```

#### Step 2.2: Update Backend Environment

```bash
cd server

# Add to .env
cat >> .env << EOF

# Smart Contract Addresses (Base Sepolia)
NATIONAL_ID_NFT_ADDRESS=0x...  # From deployments/nfts-baseSepolia.json
LAND_OWNERSHIP_NFT_ADDRESS=0x...
LAND_TRANSFER_CONTRACT_ADDRESS=0x...

# Blockchain Configuration
BLOCKCHAIN_RPC_URL=https://sepolia.base.org
BLOCKCHAIN_CHAIN_ID=84532
ADMIN_PRIVATE_KEY=your_admin_wallet_private_key_here
EOF
```

#### Step 2.3: Create NFT Service

```typescript
// server/src/services/nft.service.ts
import { ethers } from "ethers";
import NationalIdNFTABI from "../abis/NationalIdNFT.json";
import LandOwnershipNFTABI from "../abis/LandOwnershipNFT.json";

const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
const signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);

const nationalIdNFT = new ethers.Contract(
  process.env.NATIONAL_ID_NFT_ADDRESS!,
  NationalIdNFTABI.abi,
  signer
);

const landOwnershipNFT = new ethers.Contract(
  process.env.LAND_OWNERSHIP_NFT_ADDRESS!,
  LandOwnershipNFTABI.abi,
  signer
);

export async function mintNFT(
  requesterWallet: string,
  requestType: string,
  metadata: Array<{ label: string; value: string; encrypted: boolean }>
) {
  const contract =
    requestType === "national_id" ? nationalIdNFT : landOwnershipNFT;

  const tx = await contract.safeMint(requesterWallet, metadata);
  const receipt = await tx.wait();

  const tokenId = receipt.logs[0].topics[3]; // Transfer event tokenId
  return {
    tokenId: BigInt(tokenId).toString(),
    txHash: receipt.hash,
  };
}
```

#### Step 2.4: Update Request Completion Flow

```typescript
// server/src/services/request.service.ts
import { mintNFT } from "./nft.service";

export async function completeRequest(requestId: string) {
  const request = await Request.findById(requestId);

  // Prepare metadata from DocMeta
  const metadata = request.documents.map((doc) => ({
    label: doc.label,
    value: doc.encrypted ? encryptData(doc.value) : doc.value,
    encrypted: doc.encrypted,
  }));

  // Mint appropriate NFT
  const { tokenId, txHash } = await mintNFT(
    request.requesterWallet,
    request.requestType,
    metadata
  );

  // Update request status
  request.status = "completed";
  request.tokenId = tokenId;
  request.txHash = txHash;
  await request.save();

  return { tokenId, txHash };
}
```

**✅ Checkpoint:** Backend can now mint NFTs!

---

### Phase 3: Update Frontend (30 minutes)

#### Step 3.1: Copy Contract ABIs to Frontend

```bash
cd base_own

# Create ABIs directory
mkdir -p client/lib/abis

# Copy the ABIs
cp blockchain/artifacts/contracts/NationalIdNFT.sol/NationalIdNFT.json client/lib/abis/
cp blockchain/artifacts/contracts/LandOwnershipNFT.sol/LandOwnershipNFT.json client/lib/abis/
cp blockchain/artifacts/contracts/LandTransferContract.sol/LandTransferContract.json client/lib/abis/
```

#### Step 3.2: Update Frontend Environment

```bash
cd client

# Add to .env.local
cat >> .env.local << EOF

# Smart Contract Addresses (Base Sepolia)
NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS=0x...
NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS=0x...
NEXT_PUBLIC_LAND_TRANSFER_CONTRACT_ADDRESS=0x...
EOF
```

#### Step 3.3: Create Contract Utilities

```typescript
// client/lib/contracts.ts
import { baseSepolia } from "wagmi/chains";
import NationalIdNFTABI from "./abis/NationalIdNFT.json";
import LandOwnershipNFTABI from "./abis/LandOwnershipNFT.json";
import LandTransferContractABI from "./abis/LandTransferContract.json";

export const contracts = {
  nationalIdNFT: {
    address: process.env.NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS as `0x${string}`,
    abi: NationalIdNFTABI.abi,
    chainId: baseSepolia.id,
  },
  landOwnershipNFT: {
    address: process.env
      .NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS as `0x${string}`,
    abi: LandOwnershipNFTABI.abi,
    chainId: baseSepolia.id,
  },
  landTransferContract: {
    address: process.env
      .NEXT_PUBLIC_LAND_TRANSFER_CONTRACT_ADDRESS as `0x${string}`,
    abi: LandTransferContractABI.abi,
    chainId: baseSepolia.id,
  },
} as const;
```

#### Step 3.4: Create NFT Display Component

```typescript
// client/components/nft-display.tsx
"use client";

import { useReadContract } from "wagmi";
import { contracts } from "@/lib/contracts";

export function NFTDisplay({
  tokenId,
  type,
}: {
  tokenId: bigint;
  type: "national_id" | "land_ownership";
}) {
  const contract =
    type === "national_id"
      ? contracts.nationalIdNFT
      : contracts.landOwnershipNFT;

  const { data: metadata } = useReadContract({
    ...contract,
    functionName: "getDocumentMetadata",
    args: [tokenId],
  });

  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-bold">NFT #{tokenId.toString()}</h3>
      {metadata && (
        <ul className="space-y-2 mt-2">
          {metadata.map((item: any, idx: number) => (
            <li key={idx}>
              <span className="font-medium">{item.label}:</span>{" "}
              {item.encrypted ? "🔒 Encrypted" : item.value}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

#### Step 3.5: Create Land Transfer Component

```typescript
// client/components/land-transfer-form.tsx
"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { contracts } from "@/lib/contracts";

export function LandTransferForm({ tokenId }: { tokenId: bigint }) {
  const [buyer, setBuyer] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("30");
  const [legalCid, setLegalCid] = useState("");

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    writeContract({
      ...contracts.landTransferContract,
      functionName: "initiateTransfer",
      args: [
        tokenId,
        buyer as `0x${string}`,
        parseEther(price),
        BigInt(duration),
        legalCid,
      ],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Buyer Address (0x...)"
        value={buyer}
        onChange={(e) => setBuyer(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="number"
        placeholder="Price (ETH)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="number"
        placeholder="Duration (days)"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Legal Document IPFS CID"
        value={legalCid}
        onChange={(e) => setLegalCid(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white p-2 rounded"
      >
        {isLoading ? "Initiating..." : "Initiate Transfer"}
      </button>
      {isSuccess && <p className="text-green-600">Transfer initiated!</p>}
    </form>
  );
}
```

**✅ Checkpoint:** Frontend can now display NFTs and initiate transfers!

---

### Phase 4: Testing (1 hour)

#### Test 1: Mint National ID NFT

```bash
# From backend
curl -X POST http://localhost:3001/api/requests/complete \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "...",
    "requesterWallet": "0x...",
    "requestType": "national_id"
  }'

# Expected: NFT minted, tokenId returned
```

#### Test 2: Mint Land Ownership NFT

```bash
curl -X POST http://localhost:3001/api/requests/complete \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "...",
    "requesterWallet": "0x...",
    "requestType": "land_ownership"
  }'

# Expected: NFT minted, tokenId returned
```

#### Test 3: View NFT on Basescan

```
https://sepolia.basescan.org/address/NATIONAL_ID_NFT_ADDRESS
https://sepolia.basescan.org/address/LAND_OWNERSHIP_NFT_ADDRESS
```

#### Test 4: Initiate Transfer (Frontend)

1. Navigate to your NFT page
2. Fill in transfer form
3. Click "Initiate Transfer"
4. Approve MetaMask transaction
5. Verify on Basescan

#### Test 5: Complete Transfer (Backend Admin)

```typescript
// Create admin script
import { ethers } from "ethers";
import LandTransferContractABI from "./abis/LandTransferContract.json";

const transferContract = new ethers.Contract(
  process.env.LAND_TRANSFER_CONTRACT_ADDRESS!,
  LandTransferContractABI.abi,
  signer
);

const transferId = 0; // From TransferInitiated event
const tx = await transferContract.completeTransfer(transferId);
await tx.wait();

console.log("Transfer completed!");
```

**✅ Checkpoint:** All flows tested and working!

---

## 📊 Success Criteria

### Smart Contracts

- ✅ Deployed to Base Sepolia
- ✅ Verified on Basescan
- ✅ Transfer contract authorized
- ✅ All addresses saved

### Backend

- ✅ Mints National ID NFTs
- ✅ Mints Land Ownership NFTs
- ✅ Updates request status correctly
- ✅ Stores tokenId and txHash

### Frontend

- ✅ Displays user's NFTs
- ✅ Shows NFT metadata
- ✅ Initiates land transfers
- ✅ Shows transfer status

### End-to-End

- ✅ User submits request
- ✅ Admin approves and mints NFT
- ✅ User sees NFT in wallet
- ✅ User initiates transfer
- ✅ Admin completes transfer
- ✅ NFT ownership updated

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot find module './abis/...'"

**Solution:** Run the ABI copy commands in Phase 2.1 and 3.1

### Issue: "Contract not deployed"

**Solution:** Check `deployments/nfts-baseSepolia.json` for correct addresses

### Issue: "Transaction reverted"

**Solution:** Check wallet has Base Sepolia ETH, contract is authorized

### Issue: "NFT doesn't appear in wallet"

**Solution:** Add token manually in MetaMask using contract address

### Issue: "Transfer initiation fails"

**Solution:** Verify caller owns the NFT and NFT isn't already in a transfer

---

## 📚 Documentation Reference

| Need Help With...   | Read This Document                                                        |
| ------------------- | ------------------------------------------------------------------------- |
| Contract overview   | [NFT-CONTRACTS-README.md](./blockchain/NFT-CONTRACTS-README.md)           |
| Transfer details    | [LAND-TRANSFER-CONTRACT.md](./blockchain/LAND-TRANSFER-CONTRACT.md)       |
| Backend integration | [CONTRACT-REVISION-SUMMARY.md](./blockchain/CONTRACT-REVISION-SUMMARY.md) |
| Deployment steps    | [DEPLOYMENT-CHECKLIST.md](./blockchain/DEPLOYMENT-CHECKLIST.md)           |
| Wallet setup        | [WAGMI-QUICKSTART.md](./client/WAGMI-QUICKSTART.md)                       |
| System architecture | [SMART-CONTRACT-ARCHITECTURE.md](./SMART-CONTRACT-ARCHITECTURE.md)        |

---

## 🎉 You're Ready!

Everything is set up and ready to deploy. Follow the phases above in order, and you'll have a fully functional NFT-based identity and land ownership system!

**Good luck! 🚀**

---

**Quick Command Reference:**

```bash
# Deploy contracts
cd base_own/blockchain
npx hardhat run scripts/deployNFTs.ts --network baseSepolia

# Copy ABIs to backend
cp blockchain/artifacts/contracts/*/**.json server/src/abis/

# Copy ABIs to frontend
cp blockchain/artifacts/contracts/*/**.json client/lib/abis/

# Run backend
cd server && npm run dev

# Run frontend
cd client && npm run dev

# Test everything!
```
