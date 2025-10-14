# ProofNFT - Document Proof System

An ERC-721 NFT implementation for storing cryptographic proofs of off-chain document ownership. Each token represents a keccak256 hash of user data, enabling privacy-preserving verification without exposing sensitive information on-chain.

---

## 🎯 Overview

**ProofNFT** enables users to prove ownership of documents without revealing the actual data on-chain. The system stores only cryptographic hashes (bytes32) on the blockchain while maintaining the ability to verify ownership through zero-knowledge-style verification.

### Key Features

- ✅ **ERC-721 Compliant**: Standard NFT interface for compatibility
- 🔐 **Hash-Only Storage**: Only keccak256 hashes stored on-chain
- 🚀 **Batch Minting**: Gas-efficient batch operations for server-side minting
- 🔍 **Proof Verification**: Verify data ownership without exposing data
- 🛡️ **Duplicate Protection**: Prevents minting duplicate hashes
- 📊 **Server Integration**: Direct integration with backend user models
- 🎫 **Multi-Token Support**: Users can own multiple proof tokens

---

## 📁 Project Structure

```
blockchain/
├── contracts/
│   └── ProofNFT.sol              # Main ERC-721 contract
├── test/
│   └── ProofNFT.ts                # Comprehensive test suite
├── scripts/
│   ├── deployProofNFT.ts          # Deployment script
│   └── mintFromServerModel.ts     # Server model integration script
├── data/
│   └── userRequests.json          # Sample server data export
├── SECURITY.md                     # Security documentation
└── README-PROOFNFT.md             # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- Hardhat
- OpenZeppelin Contracts

### Installation

```bash
cd blockchain
npm install
```

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

Expected output:
```
  ProofNFT
    Deployment
      ✓ Should deploy with correct name and symbol
      ✓ Should set the deployer as owner
      ✓ Should start with zero total supply
    Single Minting
      ✓ Should mint a token with correct hash
      ✓ Should emit ProofMinted event
      ✓ Should allow multiple tokens per address
      ...
    Server Model Integration
      ✓ Should mint all tokens from server model
      ✓ Should batch mint all tokens efficiently
      ✓ Should verify proofs for all server model entries

  50 passing (2s)
```

---

## 🔧 Deployment

### Local Deployment

1. Start a local Hardhat node:
```bash
npx hardhat node
```

2. Deploy the contract (in a new terminal):
```bash
npx hardhat run scripts/deployProofNFT.ts --network localhost
```

3. Note the deployed contract address from the output:
```
🚀 Deploying ProofNFT Contract
============================================================

📋 Deployment Details:
   Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   Network: localhost

🔨 Deploying ProofNFT...
   ✅ ProofNFT deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Testnet Deployment (Sepolia)

1. Configure your `.env` file:
```bash
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY
SEPOLIA_PRIVATE_KEY=your-private-key-here
```

2. Deploy:
```bash
npx hardhat run scripts/deployProofNFT.ts --network sepolia
```

⚠️ **DO NOT DEPLOY TO MAINNET** without thorough security audit and testing.

---

## 🎫 Minting Tokens

### Option 1: Batch Mint from Server Model

1. Export your server data to JSON:
```typescript
// In your server code
import RequestModel from './models/DocMetaSchema';

const requests = await RequestModel.find({ status: 'verified' });
fs.writeFileSync(
  '../blockchain/data/userRequests.json',
  JSON.stringify(requests, null, 2)
);
```

2. Update contract address in `scripts/mintFromServerModel.ts`:
```typescript
const CONFIG = {
  contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Your deployed address
  // ... other config
};
```

3. Run the minting script:
```bash
export PROOF_NFT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
npx hardhat run scripts/mintFromServerModel.ts --network localhost
```

Expected output:
```
🚀 ProofNFT Batch Minting Script
============================================================

📋 Loading ProofNFT contract...
   Contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3
   Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   ✅ Ownership verified

📥 Loading server model...
   Found 3 requests

⚙️  Processing server model...
   Generated 6 proof entries
   For 3 unique wallets

📊 Minting Summary:
   0x70997970C51812dc3A010C7d01b50e0d17dc79C8: 2 tokens
   0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC: 1 tokens
   0x90F79bf6EB2c4f870365E785982E1f101E93b906: 3 tokens

🔨 Preparing batch mint...
   Minting 6 tokens in single batch...
   ✅ Transaction confirmed in block 2
   Gas used: 456789

✅ Final total supply: 6
   Minted: 6 new tokens

💾 Saving minting record...
   Record saved to: ../data/minting-record-1697234567890.json

============================================================
🎉 Batch minting completed successfully!
============================================================
```

### Option 2: Manual Minting (for testing)

```typescript
import hre from "hardhat";
import { keccak256, toBytes } from "viem";

// Get contract instance
const proofNFT = await hre.viem.getContractAt(
  "ProofNFT",
  "0x5FbDB2315678afecb367f032d93F642f64180aa3"
);

// Mint single token
const userData = "user_national_id_data";
const hash = keccak256(toBytes(userData));
await proofNFT.write.ownerMintTo([
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // user address
  hash
]);

// Batch mint
const recipients = [
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
];
const hashes = [
  keccak256(toBytes("data1")),
  keccak256(toBytes("data2")),
];
await proofNFT.write.ownerBatchMintTo([recipients, hashes]);
```

---

## 🔍 Verification

### Verify Proof On-Chain

```typescript
import { keccak256, toBytes } from "viem";

// User claims they own token #1 with specific data
const claimer = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const tokenId = 1n;
const plainData = "user_national_id_data";

// Contract verifies:
// 1. Token exists
// 2. Claimer owns the token
// 3. keccak256(plainData) matches stored hash
const isValid = await proofNFT.read.verifyProof([
  claimer,
  tokenId,
  toBytes(plainData)
]);

console.log(`Proof valid: ${isValid}`); // true
```

### Integration Example (Backend API)

```typescript
// Express.js API endpoint
app.post('/api/verify-document', async (req, res) => {
  const { userAddress, tokenId, documentData } = req.body;
  
  // Get contract instance
  const proofNFT = await ethers.getContractAt("ProofNFT", CONTRACT_ADDRESS);
  
  // Verify proof
  const isValid = await proofNFT.verifyProof(
    userAddress,
    tokenId,
    ethers.toUtf8Bytes(documentData)
  );
  
  if (isValid) {
    res.json({ 
      success: true, 
      message: "Document ownership verified" 
    });
  } else {
    res.status(403).json({ 
      success: false, 
      message: "Verification failed" 
    });
  }
});
```

---

## 📊 Contract Interface

### Core Functions

#### `ownerMintTo(address to, bytes32 hash) → uint256`
Mints a single proof token. Only callable by contract owner.
- **Parameters:**
  - `to`: Recipient address
  - `hash`: keccak256 hash of the data
- **Returns:** Token ID
- **Reverts if:** Hash is zero, hash already exists, or caller is not owner

#### `ownerBatchMintTo(address[] recipients, bytes32[] hashes) → uint256[]`
Batch mints multiple tokens in a single transaction.
- **Parameters:**
  - `recipients`: Array of recipient addresses
  - `hashes`: Array of corresponding hashes
- **Returns:** Array of token IDs
- **Gas Efficient:** Recommended for minting 2+ tokens

#### `verifyProof(address claimer, uint256 tokenId, bytes plainData) → bool`
Verifies that a claimer owns a token and the plaintext hashes to the stored value.
- **Parameters:**
  - `claimer`: Address claiming ownership
  - `tokenId`: Token ID to verify
  - `plainData`: Raw data to verify
- **Returns:** `true` if verification succeeds, `false` otherwise

#### `getTokenHash(uint256 tokenId) → bytes32`
Returns the stored hash for a token.

#### `hashExists(bytes32 hash) → bool`
Checks if a hash has been minted.

#### `totalSupply() → uint256`
Returns total number of tokens minted.

### Events

#### `ProofMinted(address indexed to, uint256 indexed tokenId, bytes32 indexed hash)`
Emitted when a new proof token is minted.

---

## 🧪 Testing

### Run All Tests

```bash
npx hardhat test
```

### Run Specific Test Suite

```bash
npx hardhat test --grep "Server Model Integration"
```

### Test Coverage

```bash
npx hardhat coverage
```

### Gas Reporter

Add to `hardhat.config.ts`:
```typescript
import "hardhat-gas-reporter";

export default {
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
};
```

---

## 🔐 Security Considerations

⚠️ **CRITICAL**: Read [SECURITY.md](./SECURITY.md) before production deployment.

### Key Security Points

1. **Data Salting**: Always salt data before hashing to prevent rainbow table attacks
   ```typescript
   const saltedData = `${data}:${SALT}:${userAddress}`;
   const hash = keccak256(toBytes(saltedData));
   ```

2. **Owner Key Management**: Use HSM or multi-sig wallet for owner role

3. **Privacy**: All hashes are public on-chain; ensure sufficient entropy

4. **Uniqueness**: Contract prevents duplicate hashes, but doesn't prevent different data from hashing to same value (collision)

5. **Immutability**: Tokens cannot be modified after minting; plan carefully

### Recommended Enhancements

- Implement ZK-SNARKs for verification without revealing data
- Add time-bound proofs with expiration
- Use multi-signature for minting operations
- Implement revocation mechanism for compromised proofs

See [SECURITY.md](./SECURITY.md) for detailed security analysis and recommendations.

---

## 🔗 Integration with Server

### Server Model Schema

Your server should track:
```typescript
interface UserProofRecord {
  userAddress: string;
  tokenId: number;
  hash: string;
  sourceData: string; // Off-chain only
  metadata: {
    requestId: string;
    documentType: string;
    mintedAt: Date;
  };
}
```

### Minting Flow

```
1. User uploads document to server
   ↓
2. Server verifies and processes document
   ↓
3. Server generates salted hash
   ↓
4. Server calls proofNFT.ownerMintTo()
   ↓
5. Server stores tokenId in database
   ↓
6. User receives NFT in their wallet
```

### Verification Flow

```
1. User provides document + tokenId
   ↓
2. Server/Contract verifies:
   - Token exists
   - User owns token
   - Hash matches
   ↓
3. Return verification result
```

---

## 📈 Gas Optimization

### Batch Minting Comparison

| Operation | Gas Cost | Savings |
|-----------|----------|---------|
| Single mint × 10 | ~950,000 | - |
| Batch mint (10) | ~580,000 | 39% |
| Batch mint (50) | ~2,500,000 | 47% |

### Recommendations

- Batch mint 20-50 tokens per transaction
- Use batch operations for initial minting
- Monitor gas prices and mint during low-traffic periods

---

## 🛠️ Development

### Project Setup

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Start local node
npx hardhat node

# Deploy locally
npx hardhat run scripts/deployProofNFT.ts --network localhost
```

### File Structure

- **contracts/ProofNFT.sol**: Main smart contract
- **test/ProofNFT.ts**: Test suite (50+ tests)
- **scripts/deployProofNFT.ts**: Deployment automation
- **scripts/mintFromServerModel.ts**: Server integration script
- **data/userRequests.json**: Sample server data

---

## 📝 Example Use Cases

### 1. National ID Verification
```typescript
// Hash national ID data
const idData = {
  userId: userAddress,
  idNumber: "encrypted",
  cid: "QmHash...",
  timestamp: Date.now(),
};
const hash = keccak256(toBytes(JSON.stringify(idData)));
await proofNFT.ownerMintTo(userAddress, hash);
```

### 2. Land Ownership Proof
```typescript
// Hash land deed data
const deedData = {
  ownerId: userAddress,
  landParcel: "lot_42_block_5",
  cid: "QmDeed...",
  documentHash: "0xabc...",
};
const hash = keccak256(toBytes(JSON.stringify(deedData)));
await proofNFT.ownerMintTo(userAddress, hash);
```

### 3. Medical Records
```typescript
// Hash medical record
const medicalData = {
  patientId: userAddress,
  recordType: "vaccination",
  cid: "QmMedical...",
  date: "2024-10-14",
};
const hash = keccak256(toBytes(JSON.stringify(medicalData)));
await proofNFT.ownerMintTo(userAddress, hash);
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🆘 Support

- **Issues**: Open a GitHub issue
- **Security**: See [SECURITY.md](./SECURITY.md) for security disclosures
- **Documentation**: Read inline code comments

---

## ✅ Checklist for Production

Before deploying to production:

- [ ] Security audit completed
- [ ] All tests passing
- [ ] Gas optimization verified
- [ ] Data salting implemented
- [ ] Owner key secured (HSM/multi-sig)
- [ ] Event monitoring configured
- [ ] Backup procedures documented
- [ ] Privacy policy updated
- [ ] Legal compliance verified
- [ ] Testnet deployment successful
- [ ] Load testing completed

---

## 🙏 Acknowledgments

- OpenZeppelin for secure contract libraries
- Hardhat for development framework
- Ethereum community for standards and best practices

---

**Version**: 1.0.0  
**Last Updated**: October 2024  
**Status**: ✅ Ready for testing (⚠️ Not production-ready without security audit)
