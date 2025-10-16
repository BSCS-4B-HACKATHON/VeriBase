# 🎯 Client-Side Minting - Decentralized Approach

## What Changed?

### ❌ Old Approach (Centralized - REMOVED)

- **Server mints NFTs** using admin private key
- **Admin pays gas fees** for all mints
- Users just click "Mint" and wait
- Centralized, requires admin wallet to be funded
- Admin wallet security risk

### ✅ New Approach (Decentralized - IMPLEMENTED)

- **Users mint their own NFTs** from their wallet
- **Users pay their own gas fees**
- Truly decentralized - no admin key needed for minting!
- Users sign the transaction themselves
- No security risk for admin wallet

## How It Works Now

### User Flow

1. **Admin approves request** (status → "verified")
2. **User sees "Mint NFT" button** on their request card
3. **User clicks "Mint NFT"**
   - Wallet popup appears (MetaMask/Coinbase)
   - User sees gas fee estimate
   - User confirms transaction
   - User pays gas fee from their wallet
4. **Transaction sent to blockchain**
   - NFT minted directly on Base Sepolia
   - Transaction hash generated
5. **Success!**
   - Toast notification with token ID
   - Link to view on BaseScan explorer
   - Request removed from database (data now on blockchain)

## New Hook: `useClientMint`

**File**: `client/hooks/useClientMint.ts`

```typescript
const { mintNFT, isMinting, error } = useClientMint();

// Mint NFT
const result = await mintNFT({
  requestId: "req_123",
  requestType: "national_id", // or 'land_ownership'
  metadataURI: "ipfs://Qm...", // IPFS CID or metadata URL
});

if (result.success) {
  console.log("Token ID:", result.tokenId);
  console.log("TX Hash:", result.transactionHash);
  console.log("Explorer:", result.explorerUrl);
}
```

### Features:

- ✅ Direct contract interaction via viem
- ✅ User signs transaction
- ✅ Automatic gas estimation
- ✅ Transaction confirmation
- ✅ Token ID extraction from events
- ✅ Error handling (rejected tx, insufficient funds, etc.)

## New Hook: `useUserNFTs`

**File**: `client/hooks/useUserNFTs.ts`

Fetches user's NFTs from blockchain - **NO MOCK DATA!**

```typescript
const { nfts, isLoading, refetch } = useUserNFTs();

// nfts = actual NFTs owned by connected wallet
// Reads from NationalIdNFT and LandOwnershipNFT contracts
```

### Features:

- ✅ Reads `balanceOf(address)` from contracts
- ✅ Fetches token IDs via `tokenOfOwnerByIndex`
- ✅ Gets metadata URI via `tokenURI`
- ✅ Real-time blockchain data
- ✅ No dummy/mock data

## Updated Components

### RequestCard

**File**: `client/components/request-card.tsx`

- Uses `useClientMint()` hook
- "Mint NFT" button triggers wallet signature
- Shows loading during minting
- Handles errors gracefully
- Displays success with explorer link

### NFTs Page

**File**: `client/app/(user)/nfts/page.tsx`

- Uses `useUserNFTs()` hook
- Displays actual NFTs from blockchain
- Refresh button refetches from chain
- No more mock data!

## Environment Variables

### Client `.env`

```env
# Already set in your .env:
NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS=0x57c236c2097c49c6f3c998b2fcf07f67596dc5f4
NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS=0x7d59c36de7c8825b55c73038fa6bcfd52f903c7a
```

## Smart Contract Functions Called

### Minting

```solidity
function safeMint(address to, string memory uri) public
```

- Called by **user's wallet**
- User pays gas
- Returns tokenId in Transfer event

### Reading NFTs

```solidity
function balanceOf(address owner) public view returns (uint256)
function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)
function tokenURI(uint256 tokenId) public view returns (string memory)
```

## Gas Fees

- **Minting Cost**: ~0.0001-0.0005 ETH on Base Sepolia (testnet)
- **Paid by**: User (from their connected wallet)
- **Network**: Base Sepolia (testnet - free ETH from faucet)

### Get Test ETH

Users need Base Sepolia ETH for gas:

- Coinbase Faucet: https://www.coinbase.com/faucets/base-sepolia-faucet
- Alchemy Faucet: https://www.alchemy.com/faucets/base-sepolia

## Benefits

### Security

- ✅ No admin private key exposure
- ✅ No central wallet to fund/manage
- ✅ Users control their own transactions

### Decentralization

- ✅ True peer-to-peer minting
- ✅ No intermediary server
- ✅ Direct blockchain interaction

### User Experience

- ✅ Users see exactly what they're signing
- ✅ Transparent gas fees
- ✅ Immediate transaction confirmation
- ✅ Explorer links for verification

### Cost

- ✅ Admin doesn't pay for gas
- ✅ Users pay their own fees
- ✅ Sustainable model for production

## Admin Role Now

Admin is **only** for approval:

1. Reviews verification requests
2. Approves or rejects
3. **That's it!** No minting involved

Users handle the minting themselves after approval.

## Testing

### 1. Get Test ETH

```
Visit: https://www.coinbase.com/faucets/base-sepolia-faucet
Enter your wallet address
Receive test ETH
```

### 2. Create Request

- Go to `/requests/new`
- Upload documents
- Submit request

### 3. Admin Approves

- Admin logs into `/admin`
- Finds pending request
- Clicks "Approve"

### 4. User Mints

- User sees "Mint NFT" button on `/requests`
- Clicks button
- **Wallet popup appears**
- Confirms transaction
- Pays gas fee
- NFT minted! 🎉

### 5. View NFT

- Go to `/nfts`
- See your minted NFT (from blockchain!)
- Click to view on BaseScan

## Migration Notes

### Removed:

- ❌ Server-side minting controller logic
- ❌ `ADMIN_PRIVATE_KEY` requirement for minting
- ❌ `mintNFT` helper in `client/lib/helpers.ts`
- ❌ Mock NFT data in `/nfts` page

### Added:

- ✅ `client/hooks/useClientMint.ts`
- ✅ `client/hooks/useUserNFTs.ts`
- ✅ Client-side transaction handling
- ✅ Real blockchain data fetching

### Changed:

- ✅ RequestCard now uses `useClientMint`
- ✅ NFTs page now uses `useUserNFTs`
- ✅ Removed all dummy/mock data

## Backend Changes Needed

The backend **mint endpoint can be removed** or simplified to just:

- Delete request from DB after user mints
- Track minting events (optional)
- No more actual minting logic

The blockchain minting happens entirely client-side now!

## Summary

### Before:

```
User → Backend → Admin Wallet → Blockchain
       (Admin pays gas)
```

### After:

```
User → Wallet → Blockchain
     (User pays gas)
```

**Much better!** ✨

- Decentralized ✅
- Secure ✅
- User-controlled ✅
- No admin gas fees ✅
- No admin private key risk ✅

---

**Questions?** Check:

- `client/hooks/useClientMint.ts` - Minting logic
- `client/hooks/useUserNFTs.ts` - NFT fetching
- `client/components/request-card.tsx` - UI integration
