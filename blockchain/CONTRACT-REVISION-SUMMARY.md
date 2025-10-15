# Smart Contract Revision Summary

## ✅ What Was Created

### 1. **NationalIdNFT.sol** - Soul-Bound Identity NFT

- One NFT per wallet maximum
- Completely non-transferable (soul-bound)
- Cannot be approved, sold, or transferred
- Stores all encrypted DB metadata on-chain
- Perfect for digital identity/KYC

### 2. **LandOwnershipNFT.sol** - Controlled Transfer Property NFT

- Multiple NFTs per wallet allowed
- Transferable ONLY through authorized contract
- Prevents direct wallet-to-wallet transfers
- Enables regulated property sales/transfers
- Stores all encrypted DB metadata on-chain

## 📊 Metadata Mapping (DB → Blockchain)

### Included in NFT:

✅ `requestType`
✅ `minimalPublicLabel`
✅ `metadataCid`
✅ `metadataHash`
✅ `uploaderSignature`
✅ `files[]` (all DocMeta fields: cid, filename, mime, size, iv, ciphertextHash, tag)
✅ `consent.textVersion`
✅ `consent.timestamp`

### Excluded from NFT (as requested):

❌ `requesterWallet` - Already known (NFT owner)
❌ `requestId` - Not needed on-chain
❌ `status` - Handled by backend

## 🔒 Security Features

### National ID

```
Wallet A → [NFT #1] ❌ Cannot transfer to Wallet B
                    ❌ Cannot approve for sale
                    ❌ Cannot burn/destroy
```

### Land Ownership

```
Wallet A → [NFT #1] ❌ Cannot send directly to Wallet B
           [NFT #2] ✅ Can transfer through authorized contract
           [NFT #3]    (with escrow, payment, legal checks)
```

## 📁 Files Created

### Smart Contracts

- `blockchain/contracts/NationalIdNFT.sol`
- `blockchain/contracts/LandOwnershipNFT.sol`

### Deployment

- `blockchain/scripts/deployNFTs.ts`
- `blockchain/ignition/modules/NationalIdNFT.ts`
- `blockchain/ignition/modules/LandOwnershipNFT.ts`

### Tests

- `blockchain/test/NationalIdNFT.ts`

### Documentation

- `blockchain/NFT-CONTRACTS-README.md` (comprehensive guide)

## 🚀 How to Deploy

```bash
cd blockchain

# Deploy to Base Sepolia
npx hardhat run scripts/deployNFTs.ts --network baseSepolia

# Addresses saved to:
# blockchain/deployments/nfts-baseSepolia.json
```

## 💡 Key Decisions & Recommendations

### National ID ✅ Perfect as-is

- Soul-bound = cannot be stolen, sold, or transferred
- One per wallet = unique identity per person
- Matches real-world identity requirements

### Land Ownership ⚠️ Choose Your Path

**Current Implementation (Recommended):**

- Transfers through authorized smart contract only
- Enables: Escrow, payment processing, legal compliance
- Best for: Real estate, regulated assets, government use
- Trade-off: Requires building transfer contract

**Alternative (If You Want Simple Transfers):**

- Remove transfer restrictions
- Allow direct wallet-to-wallet transfers
- Works with NFT marketplaces
- Best for: Simple ownership proof, no regulations needed

**My Recommendation:** Keep current design (authorized contract transfers) because:

1. Real estate requires legal compliance
2. Enables escrow and payment integration
3. Prevents unauthorized/illegal transfers
4. Provides audit trail for regulators
5. You can still implement marketplace later through authorized contract

## 🔄 Backend Integration Changes Needed

### 1. Update Minting Logic

**Old (ProofNFT):**

```typescript
await proofNFT.ownerMintTo(wallet, hash);
```

**New (Separate Contracts):**

```typescript
if (requestType === "national_id") {
  const tokenId = await nationalIdNFT.mintNationalId([
    wallet,
    requestType,
    minimalPublicLabel,
    metadataCid,
    metadataHash,
    uploaderSignature,
    consentTextVersion,
    BigInt(consentTimestamp)
  ]);

  // Add files
  for (const file of files) {
    await nationalIdNFT.addFileToToken([
      tokenId,
      file.cid,
      file.filename,
      file.mime,
      BigInt(file.size),
      file.iv,
      file.ciphertextHash,
      file.tag
    ]);
  }
} else if (requestType === "land_ownership") {
  // Similar for land ownership
  const tokenId = await landOwnershipNFT.mintLandOwnership([...]);
  // Add files...
}
```

### 2. Update Environment Variables

```bash
# Add to .env
NATIONAL_ID_NFT_ADDRESS=0x...
LAND_OWNERSHIP_NFT_ADDRESS=0x...
```

### 3. Update Frontend

```typescript
// Old
import ProofNFTABI from "../abis/ProofNFT.json";

// New
import NationalIdNFTABI from "../abis/NationalIdNFT.json";
import LandOwnershipNFTABI from "../abis/LandOwnershipNFT.json";

// Use correct contract based on type
const contract =
  requestType === "national_id" ? nationalIdNFT : landOwnershipNFT;
```

## ✅ Testing Checklist

Before production:

- [ ] Deploy to Base Sepolia testnet
- [ ] Test National ID minting
- [ ] Test Land Ownership minting
- [ ] Test adding files to tokens
- [ ] Verify National ID cannot be transferred
- [ ] Verify Land Ownership requires authorized contract
- [ ] Test querying metadata
- [ ] Test multiple land ownerships per wallet
- [ ] Verify one National ID per wallet limit
- [ ] Update backend minting logic
- [ ] Update frontend display logic
- [ ] Add contract addresses to .env
- [ ] Verify on Basescan
- [ ] Monitor gas costs

## 📝 Notes

1. **Field Names Match DB Exactly** - No transformations needed
2. **Data Already Encrypted** - Not encrypted on mint (as you requested)
3. **Two Separate Contracts** - Better separation of concerns
4. **Gas Optimization** - Files added separately to avoid stack depth issues
5. **Type Safety** - Solidity structs match TypeScript interfaces

## 🎯 Next Steps

1. **Deploy contracts** to Base Sepolia
2. **Test minting** with real data
3. **Update backend** minting logic
4. **Update frontend** to use new contracts
5. **Optional:** Build transfer contract for land ownership
6. **Production:** Deploy to Base mainnet when ready

## Questions?

Refer to `NFT-CONTRACTS-README.md` for detailed documentation including:

- Complete usage examples
- Integration guides
- Security considerations
- Testing instructions
- Transfer contract recommendations
