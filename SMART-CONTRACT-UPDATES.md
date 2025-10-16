# Smart Contract Updates Summary

**Date:** October 16, 2025

## Changes Made

### 1. NationalIdNFT.sol ✅
- **Added uniqueness check**: Duplicate `metadataHash` values are now rejected
- **New error**: `DuplicateMetadata()` - prevents duplicate document registration
- **New mapping**: `_metadataHashExists` - tracks all registered metadata hashes
- **New view function**: `isMetadataUnique(string metadataHash)` - check before minting
- **Updated comment**: Contract now documents 100% unique metadata requirement

### 2. LandOwnershipNFT.sol ✅
- **Added uniqueness check**: Duplicate `metadataHash` values are now rejected
- **New error**: `DuplicateMetadata()` - prevents duplicate document registration
- **New mapping**: `_metadataHashExists` - tracks all registered metadata hashes
- **New view function**: `isMetadataUnique(string metadataHash)` - check before minting
- **Updated comment**: Contract now documents 100% unique metadata requirement

### 3. LandTransferContract.sol ✅
- **Made transfers FREE**: Removed all payment, escrow, and fee logic
- **Simplified signature**: `initiateTransfer(tokenId, buyer, legalDocumentCid)` - only needs recipient wallet
- **Removed**: Payment processing, escrow system, fee calculations, expiration dates
- **Removed**: `ReentrancyGuard`, `transferFeeBasisPoints`, `feeRecipient`, `minimumPrice`
- **Simplified struct**: `TransferRequest` no longer includes price/escrow/expiration
- **Simplified events**: Removed payment-related event fields
- **Updated comment**: Contract now documents FREE transfer mechanism

## Documentation Updated

### 4. NFT-CONTRACTS-README.md ✅
- Added uniqueness feature to both contract descriptions
- Updated code examples showing `isMetadataUnique()` usage
- Added new security section "5. Uniqueness Protection"
- Documented duplicate metadata rejection

### 5. LAND-TRANSFER-CONTRACT.md ✅
- Updated to reflect FREE transfer model
- Removed all escrow/payment documentation
- Simplified transfer flow diagram
- Removed fee structure section
- Updated function signatures and examples
- Simplified security features section
- Updated events and error handling

## Server Integration Updated

### 6. server/src/utils/contracts.ts ✅
- **Updated `mintNationalIdNFT()`**: Now accepts full metadata object with all required fields
- **Updated `mintLandOwnershipNFT()`**: Now accepts full metadata object with all required fields
- **Updated `hasNationalIdNFT()`**: Now uses correct `hasNationalId()` function
- **Added `isNationalIdMetadataUnique()`**: Check uniqueness before minting National ID
- **Added `isLandOwnershipMetadataUnique()`**: Check uniqueness before minting Land Ownership
- **Updated `getNationalIdMetadata()`**: Now uses `getMetadata()` instead of `tokenURI()`
- **Updated `getLandOwnershipMetadata()`**: Now uses `getMetadata()` instead of `tokenURI()`

## Next Steps - ACTION REQUIRED

### ⚠️ IMPORTANT: Compile Contracts

Run these commands in **BASH terminal** (not PowerShell):

```bash
# Navigate to blockchain folder
cd /d/veri-base/blockchain

# Compile contracts to generate new ABIs
npx hardhat compile
```

This will:
- Compile all 3 updated contracts
- Generate new ABI files in `artifacts/` folder
- These ABIs need to be copied to `server/src/abis/` and `client/src/abis/`

### Copy ABIs to Server and Client

After compilation, run:

```bash
# Copy to server
cp artifacts/contracts/NationalIdNFT.sol/NationalIdNFT.json server/src/abis/
cp artifacts/contracts/LandOwnershipNFT.sol/LandOwnershipNFT.json server/src/abis/
cp artifacts/contracts/LandTransferContract.sol/LandTransferContract.json server/src/abis/

# Copy to client
cp artifacts/contracts/NationalIdNFT.sol/NationalIdNFT.json client/src/abis/
cp artifacts/contracts/LandOwnershipNFT.sol/LandOwnershipNFT.json client/src/abis/
cp artifacts/contracts/LandTransferContract.sol/LandTransferContract.json client/src/abis/
```

### Test Contracts

```bash
# Run tests to ensure everything works
npx hardhat test

# Or test specific contracts
npx hardhat test test/NationalIdNFT.ts
npx hardhat test test/LandOwnershipNFT.ts
npx hardhat test test/LandTransferContract.ts
```

### Deploy Updated Contracts

⚠️ **You MUST redeploy all 3 contracts** since the signatures changed:

```bash
# Deploy to Base Sepolia testnet
npx hardhat run scripts/deployNFTs.ts --network baseSepolia

# Or local testing
npx hardhat node  # Terminal 1
npx hardhat run scripts/deployNFTs.ts --network localhost  # Terminal 2
```

### Update Environment Variables

After deployment, update your `.env` files with new contract addresses:

**server/.env**
```env
NATIONAL_ID_NFT_ADDRESS=0x...  # New address
LAND_OWNERSHIP_NFT_ADDRESS=0x...  # New address
LAND_TRANSFER_CONTRACT_ADDRESS=0x...  # New address
```

**client/.env.local**
```env
NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS=0x...
NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS=0x...
NEXT_PUBLIC_LAND_TRANSFER_CONTRACT_ADDRESS=0x...
```

## Breaking Changes ⚠️

### Server Code Changes Needed

Your server code that calls minting functions needs to be updated:

**OLD:**
```typescript
await mintNationalIdNFT(walletAddress, tokenURI);
```

**NEW:**
```typescript
await mintNationalIdNFT(walletAddress, {
  requestType: "national_id",
  minimalPublicLabel: "John Doe ID",
  metadataCid: "QmXYZ...",
  metadataHash: "0xabc123...",
  uploaderSignature: "0xdef456...",
  consentTextVersion: "v1.0",
  consentTimestamp: Date.now(),
});
```

### Client Code Changes Needed

If your client code uses the transfer contract:

**OLD:**
```typescript
await transferContract.initiateTransfer(tokenId, buyer, price, duration, docCid);
await transferContract.depositEscrow(transferId, { value: price });
```

**NEW:**
```typescript
// No payment needed - just recipient wallet!
await transferContract.initiateTransfer(tokenId, buyer, docCid);
// No depositEscrow - admin completes when ready
await transferContract.completeTransfer(transferId); // Admin only
```

## Summary of Benefits

✅ **Uniqueness Guaranteed**: No duplicate documents can be registered
✅ **Free Transfers**: Land transfers no longer require payment/fees
✅ **Simplified Flow**: Only recipient wallet address needed
✅ **Better Security**: Duplicate prevention at contract level
✅ **Cleaner Code**: Removed complex escrow/payment logic

## Verification Checklist

Before going to production:

- [ ] Contracts compiled successfully
- [ ] ABIs copied to server and client
- [ ] Tests pass for all 3 contracts
- [ ] Contracts deployed to testnet
- [ ] Environment variables updated
- [ ] Server minting code updated
- [ ] Client transfer code updated (if applicable)
- [ ] Test minting with duplicate metadata (should fail)
- [ ] Test free land transfer flow
- [ ] Verify on BaseScan/Etherscan

## Contract Addresses

### Current (OLD - DO NOT USE)
- NationalIdNFT: `0xbe5fb46274763165a8e9bda180273b75d817fec0`
- LandOwnershipNFT: `0xdfaf754cc95a9060bd6e467a652f9642e9e33c26`
- LandTransferContract: `0xecc7d23c7d82bbaf59cd0b40329d24fd42617467`

### New (After Redeployment)
- NationalIdNFT: `TBD - Update after deployment`
- LandOwnershipNFT: `TBD - Update after deployment`
- LandTransferContract: `TBD - Update after deployment`

## Support

If you encounter any issues:
1. Check that contracts compile without errors
2. Verify all ABIs are up to date
3. Ensure test files are updated for new signatures
4. Check that environment variables point to new contracts
5. Review the updated documentation in this repo

---

**All changes complete!** Now compile and deploy the contracts.
