# ⚡ Quick Reference Card - NFT Minting System

## 🎯 At a Glance

**What:** User-initiated NFT minting system  
**How:** User clicks [Mint] button after admin verification  
**Status:** Backend complete, frontend TODO  

---

## 🔄 User Flow

```
Request Created → [View] button
     ↓
Admin Verifies → [Mint] button ⭐
     ↓
User Clicks Mint → NFT created on blockchain
     ↓
Database Updated → [View NFT] button
```

---

## 🎨 Button States

| Status | NFT Minted | Button |
|--------|------------|--------|
| `pending` | - | `[View]` |
| `rejected` | - | `[View]` |
| `verified` | ❌ | `[Mint]` ⭐ |
| `verified` | ✅ | `[View NFT]` |

---

## 🌐 API Endpoints

```bash
# Check if user can mint
GET /api/requests/:requestId/can-mint
→ Returns: { canMint, buttonText, buttonAction }

# Mint NFT (user-initiated)
POST /api/requests/:requestId/mint
Body: { userWalletAddress: "0x..." }
→ Returns: { tokenId, transactionHash }

# Get all user requests with mint status
GET /api/wallet/:address/requests
→ Returns: [{ requestId, status, canMint, buttonText, ... }]
```

---

## 📁 Key Files

```
DOCS:
  START-HERE.md ────────────────────────── Read first
  IMPLEMENTATION-CHECKLIST.md ─────────── Follow this

BACKEND:
  server/src/controllers/nft.controller.ts ─ API endpoints ⭐
  blockchain/scripts/userMintNFT.ts ──────── Blockchain minting ⭐
  server/src/models/DocMetaSchema.ts ─────── Database schema

FRONTEND (TODO):
  client/components/mint-button.tsx ──────── Create this
  client/app/(user)/requests/page.tsx ────── Update this
```

---

## ✅ What's Done

- [x] Smart contract (ProofNFT.sol)
- [x] 18 passing tests
- [x] User minting script (userMintNFT.ts)
- [x] API endpoints (nft.controller.ts)
- [x] Database schema (NFT fields)
- [x] Documentation (15 files)

---

## ⚠️ What's Next

### Phase 2: Connect Blockchain (NEXT)
1. Update `server/src/controllers/nft.controller.ts`
   - Import `mintNFTForUser` function
   - Replace mock minting with blockchain call
2. Deploy contract: `npx hardhat run scripts/deployProofNFT.ts`
3. Update `.env` with contract address

📖 **Full guide:** `BLOCKCHAIN-INTEGRATION.md`

### Phase 3: Build Frontend
1. Create `client/components/mint-button.tsx`
   - Dynamic button text (View/Mint/View NFT)
   - API call to mint endpoint
   - Loading/error/success states
2. Update `client/app/(user)/requests/page.tsx`
   - Import MintButton
   - Fetch requests from API
   - Pass wallet address

📖 **Full guide:** `FRONTEND-INTEGRATION.md`

---

## 🧪 Quick Test Commands

```bash
# Deploy contract
cd blockchain
npx hardhat run scripts/deployProofNFT.ts --network localhost

# Create request
curl -X POST http://localhost:6969/api/requests \
  -H "Content-Type: application/json" \
  -d '{"requestType":"national_id","requesterWallet":"0x...","files":[...]}'

# Verify request (admin)
curl -X PATCH http://localhost:6969/api/requests/REQ-123/status \
  -d '{"status":"verified"}'

# Check mint eligibility
curl http://localhost:6969/api/requests/REQ-123/can-mint

# Mint NFT (user)
curl -X POST http://localhost:6969/api/requests/REQ-123/mint \
  -d '{"userWalletAddress":"0x..."}'
```

---

## 🔍 Debugging Checklist

**Contract not found:**
- [ ] Hardhat node running?
- [ ] Contract deployed?
- [ ] `.env` has correct address?

**Request not verified:**
- [ ] Admin changed status to "verified"?
- [ ] Database updated?

**Minting fails:**
- [ ] Request status = "verified"?
- [ ] nftMinted = false?
- [ ] Wallet matches requester?
- [ ] Backend wallet has permissions?

---

## 📞 Get Help

| Issue | Where to Look |
|-------|---------------|
| System overview | `START-HERE.md` |
| Implementation steps | `IMPLEMENTATION-CHECKLIST.md` |
| Visual diagrams | `VISUAL-FLOW-DIAGRAM.md` |
| Backend integration | `BLOCKCHAIN-INTEGRATION.md` |
| Frontend code | `FRONTEND-INTEGRATION.md` |
| Contract details | `README-PROOFNFT.md` |
| Security | `SECURITY.md` |
| File locations | `FILE-INVENTORY.md` |

---

## 🚀 Start Now

```bash
# 1. Read documentation
open START-HERE.md

# 2. Follow checklist
open IMPLEMENTATION-CHECKLIST.md

# 3. Start implementation
# → Phase 2: Connect blockchain to server
# → See BLOCKCHAIN-INTEGRATION.md for code
```

---

## 💡 Remember

- **Backend pays gas fees**, not users
- **Owner-only minting** enforced by contract
- **User initiates** by clicking button
- **Server executes** blockchain transaction
- **Database tracks** minting status

---

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** Backend Complete, Frontend TODO  
**Next Action:** Phase 2 - Connect Blockchain Integration
