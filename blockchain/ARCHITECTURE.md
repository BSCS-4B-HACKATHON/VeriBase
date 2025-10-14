# ProofNFT System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ProofNFT System                             │
│                                                                     │
│  User Documents → Server → Blockchain → Verification               │
└─────────────────────────────────────────────────────────────────────┘
```

## Detailed Flow

```
┌──────────────┐
│   User       │
│   Wallet     │
└──────┬───────┘
       │
       │ 1. Upload Document
       ↓
┌──────────────────────────────────────┐
│         Server/Backend               │
│                                      │
│  ┌────────────────────────────┐    │
│  │  Document Verification     │    │
│  │  - Validate format         │    │
│  │  - Check authenticity      │    │
│  │  - Encrypt & store IPFS    │    │
│  └────────────────────────────┘    │
│                ↓                    │
│  ┌────────────────────────────┐    │
│  │  Generate Hash             │    │
│  │                            │    │
│  │  data = {                  │    │
│  │    userId: "0x...",        │    │
│  │    cid: "QmHash...",       │    │
│  │    timestamp: 1697...      │    │
│  │  }                         │    │
│  │                            │    │
│  │  salted = data + salt +    │    │
│  │           userAddress      │    │
│  │                            │    │
│  │  hash = keccak256(salted)  │    │
│  └────────────────────────────┘    │
│                ↓                    │
│  ┌────────────────────────────┐    │
│  │  Database Record           │    │
│  │                            │    │
│  │  Request: {                │    │
│  │    id: "req_001",          │    │
│  │    wallet: "0x...",        │    │
│  │    status: "verified",     │    │
│  │    files: [...],           │    │
│  │    hash: "0xabc..."        │    │
│  │  }                         │    │
│  └────────────────────────────┘    │
└──────────┬───────────────────────────┘
           │
           │ 2. Batch Export
           ↓
┌──────────────────────────────────────┐
│    Minting Script                    │
│    (mintFromServerModel.ts)          │
│                                      │
│  - Load verified requests            │
│  - Group by wallet address           │
│  - Prepare batch arrays              │
└──────────┬───────────────────────────┘
           │
           │ 3. Batch Mint Transaction
           ↓
┌──────────────────────────────────────────────────────────┐
│              Blockchain (ProofNFT Contract)              │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  ownerBatchMintTo([recipients], [hashes])      │    │
│  │                                                 │    │
│  │  For each (recipient, hash):                   │    │
│  │    ✓ Check hash != 0                           │    │
│  │    ✓ Check hash not exists                     │    │
│  │    ✓ Mint ERC-721 token                        │    │
│  │    ✓ Store hash → tokenId mapping              │    │
│  │    ✓ Mark hash as exists                       │    │
│  │    ✓ Emit ProofMinted event                    │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Storage:                                                │
│  ┌──────────────────────────────────────────────┐      │
│  │  _tokenHashes[tokenId] = bytes32 hash        │      │
│  │  _hashExists[hash] = true                    │      │
│  │  _owners[tokenId] = userAddress              │      │
│  │  _balances[userAddress] += 1                 │      │
│  └──────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────┘
           │
           │ 4. Token in Wallet
           ↓
┌──────────────────────────────────────┐
│   User Wallet                        │
│                                      │
│   ┌──────────────────────────┐      │
│   │  ProofNFT #1             │      │
│   │  Hash: 0xabc...          │      │
│   │  Type: National ID       │      │
│   └──────────────────────────┘      │
│   ┌──────────────────────────┐      │
│   │  ProofNFT #2             │      │
│   │  Hash: 0xdef...          │      │
│   │  Type: Passport          │      │
│   └──────────────────────────┘      │
└──────────────────────────────────────┘
```

## Verification Flow

```
┌──────────────┐
│   Verifier   │
│  (Anyone)    │
└──────┬───────┘
       │
       │ 1. Request: Verify user owns document
       ↓
┌──────────────────────────────────────┐
│   Verification Request               │
│                                      │
│   {                                  │
│     userWallet: "0x123...",          │
│     tokenId: 1,                      │
│     plainData: { /* document */ }    │
│   }                                  │
└──────────┬───────────────────────────┘
           │
           │ 2. Call verifyProof()
           ↓
┌──────────────────────────────────────────────────────────┐
│              Blockchain (ProofNFT Contract)              │
│                                                          │
│  verifyProof(claimer, tokenId, plainData):               │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Step 1: Check token exists                    │    │
│  │  owner = _owners[tokenId]                      │    │
│  │  if owner == address(0) → return false         │    │
│  └────────────────────────────────────────────────┘    │
│                      ↓                                   │
│  ┌────────────────────────────────────────────────┐    │
│  │  Step 2: Check claimer owns token              │    │
│  │  if owner != claimer → return false            │    │
│  └────────────────────────────────────────────────┘    │
│                      ↓                                   │
│  ┌────────────────────────────────────────────────┐    │
│  │  Step 3: Verify hash matches                   │    │
│  │  computedHash = keccak256(plainData)           │    │
│  │  storedHash = _tokenHashes[tokenId]            │    │
│  │  if computedHash != storedHash → return false  │    │
│  └────────────────────────────────────────────────┘    │
│                      ↓                                   │
│                 return true ✅                           │
└──────────────────────────────────────────────────────────┘
           │
           │ 3. Verification Result
           ↓
┌──────────────────────────────────────┐
│   Response                           │
│                                      │
│   {                                  │
│     verified: true,                  │
│     message: "Proof verified!"       │
│   }                                  │
└──────────────────────────────────────┘
```

## Data Flow Diagram

```
Off-Chain (Private)                    On-Chain (Public)
═══════════════════                    ═════════════════

┌─────────────────┐
│ Raw Document    │
│ "National ID"   │
│ "John Doe"      │
│ "123-45-6789"   │
└────────┬────────┘
         │
         │ Hash with salt
         ↓
┌─────────────────┐                    
│ Salted Data     │                    
│ "ID:John:123..  │                    
│  :salt:0x123"   │                    
└────────┬────────┘
         │
         │ keccak256
         ↓
┌─────────────────┐                    ┌─────────────────┐
│ Hash            │ ─────Mint─────────→│ Token #1        │
│ 0xabc123def...  │                    │ Hash: 0xabc...  │
└─────────────────┘                    │ Owner: 0x123... │
                                       └─────────────────┘

Verification:
═════════════

User provides:                         Contract verifies:
- Token ID (1)                        - Token exists ✓
- Plain data                          - User owns token ✓
                                      - Hash matches ✓
         ↓
    keccak256                              ↓
         ↓                            
┌─────────────────┐                   ┌─────────────────┐
│ Computed Hash   │ ────Compare──────→│ Stored Hash     │
│ 0xabc123def...  │      Equal?       │ 0xabc123def...  │
└─────────────────┘        ✓          └─────────────────┘
                           │
                           ↓
                      Proof Valid ✅
```

## Storage Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    ProofNFT Contract Storage                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ERC-721 Standard Storage:                                      │
│  ┌───────────────────────────────────────────────────────┐    │
│  │  _owners[tokenId] → address                           │    │
│  │  _balances[address] → uint256                         │    │
│  │  _tokenApprovals[tokenId] → address                   │    │
│  │  _operatorApprovals[owner][operator] → bool           │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  ProofNFT Custom Storage:                                       │
│  ┌───────────────────────────────────────────────────────┐    │
│  │  _tokenIdCounter → uint256                            │    │
│  │  _tokenHashes[tokenId] → bytes32                      │    │
│  │  _hashExists[bytes32] → bool                          │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  Example:                                                       │
│  ┌───────────────────────────────────────────────────────┐    │
│  │  Token #1                                             │    │
│  │  ├─ _owners[1] = 0x7099...79C8                        │    │
│  │  ├─ _tokenHashes[1] = 0xabc123...                     │    │
│  │  └─ _hashExists[0xabc123...] = true                   │    │
│  │                                                        │    │
│  │  Token #2                                             │    │
│  │  ├─ _owners[2] = 0x7099...79C8                        │    │
│  │  ├─ _tokenHashes[2] = 0xdef456...                     │    │
│  │  └─ _hashExists[0xdef456...] = true                   │    │
│  │                                                        │    │
│  │  User Balance:                                         │    │
│  │  └─ _balances[0x7099...79C8] = 2                      │    │
│  └───────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                        Trust Boundaries                         │
└─────────────────────────────────────────────────────────────────┘

Trusted:
┌──────────────────────┐
│  Contract Owner      │  ← Mints tokens (backend server)
│  (Backend Server)    │  ← Must verify users before minting
└──────────────────────┘  ← Should use HSM/multi-sig

Trustless:
┌──────────────────────┐
│  Blockchain          │  ← Immutable record
│  (Smart Contract)    │  ← Public verification
└──────────────────────┘  ← Enforces rules

Users:
┌──────────────────────┐
│  Token Holders       │  ← Prove ownership
│  (User Wallets)      │  ← Keep data private
└──────────────────────┘  ← Verify others' claims

═══════════════════════════════════════════════════════════════

Privacy Considerations:

Public (On-Chain):                  Private (Off-Chain):
- Hashes (bytes32)                  - Raw documents
- Wallet addresses                  - Personal data
- Token ownership                   - Salt values
- Transaction timing                - Preimages
- Mint patterns                     - Server database

═══════════════════════════════════════════════════════════════

Attack Vectors & Mitigations:

┌─────────────────────┐  ┌────────────────────────┐
│ Rainbow Table       │  │ Mitigation:            │
│ Attack              │→ │ - Salt all data        │
│                     │  │ - High entropy         │
└─────────────────────┘  │ - User-specific salt   │
                         └────────────────────────┘

┌─────────────────────┐  ┌────────────────────────┐
│ Owner Key           │  │ Mitigation:            │
│ Compromise          │→ │ - HSM storage          │
│                     │  │ - Multi-sig wallet     │
└─────────────────────┘  │ - Rate limiting        │
                         └────────────────────────┘

┌─────────────────────┐  ┌────────────────────────┐
│ Duplicate Hash      │  │ Mitigation:            │
│ Attack              │→ │ - hashExists mapping   │
│                     │  │ - Revert on duplicate  │
└─────────────────────┘  └────────────────────────┘
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                       System Components                         │
└─────────────────────────────────────────────────────────────────┘

Frontend (Client):
┌────────────────────────────┐
│  - Connect wallet          │
│  - Upload documents        │
│  - View owned tokens       │
│  - Verify proofs           │
└────────────┬───────────────┘
             │
             │ HTTP/WebSocket
             ↓
Backend (Server):
┌────────────────────────────┐
│  - Authenticate users      │
│  - Verify documents        │
│  - Store in database       │
│  - Trigger minting         │
│  - Provide verification    │
└────────────┬───────────────┘
             │
             │ ethers.js/viem
             ↓
Blockchain:
┌────────────────────────────┐
│  ProofNFT Contract         │
│  - Store hashes            │
│  - Manage ownership        │
│  - Verify proofs           │
│  - Emit events             │
└────────────┬───────────────┘
             │
             │ Read events
             ↓
Monitoring:
┌────────────────────────────┐
│  - Event listeners         │
│  - Alerting system         │
│  - Analytics dashboard     │
│  - Audit logs              │
└────────────────────────────┘
```

## Gas Cost Breakdown

```
Operation: ownerMintTo (Single)
═══════════════════════════════════════
Transaction Setup:         ~21,000 gas
ERC-721 Mint:             ~45,000 gas
Storage (hash):           ~20,000 gas
Storage (exists flag):     ~5,000 gas
Event emission:            ~2,000 gas
Validation logic:          ~2,000 gas
─────────────────────────────────────────
Total:                    ~95,000 gas

Operation: ownerBatchMintTo (10 tokens)
═══════════════════════════════════════
Transaction Setup:         ~21,000 gas
First mint:               ~70,000 gas
Additional mints (x9):   ~450,000 gas
Array processing:         ~25,000 gas
Events (x10):             ~20,000 gas
─────────────────────────────────────────
Total:                   ~586,000 gas
Per token:                ~58,600 gas (38% savings)

Operation: ownerBatchMintTo (50 tokens)
═══════════════════════════════════════
Total:                 ~2,500,000 gas
Per token:                ~50,000 gas (47% savings)
```

---

**Key Insights:**

1. **Off-chain data stays private** - Only hashes stored on-chain
2. **Server acts as gatekeeper** - Verifies before minting
3. **Users prove ownership** - Without revealing data
4. **Immutable record** - Blockchain provides permanence
5. **Gas efficient** - Batch operations save 38-47%
6. **Privacy-preserving** - With proper salting

---

**Architecture Pattern:** Hybrid (Off-chain storage + On-chain proof)

**Security Model:** Trust-minimized (Verify off-chain, prove on-chain)

**Privacy Level:** High (with salt), Medium (without salt)
