# Type Fixes Summary

## Issues Fixed

### 1. NFT Document Types (client/hooks/useUserNFTs.ts)

**Problem**: NFT page was expecting fields that didn't exist in the `NFTDocument` type.

**Solution**: Updated `NFTDocument` interface to match actual on-chain data structure from contracts:

```typescript
export interface NFTMetadata {
  requestType: string;
  minimalPublicLabel: string;
  metadataCid: string;
  metadataHash: string;
  uploaderSignature: string;
  files: DocMeta[];
  consentTextVersion: string;
  consentTimestamp: bigint;
}

export interface NFTDocument {
  // Basic info
  id: string;
  tokenId: string;
  title: string;
  type: "Land Title" | "National ID";
  status: "approved" | "pending" | "rejected";

  // Timestamps
  mintedDate: string;
  uploadDate: string;

  // Addresses
  contractAddress: string;
  ownerAddress: string;

  // Metadata
  metadataUrl?: string;
  verified: boolean;

  // Blockchain details
  network: string;
  blockchainExplorerUrl: string;
  transactionHash: string;
  documentHash: string;
  ipfsCid?: string;
  imageUrl?: string;

  // Verification details
  verificationAuthority: string;
  validationTimestamp: string;

  // On-chain metadata
  metadata?: NFTMetadata;
}
```

**Changes Made**:

- Added `DocMeta` interface matching smart contract struct
- Added `NFTMetadata` interface matching smart contract struct
- Added missing fields to `NFTDocument`: `status`, `uploadDate`, `network`, `transactionHash`, `documentHash`, `verificationAuthority`, `validationTimestamp`, `metadata`
- Updated NFT fetching to call `getMetadata()` function from contracts
- For National ID: Use `getTokenIdByWallet()` instead of enumeration
- For Land Ownership: Use `getTokensByWallet()` to get all token IDs at once
- Populate all fields from on-chain metadata

### 2. Admin Request Types (client/lib/admin-api.ts)

**Problem**: `AdminRequest` interface didn't match actual DB schema (`DocMetaSchema`).

**Solution**: Updated to match server-side schema:

```typescript
export interface DocMeta {
  cid: string;
  filename: string;
  mime?: string;
  size?: number;
  iv?: string;
  ciphertextHash?: string;
  tag?: string;
}

export interface AdminRequest {
  _id: string;
  requestId: string;
  requesterWallet: string;
  requestType: "national_id" | "land_ownership";
  minimalPublicLabel?: string;
  metadataCid?: string;
  metadataHash?: string;
  uploaderSignature?: string;
  files: DocMeta[];
  consent: {
    textVersion: string;
    timestamp: string;
  };
  status: "pending" | "verified" | "rejected";
  createdAt: string;
  updatedAt: string;
}
```

**Changes Made**:

- Removed fake fields: `metadataUri`, `fullName`, `email`, `nationalId`, `dateOfBirth`, `landId`, `landLocation`, `landSize`, `description`
- Added real DB fields: `minimalPublicLabel`, `metadataCid`, `metadataHash`, `uploaderSignature`, `files`, `consent`
- Added `DocMeta` interface for file metadata structure

## Reference Sources

### Smart Contracts

- `blockchain/contracts/NationalIdNFT.sol`
- `blockchain/contracts/LandOwnershipNFT.sol`

Both contracts have:

```solidity
struct DocMeta {
    string cid;
    string filename;
    string mime;
    uint256 size;
    string iv;
    string ciphertextHash;
    string tag;
}

struct Metadata {
    string requestType;
    string minimalPublicLabel;
    string metadataCid;
    string metadataHash;
    string uploaderSignature;
    DocMeta[] files;
    string consentTextVersion;
    uint256 consentTimestamp;
}

function getMetadata(uint256 tokenId) external view returns (Metadata memory);
```

### Database Schema

- `server/src/models/DocMetaSchema.ts`

```typescript
export interface IDocMeta {
  cid: string;
  filename: string;
  mime?: string;
  size?: number;
  iv?: string;
  ciphertextHash?: string;
  tag?: string;
}

export interface IRequest extends Document {
  requestId: string;
  requesterWallet: string;
  requestType: "national_id" | "land_ownership";
  minimalPublicLabel?: string;
  metadataCid?: string;
  metadataHash?: string;
  uploaderSignature?: string;
  files: IDocMeta[];
  consent: {
    textVersion: string;
    timestamp: Date;
  };
  status: "pending" | "verified" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}
```

### Request Controller

- `server/src/controllers/request.controller.ts`
- `server/src/controllers/admin.controller.ts`

The `GetAllRequestsHandler` returns DB records with all the fields defined in the schema.

## Impact

### NFT Pages

- ✅ NFT list page will now display correct data from blockchain
- ✅ NFT detail page will show all on-chain metadata fields
- ✅ No more type errors for missing fields

### Admin Pages

- ✅ Admin requests page will correctly display request data
- ✅ Admin detail page will show actual DB fields
- ✅ No more fake/mock fields
- ✅ Fixed mapping in admin requests page to use real DB fields (`minimalPublicLabel` instead of `fullName`, etc.)

## Files Modified

1. **client/hooks/useUserNFTs.ts**

   - Added `DocMeta`, `NFTMetadata` interfaces
   - Extended `NFTDocument` interface with all required fields
   - Updated NFT fetching logic to call `getMetadata()` from contracts
   - Changed National ID fetching to use `getTokenIdByWallet()`
   - Changed Land Ownership fetching to use `getTokensByWallet()`

2. **client/lib/admin-api.ts**

   - Added `DocMeta` interface
   - Updated `AdminRequest` interface to match DB schema
   - Removed fake fields, added real DB fields

3. **client/app/(admin)/admin/requests/page.tsx**
   - Updated `enhancedRequests` mapping to use real fields
   - Changed `fullName` → `minimalPublicLabel`
   - Changed `nationalId || landId` → `requestId`
   - Changed `description` to use hardcoded string instead of non-existent field
   - Removed references to `email`, `dateOfBirth` (set to undefined)

## Next Steps

1. Test NFT fetching with real deployed contracts
2. Verify admin requests loading works correctly
3. Check if IPFS metadata fields need to be decrypted/displayed
4. Consider adding more metadata fields to UI if needed (files array, consent details, etc.)
