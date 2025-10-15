# NFT Contracts Security Documentation

## Overview

This document covers security considerations for two NFT contracts:

- **NationalIdNFT**: Soul-bound (non-transferable) identity verification NFT
- **LandOwnershipNFT**: Transferable property ownership NFT with authorized transfer mechanism

Both contracts store encrypted document metadata on-chain with IPFS references. This document outlines security considerations, best practices, and recommendations for production deployment.

---

## Table of Contents

1. [Security Model](#security-model)
2. [Threat Analysis](#threat-analysis)
3. [Best Practices](#best-practices)
4. [Recommended Enhancements](#recommended-enhancements)
5. [Privacy Considerations](#privacy-considerations)
6. [Operational Security](#operational-security)

---

## Security Model

### What is Stored On-Chain

#### NationalIdNFT (Soul-bound)

- **Token Ownership**: One NFT per wallet (immutable)
- **Document Metadata**: Type, name, IPFS CID, timestamp
- **Encrypted File References**: Ciphertext hashes, encryption metadata (IV, auth tag)
- **Consent Records**: User consent version and timestamp
- **Non-transferable**: Cannot be moved to another wallet

#### LandOwnershipNFT (Transferable)

- **Token Ownership**: Multiple NFTs per wallet allowed
- **Document Metadata**: Same structure as NationalIdNFT
- **Transfer Restrictions**: Only via authorized LandTransferContract
- **Revocation Status**: Can be revoked by contract owner
- **Multiple Files**: Can attach additional files to existing tokens

### What is NOT Stored On-Chain

- Raw plaintext documents
- Unencrypted personal identifying information (PII)
- Encryption keys
- Original file contents (stored on IPFS, encrypted)
- Decryption passwords

### Trust Model

- **Contract Owner**: Trusted backend server that verifies documents before minting
- **Users**: Trust the server to mint only after proper verification
- **Blockchain**: Provides immutable record of document ownership
- **IPFS**: Stores encrypted document files
- **LandTransferContract**: Authorized to facilitate land ownership transfers with fee mechanism

---

## Threat Analysis

### 1. File Encryption Security

**Threat**: Attacker gains access to encrypted files on IPFS.

**Mitigation**:

- All files encrypted with AES-256-GCM before upload
- Only ciphertext hashes stored on-chain
- Encryption keys never touch blockchain
- User-controlled decryption keys

**Residual Risk**:

- If encryption key is compromised, files can be decrypted
- **Solution**: Implement key rotation and multi-layer encryption

### 2. Soul-bound NFT Restrictions (NationalIdNFT)

**Threat**: User attempts to transfer identity NFT to another wallet.

**Mitigation Implemented**:

```solidity
// NationalIdNFT.sol
function _update(address to, uint256 tokenId, address auth)
    internal
    virtual
    override
    returns (address)
{
    address from = _ownerOf(tokenId);
    if (from != address(0) && to != address(0)) {
        revert TransferNotAllowed();
    }
    return super._update(to, tokenId, auth);
}
```

**Assessment**: Fully mitigated - transfers, approvals, and operator permissions all blocked

### 3. One NFT Per Wallet Enforcement (NationalIdNFT)

**Threat**: User attempts to mint multiple National ID NFTs.

**Mitigation Implemented**:

```solidity
mapping(address => uint256) private _walletToTokenId;

function mintNationalId(...) external onlyOwner {
    if (_walletToTokenId[to] != 0) revert WalletAlreadyHasNationalId();
    // ... minting logic
}
```

**Assessment**: Fully mitigated

### 4. Unauthorized Land Transfers (LandOwnershipNFT)

**Threat**: User attempts to directly transfer land NFT without going through authorized contract.

**Mitigation Implemented**:

```solidity
function _update(address to, uint256 tokenId, address auth)
    internal
    override
    returns (address)
{
    address from = _ownerOf(tokenId);

    // Allow minting (from == 0) and burning (to == 0)
    if (from == address(0) || to == address(0)) {
        return super._update(to, tokenId, auth);
    }

    // Only authorized contract can transfer
    if (msg.sender != transferContract) {
        revert DirectTransferNotAllowed();
    }

    return super._update(to, tokenId, auth);
}
```

**Assessment**: Only LandTransferContract can facilitate transfers with proper fee handling

### 5. Owner Key Compromise

**Threat**: Backend server's private key is compromised.

**Impact**:

- Attacker can mint arbitrary NFTs
- Attacker can revoke legitimate tokens
- Attacker can add files to existing tokens
- Cannot modify existing token metadata (immutable once minted)
- Cannot transfer soul-bound NFTs (blocked at contract level)

**Mitigation Recommendations**:

- Use hardware security module (HSM) for key storage
- Implement multi-signature wallet for owner role
- Use role-based access control (RBAC) via OpenZeppelin's AccessControl
- Implement rate limiting on minting operations
- Monitor for unusual minting patterns

### 6. IPFS Availability

**Threat**: IPFS content becomes unavailable.

**Impact**: Encrypted files cannot be retrieved (but metadata remains on-chain)

**Mitigation**:

- Pin files on multiple IPFS nodes
- Use IPFS pinning services (Pinata, NFT.Storage, Web3.Storage)
- Maintain backup copies off-chain
- Consider Arweave for permanent storage

**Assessment**: Moderate risk - implement redundant pinning

### 7. Metadata Immutability

**Threat**: Need to update metadata after minting.

**Current Design**: Core metadata is immutable, but additional files can be added

**Mitigation**:

```solidity
function addFileToToken(uint256 tokenId, ...) external onlyOwner {
    // Allows adding supplementary files without changing core metadata
}
```

**Assessment**: Design trade-off - immutability ensures trust, file addition provides flexibility

---

## Best Practices

### 1. File Encryption (CRITICAL)

**Always encrypt files before uploading to IPFS:**

```typescript
import { webcrypto } from "crypto";

async function encryptFile(fileBuffer: Buffer, encryptionKey: Buffer) {
  // Generate random IV (Initialization Vector)
  const iv = webcrypto.getRandomValues(new Uint8Array(12));

  // Import the encryption key
  const key = await webcrypto.subtle.importKey(
    "raw",
    encryptionKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  // Encrypt file with AES-256-GCM
  const ciphertext = await webcrypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: 128, // Authentication tag length
    },
    key,
    fileBuffer
  );

  // Generate SHA-256 hash of ciphertext (stored on blockchain)
  const ciphertextHash = await webcrypto.subtle.digest("SHA-256", ciphertext);

  return {
    ciphertext: Buffer.from(ciphertext),
    ciphertextHash: `0x${Buffer.from(ciphertextHash).toString("hex")}`,
    iv: Buffer.from(iv).toString("hex"),
    algorithm: "AES-256-GCM",
  };
}

// Upload encrypted file to IPFS
async function uploadToIPFS(encryptedFile: Buffer) {
  // Upload to Pinata/IPFS
  const result = await pinata.upload(encryptedFile);
  return result.cid; // Returns IPFS CID
}
```

### 2. Server-Side Verification Flow

Before minting, the backend must verify:

```typescript
async function mintNFTForUser(requestId: string, userWallet: string) {
  // 1. Verify request exists and is verified
  const request = await RequestModel.findOne({ requestId });
  if (!request) throw new Error("Request not found");
  if (request.status !== "verified") throw new Error("Not verified by admin");

  // 2. Verify user owns the wallet
  if (request.requesterWallet !== userWallet) {
    throw new Error("Wallet mismatch");
  }

  // 3. Check for existing NFT (NationalIdNFT only)
  if (request.requestType === "national_id") {
    const hasNFT = await nationalIdNFT.read.hasNationalId([userWallet]);
    if (hasNFT) throw new Error("User already has National ID NFT");
  }

  // 4. Prepare metadata from request files
  // Files are ALREADY encrypted and stored on IPFS
  // request.files contains: { cid, filename, ciphertextHash, iv, authTag }
  const metadata = [
    {
      label: "document_type",
      value: request.requestType,
      encrypted: false,
    },
    ...request.files.map((file) => ({
      label: file.filename,
      value: file.ciphertextHash, // Hash of encrypted file
      encrypted: true,
    })),
    {
      label: "request_id",
      value: requestId,
      encrypted: false,
    },
  ];

  // 5. Mint NFT using backend's admin wallet
  const txHash = await nftService.mintNFT(request, userWallet, metadata);

  // 6. Delete request from database (data now lives on blockchain)
  await RequestModel.deleteOne({ requestId });

  return {
    txHash,
    tokenId: result.tokenId,
    note: "Request deleted from database. Data now on blockchain.",
  };
}
```

**Important**: Your files are **already encrypted** when stored in MongoDB:

- ✅ Encrypted with AES-256-GCM before IPFS upload
- ✅ `ciphertextHash` stored in database
- ✅ No additional hashing/salting needed during minting
- ✅ Blockchain stores the ciphertext hash from your DB

### 3. Metadata Structure Best Practices

**Consistent metadata format:**

```typescript
interface DocMeta {
  label: string; // e.g., "document_type", "photo.jpg"
  value: string; // e.g., "national_id", "0xhash..."
  encrypted: boolean; // false for type, true for hashes
}

// Example metadata array
const metadata: DocMeta[] = [
  {
    label: "document_type",
    value: "national_id",
    encrypted: false,
  },
  {
    label: "id_photo.jpg",
    value: "0xabc123...", // ciphertextHash
    encrypted: true,
  },
  {
    label: "request_id",
    value: "REQ-123",
    encrypted: false,
  },
];
```

### 4. Batch Minting Optimization

For gas efficiency with LandOwnershipNFT:

```typescript
async function batchMintLandNFTs(requests: Request[]) {
  const BATCH_SIZE = 50;

  for (let i = 0; i < requests.length; i += BATCH_SIZE) {
    const batch = requests.slice(i, i + BATCH_SIZE);

    const recipients = batch.map((r) => r.requesterWallet);
    const documentTypes = batch.map((r) => r.requestType);
    const documentNames = batch.map((r) => `Property Deed ${r.requestId}`);
    const ipfsCids = batch.map((r) => r.files[0].cid);
    const ciphertextHashes = batch.map((r) => r.files[0].ciphertextHash);
    const metadataSignatures = batch.map((r) => r.metadataHash || "0x");
    const consentVersions = batch.map(() => "consent_v1");
    const timestamps = batch.map(() => BigInt(Date.now()));

    await landOwnershipNFT.write.batchMintLandOwnership([
      recipients,
      documentTypes,
      documentNames,
      ipfsCids,
      ciphertextHashes,
      metadataSignatures,
      consentVersions,
      timestamps,
    ]);
  }
}
```

### 5. Event Monitoring

Monitor contract events for security:

```typescript
// Monitor NationalIdNFT events
nationalIdNFT.watchEvent.NationalIdMinted({
  onLogs: (logs) => {
    for (const log of logs) {
      console.log(`National ID NFT minted:`);
      console.log(`  Token ID: ${log.args.tokenId}`);
      console.log(`  Owner: ${log.args.owner}`);
      console.log(`  Document: ${log.args.documentName}`);

      // Alert if unusual pattern
      checkForAnomalies(log);
    }
  },
});

// Monitor LandOwnershipNFT events
landOwnershipNFT.watchEvent.LandOwnershipMinted({
  onLogs: (logs) => {
    // Similar monitoring
  },
});

// Monitor revocations
landOwnershipNFT.watchEvent.TokenRevoked({
  onLogs: (logs) => {
    for (const log of logs) {
      console.log(`Token ${log.args.tokenId} revoked: ${log.args.reason}`);
      notifyUser(log.args.tokenId, log.args.reason);
    }
  },
});
```

---

## Recommended Enhancements

### 1. Multi-Signature Minting

Replace single owner with multi-sig for production:

```solidity
import "@openzeppelin/contracts/access/AccessControl.sol";

contract NationalIdNFTMultiSig is NationalIdNFT, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function mintNationalId(...)
        external
        onlyRole(MINTER_ROLE)
        returns (uint256)
    {
        // ... minting logic
    }

    function revokeToken(uint256 tokenId, string calldata reason)
        external
        onlyRole(ADMIN_ROLE)
    {
        // ... revocation logic
    }
}
```

### 2. Enhanced Revocation with Appeals

Add appeal mechanism for revoked tokens:

```solidity
enum RevocationStatus {
    Active,
    Revoked,
    UnderAppeal,
    Reinstated
}

mapping(uint256 => RevocationStatus) private _revocationStatus;
mapping(uint256 => string) private _appealReason;

function appealRevocation(uint256 tokenId, string calldata reason) external {
    require(ownerOf(tokenId) == msg.sender, "Not token owner");
    require(_revocationStatus[tokenId] == RevocationStatus.Revoked, "Not revoked");

    _revocationStatus[tokenId] = RevocationStatus.UnderAppeal;
    _appealReason[tokenId] = reason;

    emit RevocationAppealed(tokenId, msg.sender, reason);
}

function resolveAppeal(uint256 tokenId, bool approve) external onlyOwner {
    require(_revocationStatus[tokenId] == RevocationStatus.UnderAppeal, "Not under appeal");

    _revocationStatus[tokenId] = approve ? RevocationStatus.Reinstated : RevocationStatus.Revoked;

    emit AppealResolved(tokenId, approve);
}
```

### 3. Time-Limited Verification

Add expiration dates to documents:

```solidity
mapping(uint256 => uint256) private _tokenExpiry;

function setTokenExpiry(uint256 tokenId, uint256 expiryTimestamp) external onlyOwner {
    _tokenExpiry[tokenId] = expiryTimestamp;
    emit TokenExpirySet(tokenId, expiryTimestamp);
}

function isTokenValid(uint256 tokenId) public view returns (bool) {
    if (_revoked[tokenId]) return false;
    if (_tokenExpiry[tokenId] > 0 && block.timestamp > _tokenExpiry[tokenId]) {
        return false;
    }
    return true;
}
```

### 4. Dynamic Transfer Fees

Allow updating transfer fees for LandTransferContract:

```solidity
function setTransferFee(uint256 newFeeBasisPoints) external onlyOwner {
    require(newFeeBasisPoints <= 1000, "Fee too high"); // Max 10%
    uint256 oldFee = transferFeeBasisPoints;
    transferFeeBasisPoints = newFeeBasisPoints;
    emit TransferFeeUpdated(oldFee, newFeeBasisPoints);
}
```

### 5. Emergency Pause Mechanism

Add pausable functionality for emergencies:

```solidity
import "@openzeppelin/contracts/utils/Pausable.sol";

contract NationalIdNFTPausable is NationalIdNFT, Pausable {
    function mintNationalId(...) external override onlyOwner whenNotPaused {
        // ... minting logic
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
```

### 6. On-Chain Verification Registry

Create a separate contract to track verification status:

```solidity
contract VerificationRegistry {
    mapping(uint256 => bool) public verified;
    mapping(uint256 => address) public verifier;
    mapping(uint256 => uint256) public verificationTimestamp;

    function markAsVerified(uint256 tokenId, address verifierAddress) external {
        require(msg.sender == nationalIdNFT || msg.sender == landOwnershipNFT);
        verified[tokenId] = true;
        verifier[tokenId] = verifierAddress;
        verificationTimestamp[tokenId] = block.timestamp;
    }
}
```

---

## Privacy Considerations

### On-Chain Privacy

**What's Public on Blockchain**:

- Wallet addresses owning NFTs
- Document types (e.g., "national_id", "land_ownership")
- Document names (e.g., "John Doe National ID")
- IPFS CIDs (point to encrypted files)
- Ciphertext hashes (encrypted file hashes)
- Encryption metadata (IV, auth tags - not the keys)
- Minting timestamps
- Transaction metadata

**What Remains Private**:

- Actual file contents (encrypted on IPFS)
- Encryption keys (never touch blockchain)
- Decryption passwords
- Raw document data

### Privacy Risks

1. **Wallet Linkability**: All NFTs tied to one wallet address are publicly linked
2. **Timing Analysis**: Minting patterns may reveal user behavior
3. **Metadata Correlation**: Document names may reveal sensitive information
4. **IPFS Content**: While encrypted, CIDs are public (can detect duplicates)

### Mitigation Strategies

#### 1. Minimal Document Names

Use generic names instead of revealing ones:

```typescript
// ❌ Don't do this:
documentName: "John Doe National ID - Philippines";

// ✅ Do this instead:
documentName: "National ID Document";
```

#### 2. Separate Wallets for Different Document Types

Recommend users use different wallets for different purposes:

- One wallet for identity NFTs
- Another for property NFTs
- Prevents linking identity to property ownership

#### 3. Encrypted Filenames in Metadata

Store encrypted filenames in metadata:

```typescript
const metadata = [
  {
    label: await encryptString("passport_photo.jpg", userKey),
    value: ciphertextHash,
    encrypted: true,
  },
];
```

#### 4. Privacy-Preserving Verification

Verify ownership without revealing wallet address publicly:

```typescript
// Off-chain verification
async function verifyOwnership(tokenId: number, proof: string) {
  // User generates ZK proof of ownership
  // Verifier checks proof without knowing wallet address
  return await verifyZKProof(proof, tokenId);
}
```

---

## Operational Security

### Key Management

1. **Hardware Security Modules (HSM)**

   - Store owner private key in HSM
   - Never expose key in plaintext
   - Use AWS CloudHSM, Azure Key Vault, or similar

2. **Multi-Signature Wallets**

   - Use Gnosis Safe for owner role
   - Require multiple signers for minting
   - Implement time delays for minting operations

3. **Key Rotation**
   - Plan for owner key rotation
   - Use AccessControl for role management
   - Test rotation procedures regularly

### Monitoring and Alerts

```typescript
// Example monitoring setup
const monitor = {
  // Alert on unusual minting volume
  dailyMintLimit: 1000,

  // Alert on minting to unknown addresses
  knownAddresses: new Set(),

  // Alert on gas price anomalies
  maxGasPrice: parseGwei("100"),

  checkMint: async (to: string, hash: string) => {
    // Validate address
    if (!monitor.knownAddresses.has(to)) {
      await sendAlert(`Unknown address: ${to}`);
    }

    // Check daily limit
    const dailyCount = await getDailyMintCount();
    if (dailyCount > monitor.dailyMintLimit) {
      await sendAlert(`Daily limit exceeded: ${dailyCount}`);
    }
  },
};
```

### Incident Response

**If Owner Key is Compromised**:

1. Immediately pause minting operations (if pausable implemented)
2. Revoke compromised tokens if necessary
3. Deploy new contract with new owner key
4. Update server configuration with new contract addresses
5. Notify users of security incident
6. Migrate legitimate tokens if feasible
7. Review and strengthen key management procedures

**If Encryption Keys are Compromised**:

1. Assess impact (which files are affected)
2. Notify affected users immediately
3. Revoke affected NFTs
4. Re-encrypt files with new keys
5. Re-mint NFTs with new ciphertext hashes
6. Update key management procedures
7. Implement key rotation policy

**If IPFS Content Becomes Unavailable**:

1. Check pinning service status (Pinata/NFT.Storage)
2. Re-pin content on backup IPFS nodes
3. Verify CIDs match on-chain records
4. Consider migration to Arweave for permanent storage
5. Notify users if prolonged downtime expected

---

## Deployment Checklist

Before production deployment:

### Security

- [ ] Implement file encryption (AES-256-GCM) for all documents
- [ ] Store encryption keys securely (never on blockchain)
- [ ] Use HSM or multi-sig for owner key
- [ ] Set up event monitoring and alerts
- [ ] Audit contract code (consider external audit)
- [ ] Test transfer restrictions (soul-bound for NationalIdNFT)
- [ ] Test authorized transfer mechanism (LandOwnershipNFT)
- [ ] Verify one-NFT-per-wallet enforcement (NationalIdNFT)

### Infrastructure

- [ ] Pin IPFS files on multiple nodes (Pinata/NFT.Storage)
- [ ] Set up backup IPFS pinning service
- [ ] Configure server with proper environment variables
- [ ] Test with production-like data volumes
- [ ] Implement rate limiting on minting API
- [ ] Set up monitoring dashboards (Grafana/Datadog)

### Operations

- [ ] Document backup and recovery procedures
- [ ] Plan for key rotation
- [ ] Test incident response procedures
- [ ] Set up 24/7 monitoring for critical events
- [ ] Configure alert thresholds
- [ ] Create runbooks for common issues

### Compliance

- [ ] Review and update privacy policy
- [ ] Ensure compliance with data protection laws (GDPR, CCPA)
- [ ] Document data retention policies
- [ ] Get legal review of smart contracts
- [ ] Prepare user consent mechanisms
- [ ] Document right-to-erasure limitations (blockchain immutability)

### Testing

- [ ] Test on testnet (Base Sepolia) thoroughly
- [ ] Perform load testing (batch minting)
- [ ] Test revocation mechanism
- [ ] Test land transfer contract integration
- [ ] Verify gas costs are acceptable
- [ ] Test edge cases (empty metadata, special characters)

---

## Contract Addresses (Base Sepolia Testnet)

After deployment, update these addresses:

```bash
# To be filled after deployment
NATIONAL_ID_NFT_ADDRESS=0x...
LAND_OWNERSHIP_NFT_ADDRESS=0x...
LAND_TRANSFER_CONTRACT_ADDRESS=0x...
```

Verify contracts on Basescan:

```bash
npx hardhat verify --network baseSepolia NATIONAL_ID_NFT_ADDRESS
npx hardhat verify --network baseSepolia LAND_OWNERSHIP_NFT_ADDRESS
npx hardhat verify --network baseSepolia LAND_TRANSFER_CONTRACT_ADDRESS "LAND_OWNERSHIP_ADDRESS" 250 "FEE_RECIPIENT"
```

---

## Testing Recommendations

### Security Tests

```typescript
describe("NationalIdNFT Security Tests", () => {
  it("Should prevent transfers", async () => {
    await nationalIdNFT.write.mintNationalId([...]);
    const tokenId = 1n;

    await expect(
      nationalIdNFT.write.transferFrom([owner, user2, tokenId])
    ).to.be.rejectedWith("TransferNotAllowed");
  });

  it("Should prevent duplicate National ID for same wallet", async () => {
    await nationalIdNFT.write.mintNationalId([user1, ...]);

    await expect(
      nationalIdNFT.write.mintNationalId([user1, ...])
    ).to.be.rejectedWith("WalletAlreadyHasNationalId");
  });

  it("Should prevent non-owner minting", async () => {
    await expect(
      nationalIdNFT.write.mintNationalId([user1, ...], { account: user2 })
    ).to.be.rejected;
  });

  it("Should verify token belongs to correct owner", async () => {
    await nationalIdNFT.write.mintNationalId([user1, ...]);
    const tokenId = await nationalIdNFT.read.getTokenIdByWallet([user1]);

    expect(await nationalIdNFT.read.ownerOf([tokenId])).to.equal(user1);
  });
});

describe("LandOwnershipNFT Security Tests", () => {
  it("Should prevent direct transfers", async () => {
    await landOwnershipNFT.write.mintLandOwnership([user1, ...]);
    const tokenId = 1n;

    await expect(
      landOwnershipNFT.write.transferFrom([user1, user2, tokenId], { account: user1 })
    ).to.be.rejectedWith("DirectTransferNotAllowed");
  });

  it("Should allow multiple land NFTs per wallet", async () => {
    await landOwnershipNFT.write.mintLandOwnership([user1, ...]);
    await landOwnershipNFT.write.mintLandOwnership([user1, ...]);

    const balance = await landOwnershipNFT.read.balanceOf([user1]);
    expect(balance).to.equal(2n);
  });

  it("Should allow revocation by owner", async () => {
    await landOwnershipNFT.write.mintLandOwnership([user1, ...]);
    const tokenId = 1n;

    await landOwnershipNFT.write.revokeToken([tokenId, "Fraud detected"]);

    const metadata = await landOwnershipNFT.read.getMetadata([tokenId]);
    expect(metadata.revoked).to.be.true;
    expect(metadata.revocationReason).to.equal("Fraud detected");
  });

  it("Should only allow authorized contract to transfer", async () => {
    await landOwnershipNFT.write.setTransferContract([transferContract.address]);

    // Authorized contract can transfer
    await expect(
      transferContract.write.initiateTransfer([tokenId, user2, price])
    ).to.not.be.rejected;

    // Direct transfer still blocked
    await expect(
      landOwnershipNFT.write.transferFrom([user1, user2, tokenId], { account: user1 })
    ).to.be.rejectedWith("DirectTransferNotAllowed");
  });
});
```

### Gas Optimization Tests

```typescript
describe("Gas Optimization", () => {
  it("Batch minting should be cheaper than individual mints", async () => {
    const recipients = [user1, user2, user3];
    const count = recipients.length;

    // Measure batch mint gas
    const batchTx = await landOwnershipNFT.write.batchMintLandOwnership([...]);
    const batchReceipt = await publicClient.waitForTransactionReceipt({ hash: batchTx });
    const batchGas = batchReceipt.gasUsed;

    console.log(`Batch mint (${count} NFTs): ${batchGas} gas`);
    console.log(`Average per NFT: ${batchGas / BigInt(count)} gas`);

    // Batch should be more efficient
    expect(batchGas / BigInt(count)).to.be.lessThan(expectedSingleMintGas);
  });
});
```

---

## Compliance and Legal

### Data Protection

- **GDPR**: Hashes may constitute personal data if linkable to individuals
- **Right to Erasure**: Blockchain immutability conflicts with deletion rights
- **Data Minimization**: Only store necessary hashes, not full documents

### Recommendations

1. Consult legal counsel before production deployment
2. Include blockchain disclaimers in terms of service
3. Consider jurisdictional issues
4. Document data processing purposes
5. Implement consent mechanisms

---

## References

- [OpenZeppelin Security Best Practices](https://docs.openzeppelin.com/contracts/5.x/)
- [OpenZeppelin ERC-721 Documentation](https://docs.openzeppelin.com/contracts/5.x/erc721)
- [Ethereum Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [NIST Cryptographic Standards](https://csrc.nist.gov/publications)
- [IPFS Best Practices](https://docs.ipfs.tech/concepts/best-practices/)
- [Viem Documentation](https://viem.sh/)
- [Base Network Documentation](https://docs.base.org/)

---

## Contact and Support

For security issues or questions:

- Review code carefully before deployment
- Consider professional security audit for production
- Test thoroughly on Base Sepolia testnet
- Monitor production contracts continuously
- Report security vulnerabilities responsibly

---

**Last Updated**: October 2025  
**Version**: 2.0.0  
**Contracts**: NationalIdNFT, LandOwnershipNFT, LandTransferContract  
**Network**: Base Sepolia (Testnet) / Base (Mainnet)
