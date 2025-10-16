# Admin Request Detail View Fix

## Problem

The admin request detail page was showing dummy/fake data fields that don't exist in the database schema. It needed to match the user request detail page format and show actual decrypted data from the backend.

## Changes Made

### 1. Updated `client/lib/admin-api.ts`

**Added `DetailedAdminRequest` interface:**

```typescript
export interface DetailedAdminRequest extends AdminRequest {
  // Decrypted personal data for National ID
  nationalIdData?: {
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    idNumber: string | null;
    issueDate: string | null;
    expiryDate: string | null;
  };
  // Decrypted land data for Land Ownership
  landTitleData?: {
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    latitude: string | null;
    longitude: string | null;
    titleNumber: string | null;
    lotArea: string | null;
  };
  // Decrypted files with URLs
  files: Array<
    DocMeta & {
      decryptedUrl?: string;
      decryptError?: boolean;
      meta?: any;
    }
  >;
  // Generic decrypted fields
  decryptedFields?: Record<string, any>;
  encryptedFields?: Record<string, any>;
}
```

**Updated `fetchAdminRequestById()` function:**

- Now calls `/api/requests/${requestId}` endpoint (same as user endpoint)
- This endpoint returns decrypted metadata from server using server's encryption key
- Returns `DetailedAdminRequest` with all decrypted fields

### 2. Updated `client/app/(admin)/admin/requests/[id]/page.tsx`

**Updated data fetching:**

```typescript
const data = await fetchAdminRequestById(requestId);

// Extract decrypted data
const mapped: ExtendedRequest = {
  // ... basic fields
  nationalIdData: data.nationalIdData, // From API
  landTitleData: data.landTitleData, // From API
  // Get decrypted file URLs from API response
  frontImage: data.files?.find((f) => f.tag?.toLowerCase().includes("front"))
    ?.decryptedUrl,
  backImage: data.files?.find((f) => f.tag?.toLowerCase().includes("back"))
    ?.decryptedUrl,
};
```

**Updated Document Details Card:**

- Removed hardcoded fake fields (`idNumber`, `issueDate`, `expiryDate` from wrong locations)
- Added conditional rendering based on `documentType`:
  - **For National ID**: Shows `firstName`, `lastName`, `middleName`, `idNumber`, `issueDate`, `expiryDate` from `nationalIdData`
  - **For Land Title**: Shows `firstName`, `lastName`, `middleName`, `titleNumber`, `latitude`, `longitude`, `lotArea` from `landTitleData`
- Shows "N/A" for missing fields instead of crashing

**Updated Uploaded Documents Card:**

- Shows actual decrypted images from API (`frontImage`, `backImage`)
- Uses real image URLs from `decryptedUrl` field
- Shows placeholder if no images available
- Handles image load errors gracefully

## How It Works

### Server-Side Decryption Flow:

1. Admin calls `/api/requests/${requestId}`
2. Server fetches request from DB
3. Server fetches metadata from IPFS using `metadataCid`
4. Server decrypts metadata using **server's private key** (stored in `encryptedAesKeyForServer`)
5. Server decrypts files and generates signed URLs
6. Server returns decrypted data in structured format:
   - `nationalIdData` for National ID requests
   - `landTitleData` for Land Ownership requests
   - `files[]` with `decryptedUrl` for each file

### Why This Approach:

- **Admin doesn't have user's encryption key** - can't decrypt client-side
- **Server has its own encryption key** wrapped in metadata - can decrypt server-side
- **Matches user request detail page** - same endpoint, same data structure
- **Secure** - files are decrypted to signed URLs (temporary access)

## Reference Implementation

The user request detail page at `client/app/(user)/requests/[id]/page.tsx` shows how to properly display the data:

- Uses `nationalIdData` and `landTitleData` objects from API
- Displays decrypted file URLs from `files[]` array
- Shows proper field labels and formatting
- Handles missing data gracefully

## Result

Admin request detail page now shows:

- ✅ Real decrypted user data (firstName, lastName, etc.)
- ✅ Actual document field values (idNumber, titleNumber, etc.)
- ✅ Real decrypted images from IPFS
- ✅ Proper field labels matching document type
- ✅ Graceful handling of missing data
- ✅ Matches user request detail page layout and data structure

No more fake fields, dummy data, or "Not provided" placeholders!
