# Real-Time Statistics Integration - Complete

## Overview

Integrated real-time statistics across both user and admin dashboards, combining database analytics with on-chain NFT data from Base Sepolia.

## Features Implemented

### 🎯 Backend Statistics API

#### Endpoints Created

1. **GET /api/stats/global**

   - **Purpose**: Fetch system-wide statistics
   - **Data Sources**:
     - MongoDB (user requests, statuses)
     - Base Sepolia blockchain (minted NFTs via `totalSupply()`)
   - **Returns**:
     ```typescript
     {
       totalRequests: number,
       pendingRequests: number,
       verifiedRequests: number,
       rejectedRequests: number,
       nationalIdRequests: number,
       landOwnershipRequests: number,
       totalUsers: number,
       totalNFTsMinted: number,          // On-chain
       nationalIdNFTsMinted: number,     // On-chain
       landOwnershipNFTsMinted: number,  // On-chain
       approvalRate: string,
       rejectionRate: string
     }
     ```

2. **GET /api/stats/user/:walletAddress**
   - **Purpose**: Fetch user-specific statistics
   - **Data Sources**:
     - MongoDB (user's requests)
     - Base Sepolia blockchain (user's NFT balance via `balanceOf()`)
   - **Returns**:
     ```typescript
     {
       totalRequests: number,
       pendingRequests: number,
       verifiedRequests: number,
       rejectedRequests: number,
       nationalIdRequests: number,
       landOwnershipRequests: number,
       totalNFTsOwned: number,           // On-chain
       nationalIdNFTsOwned: number,      // On-chain
       landOwnershipNFTsOwned: number,   // On-chain
       recentRequests: Array<{...}>
     }
     ```

#### Implementation Details

**File**: `server/src/controllers/stats.controller.ts`

- Uses `viem` public client to read from Base Sepolia
- Reads contract ABIs for NationalIdNFT and LandOwnershipNFT
- Calls `totalSupply()` for global stats
- Calls `balanceOf(address)` for user stats
- Aggregates MongoDB data with Promise.all for performance
- Comprehensive error handling with fallbacks

**File**: `server/src/routes/stats.route.ts`

- Simple router with two endpoints
- Registered at `/api/stats`

**Updated**: `server/src/index.ts`

- Added stats routes registration
- Routes available: `/api/stats/global` and `/api/stats/user/:walletAddress`

### 🎨 Frontend Integration

#### User Dashboard (`/home`)

**Updated**: `client/app/(user)/home/page.tsx`

**Changes**:

- Fetches user stats on mount when wallet is connected
- Displays real NFT count from blockchain (not just requests)
- Shows pending, approved, rejected request counts
- Generates activity timeline based on user data
- Maps recent requests from backend to UI format
- Loading states while fetching data
- Graceful fallback if API fails

**Stats Displayed**:

- **NFT Documents**: Total NFTs owned on-chain
- **Pending Requests**: Awaiting admin approval
- **Approved**: Ready to mint
- **Rejected**: Declined requests

**Recent Activity**:

- Dynamic messages based on actual user data
- Shows approved requests ready to mint
- Shows pending requests awaiting approval
- Shows total NFTs owned on blockchain

#### Admin Dashboard (`/admin`)

**Updated**: `client/app/(admin)/admin/page.tsx`

**Changes**:

- Uses `/api/stats/global` endpoint instead of `/api/admin/stats`
- Displays on-chain NFT totals (real minted count)
- Shows approval and rejection rates
- Breakdown of National ID vs Land Ownership requests
- All stats cards show real-time data

**Stats Displayed**:

1. **Total Users** - Unique wallet addresses
2. **Pending Requests** - Awaiting approval
3. **Approved Verifications** - Verified requests
4. **Rejected Verifications** - Declined requests
5. **Total NFTs Minted** - On-chain count with breakdown

**Additional Context**:

- Approval rate percentage
- Total requests count
- National ID vs Land title breakdown
- Rejection rate percentage

### 📚 Helper Utilities

**Created**: `client/lib/stats.ts`

Type-safe helper functions:

```typescript
fetchGlobalStats(): Promise<GlobalStats | null>
fetchUserStats(walletAddress: string): Promise<UserStats | null>
```

Includes TypeScript interfaces for all stats objects.

## Smart Contract Integration

### Contracts Used

**Base Sepolia Addresses** (from `.env`):

- **NationalIdNFT**: `0x57c236c2097c49c6f3c998b2fcf07f67596dc5f4`
- **LandOwnershipNFT**: `0x7d59c36de7c8825b55c73038fa6bcfd52f903c7a`

### On-Chain Functions Called

1. **totalSupply()** - ERC-721 extension

   - Returns total number of minted NFTs
   - Used in global stats

2. **balanceOf(address)** - ERC-721 standard
   - Returns NFT count for specific address
   - Used in user stats

### RPC Configuration

**Added to `.env`**:

```env
BLOCKCHAIN_RPC_URL=https://sepolia.base.org
```

Public RPC endpoint for Base Sepolia testnet.

## Data Flow

### User Dashboard Flow

```
User connects wallet
     ↓
Frontend calls /api/stats/user/:address
     ↓
Backend queries MongoDB for requests
     ↓
Backend calls NFT contracts via viem
     ↓
Backend aggregates data
     ↓
Frontend displays real-time stats
```

### Admin Dashboard Flow

```
Admin loads dashboard
     ↓
Frontend calls /api/stats/global
     ↓
Backend aggregates all MongoDB data
     ↓
Backend reads totalSupply from both NFT contracts
     ↓
Backend calculates rates and breakdowns
     ↓
Frontend displays comprehensive system stats
```

## Performance Optimizations

1. **Parallel Queries**: Using `Promise.all()` for MongoDB aggregations
2. **Error Isolation**: On-chain failures don't break database stats
3. **Fallback Data**: UI shows fallback values if API fails
4. **Minimal RPC Calls**: Only calls necessary contract functions
5. **Type Safety**: Full TypeScript coverage prevents runtime errors

## Error Handling

### Backend

- Try-catch blocks for blockchain calls
- Separate error handling for each contract
- Continues with partial data if one source fails
- Logs errors for debugging

### Frontend

- Graceful degradation if API unavailable
- Loading states during fetch
- Empty states for no data
- User-friendly error messages

## Environment Variables Required

### Backend (`server/.env`)

```env
MONGO_URI=...
BLOCKCHAIN_RPC_URL=https://sepolia.base.org
NATIONAL_ID_NFT_ADDRESS=0x57c236c2097c49c6f3c998b2fcf07f67596dc5f4
LAND_OWNERSHIP_NFT_ADDRESS=0x7d59c36de7c8825b55c73038fa6bcfd52f903c7a
```

### Frontend (`client/.env`)

```env
NEXT_PUBLIC_BE_URL=http://localhost:6969
NEXT_PUBLIC_SERVER_URL=http://localhost:6969
```

## Testing the Integration

### 1. Test Global Stats

```bash
curl http://localhost:6969/api/stats/global
```

Expected response includes both database and on-chain data.

### 2. Test User Stats

```bash
curl http://localhost:6969/api/stats/user/0xYourWalletAddress
```

Should show user's requests and on-chain NFT balance.

### 3. Test User Dashboard

1. Connect wallet on `/home`
2. Stats should populate from backend
3. Should show your actual NFT count

### 4. Test Admin Dashboard

1. Navigate to `/admin`
2. Stats should show real system data
3. "Total NFTs Minted" should match on-chain totalSupply

## Key Differences from Mock Data

### Before (Mock)

- Hardcoded numbers
- No real-time updates
- No blockchain integration
- Static percentages

### After (Real)

- Live database queries
- On-chain NFT counts
- Dynamic approval/rejection rates
- User-specific data
- Real-time accuracy

## Future Enhancements

- [ ] Cache stats with TTL to reduce DB/RPC load
- [ ] Add historical trending data
- [ ] WebSocket for real-time updates
- [ ] Export stats as CSV/PDF
- [ ] Add date range filters
- [ ] Show minting activity timeline
- [ ] Add contract event listeners for instant updates
- [ ] Implement analytics dashboard with charts

## Files Modified/Created

### Backend

- ✅ `server/src/controllers/stats.controller.ts` (NEW)
- ✅ `server/src/routes/stats.route.ts` (NEW)
- ✅ `server/src/index.ts` (updated - registered stats routes)
- ✅ `server/.env` (updated - added BLOCKCHAIN_RPC_URL)

### Frontend

- ✅ `client/app/(user)/home/page.tsx` (updated - real user stats)
- ✅ `client/app/(admin)/admin/page.tsx` (updated - real global stats)
- ✅ `client/lib/stats.ts` (NEW - helper functions)

## Summary

✅ Both dashboards now show **real-time data**  
✅ Integration with **Base Sepolia blockchain**  
✅ Reads actual **minted NFT counts**  
✅ Combines **database + on-chain** sources  
✅ **Type-safe** implementation  
✅ **Error handling** and fallbacks  
✅ **User-specific** and **global** statistics

The statistics system is now fully functional and production-ready! 🚀
