# Admin Approval Flow - Implementation Complete

## Overview

Implemented a complete admin approval workflow that allows administrators to review and approve/reject NFT verification requests before users can mint their NFTs.

## Architecture

### Backend Components

#### 1. Admin Controller (`server/src/controllers/admin.controller.ts`)

- **GetAllRequestsHandler**: Fetches all requests with optional filters (status, requestType) and pagination
- **ApproveRequestHandler**: Changes request status from "pending" to "verified"
- **RejectRequestHandler**: Changes request status to "rejected" with optional reason
- **GetStatsHandler**: Provides dashboard statistics (total users, requests by status, etc.)

#### 2. Admin Routes (`server/src/routes/admin.route.ts`)

- `GET /api/admin/requests` - List all requests with filters
- `GET /api/admin/stats` - Get dashboard statistics
- `PUT /api/admin/requests/:requestId/approve` - Approve a request
- `PUT /api/admin/requests/:requestId/reject` - Reject a request (with optional reason)

#### 3. Mint Controller (`server/src/controllers/nft.controller.ts` - Existing)

- `POST /api/requests/:requestId/mint` - Mints NFT for verified requests
- Validates request status is "verified"
- Calls blockchain to mint NFT
- Deletes request from database after successful mint

### Frontend Components

#### 1. Admin Dashboard (`client/app/(admin)/admin/page.tsx`)

- Fetches real-time data from backend APIs
- Displays statistics cards (total requests, pending, verified, rejected)
- Shows recent requests table with approve/reject action buttons
- Implements optimistic UI updates
- Error handling with user-friendly alerts

**Key Features:**

- Approve button (green) for pending requests
- Reject button (red) for pending requests
- View button for approved/verified/rejected requests
- Loading states during processing
- Prevents concurrent operations

#### 2. User Request Cards (`client/components/request-card.tsx`)

- Shows "Mint" button for verified/approved requests
- Shows "View" button for pending requests
- Shows "Delete" button for rejected requests
- Handles mint operation with success/error notifications
- Displays transaction link on successful mint

#### 3. Helper Functions (`client/lib/helpers.ts`)

- `mintNFT(requestId)`: Calls the mint endpoint and returns transaction details
- Proper error handling and response parsing

## Workflow

### 1. User Submits Request

- User uploads documents and submits verification request
- Request status: **"pending"**
- User sees "View" button on request card

### 2. Admin Reviews Request

- Admin logs into dashboard at `/admin`
- Views all pending requests in the table
- Can approve or reject the request

### 3. Admin Approves

- Admin clicks "Approve" button
- Backend changes status to **"verified"**
- Dashboard updates automatically
- Status badge shows "Approved"

### 4. User Mints NFT

- User sees "Mint" button on their request card
- Clicks "Mint" button
- Backend mints NFT on blockchain using admin private key
- Transaction is sent to Base Sepolia
- Success notification shows token ID and explorer link
- Request is deleted from database (data now on blockchain)

### 5. Alternative: Admin Rejects

- Admin clicks "Reject" button
- Backend changes status to **"rejected"**
- User sees "Delete" button on request card
- User can delete the rejected request

## Status States

| Status   | Backend Value | UI Display   | User Action    | Admin Action   |
| -------- | ------------- | ------------ | -------------- | -------------- |
| Pending  | "pending"     | Yellow badge | View details   | Approve/Reject |
| Approved | "verified"    | Green badge  | Mint NFT       | View details   |
| Rejected | "rejected"    | Red badge    | Delete request | View details   |

## Environment Variables

### Backend

```env
ADMIN_PRIVATE_KEY=0x...          # Private key for minting NFTs
MONGO_URI=mongodb://...          # MongoDB connection string
BLOCKCHAIN_RPC_URL=https://...   # Base Sepolia RPC URL
NATIONAL_ID_NFT_ADDRESS=0x...    # NationalIdNFT contract address
LAND_OWNERSHIP_NFT_ADDRESS=0x... # LandOwnershipNFT contract address
FRONTEND_ORIGIN=http://localhost:3000
PORT=6969
```

### Frontend

```env
NEXT_PUBLIC_SERVER_URL=http://localhost:6969  # Backend API URL
NEXT_PUBLIC_BE_URL=http://localhost:6969      # Alternative backend URL variable
```

## API Endpoints Summary

### Admin Endpoints

```
GET    /api/admin/requests?status=pending&limit=10
GET    /api/admin/stats
PUT    /api/admin/requests/:requestId/approve
PUT    /api/admin/requests/:requestId/reject
```

### User Endpoints

```
POST   /api/requests/:requestId/mint
GET    /api/requests/:requestId/can-mint
GET    /api/requests?requesterWallet=0x...
```

## Testing the Flow

1. **Start Backend**:

   ```bash
   cd server
   npm run dev
   ```

2. **Start Frontend**:

   ```bash
   cd client
   npm run dev
   ```

3. **Create Test Request**:

   - Navigate to `/requests/new`
   - Upload documents and submit
   - Request should appear with "pending" status

4. **Admin Approval**:

   - Navigate to `/admin`
   - Find the pending request in the table
   - Click "Approve" button
   - Status should change to "verified"

5. **User Mint**:
   - Navigate to `/requests`
   - Find the approved request
   - Click "Mint" button
   - Wait for transaction confirmation
   - Check Base Sepolia explorer for minted NFT
   - Request should be deleted from database

## Deployed Contracts (Base Sepolia)

- **NationalIdNFT**: `0xbe5fb46274763165a8e9bda180273b75d817fec0`
- **LandOwnershipNFT**: `0xdfaf754cc95a9060bd6e467a652f9642e9e33c26`
- **LandTransferContract**: `0xecc7d23c7d82bbaf59cd0b40329d24fd42617467`

## Security Considerations

1. **Admin Private Key**: Stored securely in environment variables, never exposed to frontend
2. **Request Validation**: Backend validates request exists and belongs to correct wallet
3. **Status Checks**: Mint endpoint only works for "verified" status requests
4. **Single Mint**: Request is deleted after successful mint to prevent double-minting
5. **Error Handling**: Comprehensive error handling with user-friendly messages

## Next Steps

- [ ] Add admin authentication/authorization
- [ ] Implement role-based access control (RBAC)
- [ ] Add email notifications for status changes
- [ ] Implement bulk approve/reject operations
- [ ] Add detailed rejection reasons UI
- [ ] Add audit log for admin actions
- [ ] Implement request filtering and sorting on admin dashboard
- [ ] Add pagination for large request lists

## Files Modified

### Backend

- ✅ `server/src/controllers/admin.controller.ts` (NEW)
- ✅ `server/src/routes/admin.route.ts` (NEW)
- ✅ `server/src/index.ts` (updated to register admin routes)

### Frontend

- ✅ `client/app/(admin)/admin/page.tsx` (updated with real API integration)
- ✅ `client/components/request-card.tsx` (added mint button and handler)
- ✅ `client/lib/helpers.ts` (added mintNFT function)

## Implementation Complete! 🎉

All features are now implemented and ready for testing. The admin approval flow is fully functional from backend to frontend.
