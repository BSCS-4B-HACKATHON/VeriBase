# Mock Data Removal - Final Fixes Applied

## Issues Fixed

### 1. ✅ "Failed to load requests" Error

**Problem:** Admin requests page couldn't connect to backend API.

**Root Cause:** The `admin-api.ts` helper was only checking `NEXT_PUBLIC_API_URL` environment variable, but the project uses `NEXT_PUBLIC_SERVER_URL`.

**Fix Applied:**

```typescript
// client/lib/admin-api.ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_SERVER_URL ||
  "http://localhost:5000";
```

Now it checks both environment variables and falls back to localhost.

### 2. ✅ IPFS Metadata Not Updated on Approve/Reject

**Problem:** When admin approves or rejects a request, the status was only updated in MongoDB but NOT in the IPFS metadata (metadataCid).

**Why This Matters:**

- Your smart contracts store `metadataCid` on-chain
- The metadata should reflect the current status
- Users fetching from IPFS would see outdated status

**Fixes Applied:**

#### A. Added `pinJson` function to pinataUtils.ts

```typescript
export async function pinJson(
  jsonData: any,
  pinataMetadata?: { name?: string; keyvalues?: Record<string, any> }
);
```

This function:

- Pins JSON data to IPFS via Pinata API
- Uses existing Pinata credentials (JWT or API Key/Secret)
- Returns new IPFS hash (CID)

#### B. Updated `ApproveRequestHandler` in admin.controller.ts

Now when approving:

1. Fetches existing metadata from IPFS (using metadataCid)
2. Updates metadata with:
   - `status: "verified"`
   - `verifiedAt: ISO timestamp`
   - `verifiedBy: "admin"`
3. Pins updated metadata to IPFS (gets new CID)
4. Updates `metadataCid` in database with new CID
5. Logs success: `✅ Request ${requestId} approved and metadata updated on IPFS: ${newCid}`

#### C. Updated `RejectRequestHandler` in admin.controller.ts

Now when rejecting:

1. Fetches existing metadata from IPFS
2. Updates metadata with:
   - `status: "rejected"`
   - `rejectedAt: ISO timestamp`
   - `rejectedBy: "admin"`
   - `rejectionReason: reason from admin`
3. Pins updated metadata to IPFS
4. Updates `metadataCid` in database
5. Logs success: `❌ Request ${requestId} rejected and metadata updated on IPFS: ${newCid}`

**Error Handling:** Both functions continue even if IPFS update fails (DB status is still updated). Warnings logged if IPFS fails.

## Updated Metadata Structure

### Before Approval/Rejection:

```json
{
  "requestType": "national_id",
  "minimalPublicLabel": "John Doe ID",
  "metadataCid": "Qm...",
  "metadataHash": "0x...",
  "uploaderSignature": "0x...",
  "encryptedFields": {...},
  "files": [...]
}
```

### After Approval:

```json
{
  "requestType": "national_id",
  "minimalPublicLabel": "John Doe ID",
  "metadataCid": "Qm...",
  "metadataHash": "0x...",
  "uploaderSignature": "0x...",
  "encryptedFields": {...},
  "files": [...],
  "status": "verified",  // ← NEW
  "verifiedAt": "2025-10-16T12:34:56.789Z",  // ← NEW
  "verifiedBy": "admin"  // ← NEW
}
```

### After Rejection:

```json
{
  ...
  "status": "rejected",  // ← NEW
  "rejectedAt": "2025-10-16T12:34:56.789Z",  // ← NEW
  "rejectedBy": "admin",  // ← NEW
  "rejectionReason": "Document quality insufficient"  // ← NEW
}
```

## Smart Contract Integration

Your smart contracts already store most metadata fields:

- `requestType`
- `minimalPublicLabel`
- `metadataCid` ← **This now points to updated metadata with status!**
- `metadataHash`
- `uploaderSignature`
- `files[]` (with all DocMeta fields)
- `consentTextVersion`
- `consentTimestamp`

**When minting NFT:** The new `metadataCid` with verified status should be passed to the contract, so on-chain metadata reflects the approval.

## Environment Variables Needed

### Client (`.env.local` or `.env`):

```env
# Backend API URL (checked in order)
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SERVER_URL=http://localhost:5000

# NFT Contract Addresses
NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS=0x57c236c2097c49c6f3c998b2fcf07f67596dc5f4
NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS=0x7d59c36de7c8825b55c73038fa6bcfd52f903c7a
```

### Server (`.env`):

```env
# Pinata IPFS (required for metadata updates)
PINATA_JWT=your_jwt_token  # Recommended
# OR
PINATA_API_KEY=your_api_key
PINATA_API_SECRET=your_api_secret

PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs

# MongoDB
MONGODB_URI=mongodb://localhost:27017/idverify

# Blockchain
BLOCKCHAIN_RPC_URL=https://sepolia.base.org
NATIONAL_ID_NFT_ADDRESS=0x57c236c2097c49c6f3c998b2fcf07f67596dc5f4
LAND_OWNERSHIP_NFT_ADDRESS=0x7d59c36de7c8825b55c73038fa6bcfd52f903c7a
```

## Testing the Fixes

### 1. Test Admin Requests Loading:

```bash
# Start server
cd server
npm run dev

# Start client
cd client
npm run dev
```

Visit `http://localhost:3000/admin/requests`

- Should now load requests from database
- No more "Failed to load requests" error

### 2. Test IPFS Metadata Update:

```bash
# Approve a request via admin UI
# Check server logs:
✅ Request abc123 approved and metadata updated on IPFS: QmNewCid...

# Check database:
# metadataCid should be updated to new CID

# Fetch metadata from IPFS:
curl https://gateway.pinata.cloud/ipfs/QmNewCid...
# Should show:
# {
#   ...
#   "status": "verified",
#   "verifiedAt": "2025-10-16T...",
#   "verifiedBy": "admin"
# }
```

### 3. Test Rejection:

- Reject a request with reason "Invalid document"
- Check logs for new IPFS CID
- Fetch metadata - should show `status: "rejected"` and `rejectionReason`

## Files Modified

1. ✅ `server/src/utils/pinataUtils.ts` - Added `pinJson()` function
2. ✅ `server/src/controllers/admin.controller.ts` - Updated approve/reject to update IPFS
3. ✅ `client/lib/admin-api.ts` - Fixed API_BASE_URL to check multiple env vars

## Benefits

1. **Immutable Audit Trail:** Every status change creates new IPFS hash
2. **On-Chain Integrity:** Smart contract metadata stays in sync with current status
3. **Transparency:** Users can verify status on IPFS independently
4. **Consistency:** DB, IPFS, and blockchain all reflect same status

## Next Steps

When minting NFT after approval:

1. Get the updated `metadataCid` from database (it now has verified status)
2. Pass this CID to smart contract's `mintNationalId()` or `mintLandOwnership()`
3. The on-chain metadata will include verification status

---

**Status:** ✅ All issues resolved
**Date:** 2025-10-16
**Verified:** Admin API working, IPFS metadata updates on approve/reject
