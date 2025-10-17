# NFT Metadata Decryption - Complete Implementation

## Overview

The NFT detail page (`/nfts/[address]`) now properly decrypts and displays all metadata fields that are stored on-chain, including personal information and uploaded documents.

## Changes Made

### Updated `client/app/(user)/nfts/[address]/page.tsx`

**Added comprehensive decrypted metadata display section:**

1. **Decrypted Personal Data Card**
   - Shows all decrypted fields from on-chain metadata
   - Conditional rendering based on NFT type (National ID vs Land Title)
   - Responsive grid layout (1 column mobile, 2 columns desktop)

2. **National ID Data Fields**:
   - First Name
   - Last Name
   - Middle Name (if available)
   - ID Number
   - Issue Date
   - Expiry Date

3. **Land Title Data Fields**:
   - First Name
   - Last Name
   - Middle Name (if available)
   - Title Number
   - Latitude
   - Longitude
   - Lot Area (sqm)

4. **Document Uploads Card** (moved under decrypted metadata):
   - Displays decrypted images from IPFS
   - Image preview for image files
   - Download link for non-image files
   - Shows file size and name

## How It Works

### Data Flow

```
On-Chain NFT Metadata (Encrypted)
        ↓
useUserNFTs Hook
        ↓
Backend Decrypt Endpoint (/api/nft/decrypt-metadata)
        ↓
Decrypted Metadata Returned
        ↓
NFT Detail Page Displays Fields
```

### Decryption Process

1. **Hook Fetches NFT Data** (`useUserNFTs.ts`):
   ```typescript
   // Get on-chain metadata
   const metadata = await publicClient.readContract({
     address: NATIONAL_ID_NFT_ADDRESS,
     abi: NationalIdNFTABI.abi,
     functionName: "getMetadata",
     args: [tokenId],
   });
   
   // Decrypt metadata (only if owner is viewing)
   const decryptedMetadata = await decryptMetadata(
     metadata.metadataCid,
     address
   );
   ```

2. **Backend Decrypts Metadata**:
   - Fetches encrypted metadata from IPFS using `metadataCid`
   - Decrypts using owner's private key (if authorized)
   - Returns structured data:
     - `nationalIdData` - For National ID NFTs
     - `landTitleData` - For Land Title NFTs
     - `files[]` - Array of decrypted file URLs

3. **Frontend Displays Data**:
   - Checks if `nft.decryptedMetadata` exists
   - Conditionally renders based on NFT type
   - Shows all available fields in grid layout
   - Displays images inline, other files as download links

## UI Structure

### Before (Old Implementation)
```
- NFT Image
- Basic Info (Token ID, Owner, etc.)
- Quick Actions
- Verification Details
- Blockchain Details
- Document Uploads (files only)
- Timeline
```

### After (New Implementation)
```
- NFT Image
- Basic Info (Token ID, Owner, etc.)
- Quick Actions
- Verification Details
- Blockchain Details
✨ - Decrypted Personal Data (NEW)
  └─ National ID: firstName, lastName, idNumber, etc.
  └─ Land Title: firstName, lastName, titleNumber, lat/long, etc.
✨ - Document Uploads (ENHANCED)
  └─ Shows decrypted images
  └─ Download links for files
- Timeline
```

## Features

✅ **National ID Decryption**: All personal data fields displayed
✅ **Land Title Decryption**: Property and owner data displayed
✅ **Secure Access**: Only NFT owner can decrypt their data
✅ **Image Display**: Decrypted images shown inline
✅ **Responsive Design**: Grid layout adapts to screen size
✅ **Conditional Rendering**: Only shows data that exists
✅ **Type-Safe**: Full TypeScript support

## Security

- **Owner-Only Access**: Backend validates that requester owns the NFT
- **Server-Side Decryption**: Private keys never exposed to client
- **Temporary URLs**: Signed URLs for file access (time-limited)
- **Encrypted On-Chain**: Original data remains encrypted on blockchain

## Testing

To test the implementation:

1. **Navigate to NFT Detail Page**:
   ```
   Go to: /nfts
   Click on any NFT card
   Or directly: /nfts/[tokenId]?type=national-id
   ```

2. **Expected Behavior**:
   - ✅ See "National ID Information" or "Land Title Information" card
   - ✅ All decrypted fields displayed in grid
   - ✅ Images show inline (not encrypted filenames)
   - ✅ Labels formatted nicely (uppercase, tracking)
   - ✅ Font styles appropriate (monospace for IDs, etc.)

3. **Non-Owner View**:
   ```
   If viewing someone else's NFT:
   - Basic info shown
   - Decrypted data NOT shown (privacy protected)
   ```

## Backend API

The decryption is handled by: `server/src/controllers/nft.controller.ts`

**Endpoint**: `POST /api/nft/decrypt-metadata`

**Request**:
```json
{
  "metadataCid": "Qm...",
  "ownerAddress": "0x..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "nationalIdData": {
      "firstName": "John",
      "lastName": "Doe",
      "idNumber": "123456789",
      "issueDate": "2024-01-01",
      "expiryDate": "2034-01-01"
    },
    "files": [
      {
        "filename": "front_id.jpg",
        "decryptedUrl": "https://...",
        "mime": "image/jpeg",
        "size": 94822
      }
    ]
  }
}
```

## Comparison with Other Views

### Admin Request Detail (`/admin/requests/[id]`)
- Shows decrypted data for **any request** (admin privilege)
- Used for approval/rejection workflow
- Same data structure as NFT view

### User Request Detail (`/requests/[id]`)
- Shows decrypted data for **user's own request**
- Used for editing before minting
- Includes mint button if approved

### NFT Detail (`/nfts/[address]`)
- Shows decrypted data for **minted NFT** (owner only)
- Read-only view of on-chain data
- Includes transfer button (Land Title only)

## Files Modified

1. `client/app/(user)/nfts/[address]/page.tsx`
   - Added decrypted metadata display section
   - Conditional rendering for National ID vs Land Title
   - Enhanced document uploads display

2. `client/hooks/useUserNFTs.ts`
   - Already had decryption logic (no changes needed)
   - Calls backend to decrypt metadata
   - Stores in `nft.decryptedMetadata`

## Result

✅ NFT detail page now shows complete decrypted data
✅ Matches admin and user request page patterns
✅ Proper security (owner-only access)
✅ Clean, responsive UI
✅ Full TypeScript support
✅ No compilation errors

The NFT owner can now view all their decrypted personal information and uploaded documents directly from the NFT detail page!
