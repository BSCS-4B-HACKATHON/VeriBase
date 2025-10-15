# NFT Contracts - National ID & Land Ownership

This directory contains two separate NFT smart contracts for identity and land ownership verification.

## Contracts Overview

### 1. NationalIdNFT.sol

**Purpose:** Soul-bound NFT representing national identity verification

**Key Features:**

- ✅ One NFT per wallet maximum (soul-bound identity)
- ❌ Non-transferable (cannot be sent to another wallet)
- ❌ Cannot be approved or listed for sale
- 📦 Stores encrypted metadata matching DB schema
- 🔒 Only mintable by contract owner (backend server)

**Use Cases:**

- Digital identity verification
- KYC compliance
- Age verification
- Citizenship proof

### 2. LandOwnershipNFT.sol

**Purpose:** NFT representing land/property ownership with controlled transfers

**Key Features:**

- ✅ Multiple NFTs per wallet allowed
- ✅ Transferable ONLY through authorized transfer contract
- ❌ Cannot be transferred directly wallet-to-wallet
- 📦 Stores encrypted metadata matching DB schema
- 🔒 Only mintable by contract owner (backend server)

**Use Cases:**

- Land title registration
- Property ownership proof
- Regulated property transfers
- Real estate transactions

## Contract Architecture

### Metadata Structure

Both contracts store the same metadata structure from your database:

```solidity
struct DocMeta {
    string cid;              // IPFS CID
    string filename;         // Original filename
    string mime;             // MIME type
    uint256 size;            // File size in bytes
    string iv;               // Initialization vector (encrypted)
    string ciphertextHash;   // Hash of encrypted content
    string tag;              // Authentication tag
}

struct Metadata {
    string requestType;           // "national_id" or "land_ownership"
    string minimalPublicLabel;    // Public identifier
    string metadataCid;           // IPFS CID for full metadata
    string metadataHash;          // Hash of metadata
    string uploaderSignature;     // Server signature
    DocMeta[] files;              // Array of encrypted files
    string consentTextVersion;    // Consent version
    uint256 consentTimestamp;     // Consent timestamp
}
```

**Note:** The following fields are NOT stored on-chain:

- `requesterWallet` - Already known (token owner)
- `requestId` - Not needed on-chain
- `status` - Handled by backend

### Transfer Logic

#### NationalIdNFT (Soul-Bound)

```solidity
// Transfers are completely blocked
function _update() internal override {
    if (from != address(0) && to != address(0)) {
        revert TransferNotAllowed();
    }
    return super._update(to, tokenId, auth);
}
```

#### LandOwnershipNFT (Controlled Transfer)

```solidity
// Only transfer contract can facilitate transfers
function authorizedTransfer(address from, address to, uint256 tokenId) external {
    require(msg.sender == transferContract, "Unauthorized");
    _transfer(from, to, tokenId);
}
```

## Deployment

### Prerequisites

```bash
cd blockchain
npm install
```

### Deploy to Base Sepolia

```bash
# Set your private key in .env
echo "BASE_SEPOLIA_PRIVATE_KEY=your_private_key" >> .env

# Deploy both contracts
npx hardhat run scripts/deployNFTs.ts --network baseSepolia
```

### Deploy to Local Network

```bash
# Start local node
npx hardhat node

# Deploy (in another terminal)
npx hardhat run scripts/deployNFTs.ts --network localhost
```

### Deployment Output

After deployment, contract addresses are saved to:

```
blockchain/deployments/nfts-{network}.json
```

Example:

```json
{
  "nationalIdNFT": "0x...",
  "landOwnershipNFT": "0x...",
  "deployer": "0x...",
  "network": "baseSepolia",
  "deployedAt": "2025-01-15T..."
}
```

## Usage Examples

### Minting National ID NFT

```typescript
// Server-side only
const nationalIdNFT = await hre.viem.getContractAt(
  "NationalIdNFT",
  "0x..." // deployed address
);

// Mint NFT
const tokenId = await nationalIdNFT.write.mintNationalId([
  userWallet, // address
  "national_id", // requestType
  "John Doe ID", // minimalPublicLabel
  "QmXYZ...", // metadataCid
  "0xabc123...", // metadataHash
  "0xdef456...", // uploaderSignature
  "consent_v1.0", // consentTextVersion
  BigInt(Date.now()), // consentTimestamp
]);

// Add files
await nationalIdNFT.write.addFileToToken([
  tokenId,
  "QmFile123", // cid
  "id_front.jpg", // filename
  "image/jpeg", // mime
  1024n, // size
  "iv_encrypted", // iv
  "hash_encrypted", // ciphertextHash
  "tag_encrypted", // tag
]);
```

### Minting Land Ownership NFT

```typescript
const landOwnershipNFT = await hre.viem.getContractAt(
  "LandOwnershipNFT",
  "0x..." // deployed address
);

// Mint NFT
const tokenId = await landOwnershipNFT.write.mintLandOwnership([
  userWallet,
  "land_ownership",
  "Property at 123 Main St",
  "QmProperty...",
  "0xhash...",
  "0xsig...",
  "consent_v1.0",
  BigInt(Date.now()),
]);

// Add files (deed, survey, etc.)
await landOwnershipNFT.write.addFileToToken([
  tokenId,
  "QmDeed123",
  "title_deed.pdf",
  "application/pdf",
  2048n,
  "iv...",
  "hash...",
  "tag...",
]);
```

### Transferring Land Ownership

First, deploy a transfer contract (future implementation):

```typescript
// Set the authorized transfer contract
await landOwnershipNFT.write.setTransferContract([transferContractAddress]);

// Only the transfer contract can now facilitate transfers
// Users cannot transfer directly wallet-to-wallet
```

### Querying NFTs

```typescript
// Check if wallet has National ID
const hasId = await nationalIdNFT.read.hasNationalId([wallet]);

// Get National ID token
const tokenId = await nationalIdNFT.read.getTokenIdByWallet([wallet]);

// Get all land tokens owned by wallet
const landTokens = await landOwnershipNFT.read.getTokensByWallet([wallet]);

// Get metadata
const metadata = await nationalIdNFT.read.getMetadata([tokenId]);
console.log(metadata.minimalPublicLabel);
console.log(metadata.files[0].filename);
```

## Security Considerations

### 1. Data Encryption

- ✅ All sensitive data is encrypted before storage
- ✅ Encryption happens off-chain (backend)
- ✅ Only encrypted ciphertext, IV, and tags are stored on-chain

### 2. Access Control

- ✅ Only contract owner (backend wallet) can mint
- ✅ Backend wallet must be properly secured (HSM, KMS, etc.)
- ✅ Consider using multi-sig for production

### 3. Privacy

- ⚠️ Blockchain data is public
- ✅ Encrypted fields cannot be read without decryption keys
- ✅ Only minimal public labels are readable
- ⚠️ Wallet addresses are public (identity linkable)

### 4. Transfer Control

- ✅ National ID cannot be transferred (soul-bound)
- ✅ Land ownership requires authorized contract
- ✅ Prevents unauthorized property transfers

## Testing

Run tests:

```bash
npx hardhat test
```

Run specific test:

```bash
npx hardhat test test/NationalIdNFT.ts
```

## Integration with Backend

### Server-side Minting Flow

1. **User submits verification request**

   ```typescript
   // POST /api/requests
   { requestType, files, consent, ... }
   ```

2. **Backend encrypts and uploads to IPFS**

   ```typescript
   const encrypted = await encryptFiles(files);
   const cid = await ipfs.upload(encrypted);
   ```

3. **Admin approves request**

   ```typescript
   // PATCH /api/requests/:id/approve
   {
     status: "verified";
   }
   ```

4. **Backend mints NFT**

   ```typescript
   if (requestType === "national_id") {
     await nationalIdNFT.mintNationalId([...]);
   } else {
     await landOwnershipNFT.mintLandOwnership([...]);
   }
   ```

5. **Update database with tokenId**
   ```typescript
   await db.requests.update({
     _id: requestId,
     tokenId: result.tokenId,
     txHash: result.hash,
   });
   ```

### Environment Variables

Add to your `.env`:

```bash
# Contract Addresses (after deployment)
NATIONAL_ID_NFT_ADDRESS=0x...
LAND_OWNERSHIP_NFT_ADDRESS=0x...

# Backend wallet (has owner role)
BACKEND_WALLET_PRIVATE_KEY=0x...

# RPC
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

## Recommendations

### National ID NFT

✅ **Current Design is Good**

- Soul-bound (non-transferable) is perfect for identity
- One per wallet prevents duplicate identities
- Cannot be sold or transferred = cannot be stolen/sold

### Land Ownership NFT

⚠️ **Consider Your Use Case**

**Option 1: Authorized Contract Transfer (Current)**

- ✅ Regulated transfers through smart contract
- ✅ Can implement escrow, payment, legal checks
- ✅ Prevents unauthorized transfers
- ❌ Requires additional transfer contract
- ✅ **Recommended for real estate/legal compliance**

**Option 2: Standard ERC721 Transfer**

- ✅ Simple wallet-to-wallet transfers
- ✅ Compatible with all NFT marketplaces
- ✅ No additional contracts needed
- ❌ No transfer controls or regulations
- ⚠️ **Only if you want marketplace compatibility**

**Recommendation:** Stick with Option 1 (current design) if you need:

- Escrow functionality
- Payment processing
- Legal compliance checks
- Government oversight
- Transfer history/audit trail

## Next Steps

1. ✅ Deploy contracts to Base Sepolia
2. ✅ Update frontend to use new contract addresses
3. ✅ Update backend minting logic to use correct contract
4. ⏳ Implement transfer contract for land ownership (if needed)
5. ⏳ Add contract verification on Basescan
6. ⏳ Set up contract monitoring and alerts

## Contract Addresses

### Base Sepolia Testnet

- NationalIdNFT: `TBD` (deploy first)
- LandOwnershipNFT: `TBD` (deploy first)

### Base Mainnet (Production)

- NationalIdNFT: `TBD` (when ready)
- LandOwnershipNFT: `TBD` (when ready)

## Support

For questions or issues:

1. Check the contract source code
2. Review test files for usage examples
3. Check deployment scripts
4. Review this README

## License

MIT
