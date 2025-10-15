# ✅ Server ABI Setup Complete

## 📦 What Was Set Up

Your server now has full access to the smart contracts for minting NFTs!

---

## 📁 Files Created/Updated

### 1. ABI Files

**`server/src/abis/`**

- ✅ `NationalIdNFT.json` - Full contract ABI
- ✅ `LandOwnershipNFT.json` - Full contract ABI
- ✅ `LandTransferContract.json` - Full contract ABI

### 2. Contract Utilities

**`server/src/utils/contracts.ts`** (NEW)

- Exports contract addresses and ABIs
- Creates viem clients (public + wallet)
- Helper functions:
  - `mintNationalIdNFT(address, tokenURI)`
  - `mintLandOwnershipNFT(address, tokenURI)`
  - `hasNationalIdNFT(address)`
  - `getLandBalance(address)`
  - `waitForTransaction(hash)`

### 3. NFT Service

**`server/src/services/nft.service.ts`** (UPDATED)

- ✅ Now loads ABIs correctly
- ✅ Uses deployed contract addresses
- ✅ Handles admin wallet setup
- ✅ Updated `mintNFT()` function

---

## 🔧 Environment Variables

Your `.env` already has the contract addresses! Just add the admin wallet:

```env
# ✅ Already set
NATIONAL_ID_NFT_ADDRESS=0xbe5fb46274763165a8e9bda180273b75d817fec0
LAND_OWNERSHIP_NFT_ADDRESS=0xdfaf754cc95a9060bd6e467a652f9642e9e33c26
LAND_TRANSFER_CONTRACT_ADDRESS=0xecc7d23c7d82bbaf59cd0b40329d24fd42617467

# ⚠️ ADD THIS (use your deployer private key or create a new admin wallet)
ADMIN_PRIVATE_KEY=your_private_key_here
```

**Important:** The `ADMIN_PRIVATE_KEY` wallet needs Base Sepolia ETH to pay for minting gas fees.

---

## 🚀 How to Use

### Option 1: Using the Service (Recommended)

```typescript
import { mintNFT } from "./services/nft.service";

// Mint National ID NFT
const result = await mintNFT({
  requestId: "123",
  requesterWallet: "0x...",
  requestType: "national_id",
  documents: [
    { label: "full_name", value: "John Doe", encrypted: false },
    { label: "id_number", value: "encrypted_data", encrypted: true },
  ],
});

console.log("Transaction:", result.transactionHash);
console.log("Token ID:", result.tokenId);
console.log("Explorer:", result.explorerUrl);
```

### Option 2: Using Contract Utils Directly

```typescript
import {
  mintNationalIdNFT,
  mintLandOwnershipNFT,
  hasNationalIdNFT,
  waitForTransaction,
} from "./utils/contracts";

// Mint NFT
const hash = await mintNationalIdNFT(
  "0xRecipientAddress" as `0x${string}`,
  "ipfs://QmYourMetadataHash"
);

// Wait for confirmation
const receipt = await waitForTransaction(hash);
console.log("Minted at block:", receipt.blockNumber);

// Check if user has NFT
const hasID = await hasNationalIdNFT("0xUserAddress" as `0x${string}`);
console.log("Has National ID:", hasID);
```

---

## 📊 Testing the Setup

### 1. Check if ABIs Loaded

When you start the server, you should see:

```
✅ Contract ABIs loaded successfully
   National ID NFT ABI: XX functions
   Land Ownership NFT ABI: XX functions
```

### 2. Check if Clients Initialized

```
✅ Blockchain clients initialized
   Network: Base Sepolia (84532)
   Admin: 0x...
   National ID NFT: 0xbe5f...
   Land Ownership NFT: 0xdfaf...
```

### 3. Test Minting (optional)

Create a test endpoint:

```typescript
// In your routes
router.post("/test-mint", async (req, res) => {
  try {
    const result = await mintNFT({
      requestId: "test-123",
      requesterWallet: "0xYourTestAddress",
      requestType: "national_id",
      documents: [],
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## ⚠️ Important Notes

### Contract Function Signature

The deployed contracts use:

```solidity
function safeMint(address to, string memory uri)
```

**NOT:**

```solidity
function safeMint(address to, DocMeta[] memory metadata)
```

**This means you need to:**

1. Upload metadata to IPFS first
2. Pass the IPFS URI to `safeMint()`

Example:

```typescript
// 1. Upload to IPFS
const ipfsHash = await uploadToIPFS(metadata);
const tokenURI = `ipfs://${ipfsHash}`;

// 2. Mint with URI
await mintNationalIdNFT(address, tokenURI);
```

---

## 🔗 Resources

- **Contract Addresses**: See `server/.env`
- **BaseScan Explorer**: https://sepolia.basescan.org
- **Get Test ETH**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

---

## ✅ Checklist

- [x] ABIs copied to `server/src/abis/`
- [x] Contract addresses in `.env`
- [ ] **TODO: Add `ADMIN_PRIVATE_KEY` to `.env`**
- [ ] **TODO: Get Base Sepolia ETH for admin wallet**
- [ ] **TODO: Test minting an NFT**

---

## 🎯 Next Steps

1. **Add admin private key** to `server/.env`
2. **Get testnet ETH** from Base Sepolia faucet
3. **Test the minting** with a test endpoint
4. **Integrate with your approval flow**

Your server is ready to mint NFTs! 🎊
