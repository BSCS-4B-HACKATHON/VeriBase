# 🚀 Implementation Checklist - User-Initiated NFT Minting

## Overview
Follow this checklist to implement the "Mint" button functionality that appears after admin verification.

---

## Phase 1: Backend Setup ✅ COMPLETE

- [x] **Smart Contract** (`blockchain/contracts/ProofNFT.sol`)
  - ERC-721 with hash storage
  - Owner-only minting
  - 18 passing tests

- [x] **Minting Script** (`blockchain/scripts/userMintNFT.ts`)
  - `mintNFTForUser()` function
  - Hash generation
  - Transaction handling

- [x] **Database Schema** (`server/src/models/DocMetaSchema.ts`)
  - `nftMinted?: boolean`
  - `nftTokenId?: number`
  - `nftTransactionHash?: string`
  - `nftMintedAt?: Date`

- [x] **API Controller** (`server/src/controllers/nft.controller.ts`)
  - `checkMintEligibility()` - GET /api/requests/:id/can-mint
  - `mintNFT()` - POST /api/requests/:id/mint
  - `getWalletRequests()` - GET /api/wallet/:address/requests

- [x] **API Routes** (`server/src/routes/nft.route.ts`)
  - Routes registered in `server/src/index.ts`

---

## Phase 2: Connect Blockchain to Server ⚠️ TODO

### Step 1: Update the Controller
File: `server/src/controllers/nft.controller.ts`

**Current Code (Mock):**
```typescript
// Simulated minting (replace with actual blockchain call)
const mockTokenId = Math.floor(Math.random() * 10000);
const mockTxHash = "0x" + "a".repeat(64);
```

**Replace With:**
```typescript
// Import at top of file
import { mintNFTForUser } from "../../../blockchain/scripts/userMintNFT";

// In mintNFT function, replace mock section:
const mintRequest = {
    _id: request._id.toString(),
    requestId: request.requestId,
    requestType: request.requestType,
    requesterWallet: request.requesterWallet,
    files: request.files,
};

const mintResult = await mintNFTForUser(mintRequest, userWalletAddress);

request.nftMinted = true;
request.nftTokenId = mintResult.tokenIds[0];
request.nftTransactionHash = mintResult.transactionHash;
request.nftMintedAt = new Date();
```

**Checklist:**
- [ ] Import `mintNFTForUser` function
- [ ] Replace mock minting code
- [ ] Update database with actual blockchain data
- [ ] Add error handling for blockchain failures

**📖 See:** `BLOCKCHAIN-INTEGRATION.md` for complete code

---

### Step 2: Environment Configuration
File: `blockchain/.env`

**Required Variables:**
```env
HARDHAT_NETWORK=localhost
PROOF_NFT_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
DEPLOYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Checklist:**
- [ ] Create `blockchain/.env` file
- [ ] Add Hardhat network setting
- [ ] Add contract address (from deployment)
- [ ] Add deployer private key (contract owner)

---

### Step 3: Deploy Contract
Commands:
```bash
# Terminal 1: Start Hardhat node
cd blockchain
npx hardhat node

# Terminal 2: Deploy contract
cd blockchain
npx hardhat run scripts/deployProofNFT.ts --network localhost
```

**Checklist:**
- [ ] Start Hardhat node
- [ ] Deploy ProofNFT contract
- [ ] Copy deployed address
- [ ] Update `PROOF_NFT_CONTRACT_ADDRESS` in `.env`

---

### Step 4: Test Backend Integration
```bash
# Start server
cd server
npm run dev

# Test mint endpoint (in another terminal)
curl -X POST http://localhost:6969/api/requests/REQ-123/mint \
  -H "Content-Type: application/json" \
  -d '{"userWalletAddress": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"}'
```

**Checklist:**
- [ ] Server starts without errors
- [ ] Can call mint endpoint
- [ ] Blockchain transaction executes
- [ ] Database updates with tokenId and txHash

---

## Phase 3: Frontend Implementation ⚠️ TODO

### Step 1: Create Mint Button Component
File: `client/components/mint-button.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MintButtonProps {
  requestId: string;
  status: 'pending' | 'verified' | 'rejected';
  nftMinted?: boolean;
  userWalletAddress?: string;
}

export function MintButton({ 
  requestId, 
  status, 
  nftMinted = false,
  userWalletAddress 
}: MintButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Determine button state
  let buttonText = 'View';
  let buttonAction = 'view';
  
  if (status === 'verified' && !nftMinted) {
    buttonText = 'Mint';
    buttonAction = 'mint';
  } else if (status === 'verified' && nftMinted) {
    buttonText = 'View NFT';
    buttonAction = 'viewNFT';
  }

  const handleMint = async () => {
    if (!userWalletAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(
        `http://localhost:6969/api/requests/${requestId}/mint`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userWalletAddress }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('NFT minted successfully!', {
          description: `Token ID: ${data.data.tokenId}`,
        });
        window.location.reload(); // Refresh to update button state
      } else {
        toast.error('Minting failed', {
          description: data.error,
        });
      }
    } catch (error) {
      toast.error('Minting failed', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (buttonAction === 'mint') {
      handleMint();
    } else if (buttonAction === 'viewNFT') {
      // Open blockchain explorer
      window.location.href = `/requests/${requestId}`;
    } else {
      // View request details
      window.location.href = `/requests/${requestId}`;
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={buttonAction === 'mint' ? 'default' : 'outline'}
    >
      {isLoading ? 'Processing...' : buttonText}
    </Button>
  );
}
```

**Checklist:**
- [ ] Create `mint-button.tsx` component
- [ ] Add button state logic (View/Mint/View NFT)
- [ ] Add API call to mint endpoint
- [ ] Add error handling and toast notifications
- [ ] Add loading state

**📖 See:** `FRONTEND-INTEGRATION.md` for complete examples

---

### Step 2: Update Request List/Card Component
File: `client/app/(user)/requests/page.tsx` (or wherever you display requests)

**Add the MintButton:**
```typescript
import { MintButton } from '@/components/mint-button';
import { useWallet } from '@/context/walletContext';

export default function RequestsPage() {
  const { address } = useWallet();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    // Fetch requests
    const fetchRequests = async () => {
      if (!address) return;
      
      const response = await fetch(
        `http://localhost:6969/api/wallet/${address}/requests`
      );
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data);
      }
    };

    fetchRequests();
  }, [address]);

  return (
    <div className="grid gap-4">
      {requests.map((request) => (
        <div key={request.requestId} className="border p-4 rounded">
          <h3>{request.requestType}</h3>
          <p>Status: {request.status}</p>
          
          <MintButton
            requestId={request.requestId}
            status={request.status}
            nftMinted={request.nftMinted}
            userWalletAddress={address}
          />
        </div>
      ))}
    </div>
  );
}
```

**Checklist:**
- [ ] Import MintButton component
- [ ] Use wallet context to get user address
- [ ] Fetch requests with mint status from API
- [ ] Pass correct props to MintButton
- [ ] Handle loading and error states

---

### Step 3: Test Frontend Flow

**Test Scenarios:**
1. **Pending Request**
   - [ ] Button shows "View"
   - [ ] Clicking button navigates to request details

2. **Verified Request (Not Minted)**
   - [ ] Button shows "Mint"
   - [ ] Button is enabled
   - [ ] Clicking button triggers minting
   - [ ] Success toast appears
   - [ ] Button changes to "View NFT" after refresh

3. **Verified Request (Already Minted)**
   - [ ] Button shows "View NFT"
   - [ ] Clicking button shows NFT details

4. **Error Handling**
   - [ ] No wallet connected → Shows error toast
   - [ ] Request already minted → Shows error toast
   - [ ] Network error → Shows error toast

---

## Phase 4: Testing & Validation ⚠️ TODO

### Unit Tests
- [ ] Test `mintNFTForUser()` function
- [ ] Test API endpoints with Postman/curl
- [ ] Test database updates

### Integration Tests
- [ ] End-to-end flow: Create → Verify → Mint
- [ ] Test with multiple users
- [ ] Test concurrent minting requests
- [ ] Test error scenarios (already minted, wrong wallet, etc.)

### UI Tests
- [ ] Button state changes correctly
- [ ] Loading states work
- [ ] Error messages display
- [ ] Success messages display

---

## Phase 5: Production Preparation ⚠️ TODO

### Security
- [ ] Add authentication middleware
- [ ] Validate wallet ownership
- [ ] Implement rate limiting
- [ ] Add transaction retry logic
- [ ] Add gas estimation

### Monitoring
- [ ] Add error logging (Sentry)
- [ ] Add analytics tracking
- [ ] Add transaction monitoring
- [ ] Add alert system for failed mints

### Documentation
- [ ] Update API documentation
- [ ] Create user guide
- [ ] Document error codes
- [ ] Create troubleshooting guide

### Deployment
- [ ] Deploy contract to testnet
- [ ] Test with testnet funds
- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Update environment variables

---

## Quick Reference

### API Endpoints
```
GET  /api/requests/:requestId/can-mint     # Check mint eligibility
POST /api/requests/:requestId/mint         # Mint NFT
GET  /api/wallet/:address/requests         # Get all requests
```

### Button States
```
pending   + any          → [View]
rejected  + any          → [View]
verified  + !nftMinted   → [Mint]     ⭐ NEW
verified  + nftMinted    → [View NFT]
```

### File Locations
```
Backend:
  server/src/controllers/nft.controller.ts
  server/src/routes/nft.route.ts
  server/src/models/DocMetaSchema.ts

Blockchain:
  blockchain/scripts/userMintNFT.ts
  blockchain/contracts/ProofNFT.sol

Frontend:
  client/components/mint-button.tsx
  client/app/(user)/requests/page.tsx
```

---

## Need Help?

### Documentation
- 📄 `IMPLEMENTATION-SUMMARY.md` - System overview
- 📄 `BLOCKCHAIN-INTEGRATION.md` - Connect blockchain to server
- 📄 `FRONTEND-INTEGRATION.md` - Frontend implementation
- 📄 `README-PROOFNFT.md` - Smart contract documentation
- 📄 `SECURITY.md` - Security analysis

### Common Issues
1. **Contract not found** → Deploy contract and update `.env`
2. **Request not verified** → Admin must verify first
3. **Wallet mismatch** → Use correct wallet address
4. **Already minted** → Check `nftMinted` field before showing button

---

## Summary

✅ **Phase 1: Backend Setup** - COMPLETE
- Smart contract deployed and tested
- API endpoints created
- Database schema updated

⚠️ **Phase 2: Connect Blockchain** - TODO NEXT
- Update controller with actual blockchain calls
- Test integration

⚠️ **Phase 3: Frontend** - TODO
- Create MintButton component
- Update request list page
- Test user flow

⚠️ **Phase 4: Testing** - TODO
- Unit tests
- Integration tests
- UI tests

⚠️ **Phase 5: Production** - TODO
- Security hardening
- Monitoring setup
- Deployment

---

## Next Action

**Start with Phase 2, Step 1:**
Update `server/src/controllers/nft.controller.ts` to use actual blockchain minting instead of mock data.

See `BLOCKCHAIN-INTEGRATION.md` for the exact code to use! 🚀
