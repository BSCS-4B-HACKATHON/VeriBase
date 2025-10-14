# ProofNFT Security Documentation

## Overview

ProofNFT is an ERC-721 implementation that stores keccak256 hashes representing proofs of off-chain data ownership. This document outlines security considerations, best practices, and recommendations for production deployment.

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

- **Token Ownership**: ERC-721 standard ownership records
- **Keccak256 Hashes**: 32-byte hashes of off-chain data (bytes32)
- **Events**: ProofMinted events linking addresses to hashes

### What is NOT Stored On-Chain

- Raw plaintext data
- Personal identifying information (PII)
- Encryption keys
- Metadata beyond the hash itself

### Trust Model

- **Contract Owner**: Trusted backend server that authenticates users before minting
- **Users**: Trust the server to mint only legitimate proofs
- **Blockchain**: Provides immutable record of hash-ownership associations

---

## Threat Analysis

### 1. Preimage Attacks

**Threat**: Attacker attempts to reverse-engineer the original data from the hash.

**Mitigation**:
- Keccak256 is cryptographically secure and preimage-resistant
- Hashes are 256-bit (2^256 possible values)
- Practically impossible to brute-force

**Residual Risk**: 
- If source data has low entropy (e.g., "yes" or "no"), dictionary/rainbow table attacks possible
- **Solution**: Always salt data before hashing (see recommendations below)

### 2. Rainbow Table Attacks

**Threat**: Attacker precomputes hashes of common data values and matches them against on-chain hashes.

**Mitigation Implemented**:
- Uniqueness guard prevents duplicate hashes
- Contract prevents revealing which hashes are "common"

**Residual Risk**:
- If data is predictable (e.g., sequential IDs), rainbow tables effective
- **Solution**: Use salts and add sufficient entropy (see recommendations)

### 3. Hash Collision

**Threat**: Two different data values produce the same hash.

**Mitigation**:
- Keccak256 has 256-bit output space
- Collision resistance is cryptographically proven
- Birthday paradox requires 2^128 hashes to have 50% collision probability

**Assessment**: Negligible risk in practice

### 4. Duplicate Hash Prevention

**Threat**: Attacker mints multiple tokens with the same hash to claim multiple proofs.

**Mitigation Implemented**:
```solidity
mapping(bytes32 => bool) private _hashExists;

if (_hashExists[hash]) revert HashAlreadyExists();
```

**Assessment**: Fully mitigated

### 5. Owner Key Compromise

**Threat**: Backend server's private key is compromised.

**Impact**:
- Attacker can mint arbitrary proof tokens
- Attacker can associate hashes with wrong addresses
- Cannot modify existing tokens (immutable once minted)

**Mitigation Recommendations**:
- Use hardware security module (HSM) for key storage
- Implement multi-signature wallet for owner role
- Use role-based access control (RBAC) via OpenZeppelin's AccessControl
- Implement time-locked minting operations
- Monitor for unusual minting patterns

### 6. Front-Running

**Threat**: Attacker observes pending minting transaction and front-runs it.

**Impact**: Limited - attacker cannot change the recipient or hash
**Assessment**: Not applicable to owner-only minting

### 7. Privacy Leakage

**Threat**: On-chain hashes reveal information about users or data.

**Analysis**:
- All hashes are public and permanent
- Observers can track which addresses own which hashes
- If attacker knows the plaintext, they can verify it by computing the hash
- Transaction metadata (timing, gas price) may leak patterns

**Mitigation**: See Privacy Considerations section

---

## Best Practices

### 1. Data Salting (CRITICAL)

**Problem**: Low-entropy data is vulnerable to dictionary attacks.

**Solution**: Always salt data before hashing.

```typescript
// DON'T DO THIS:
const hash = keccak256(toBytes("yes"));

// DO THIS INSTEAD:
const salt = process.env.HASH_SALT || "random-secure-salt-12345";
const hash = keccak256(toBytes(`${data}:${salt}:${userAddress}`));
```

**Recommended Salt Structure**:
```typescript
const saltedData = `${plainData}:${globalSalt}:${userAddress}:${timestamp}`;
const hash = keccak256(toBytes(saltedData));
```

**Salt Storage**:
- Store global salt in secure environment variable
- Never commit salts to version control
- Use different salts for development/production
- Consider per-user salts stored securely off-chain

### 2. Entropy Enhancement

Add sufficient entropy to all data:

```typescript
// Example: Document proof with high entropy
const documentProof = {
  userId: userAddress,
  documentCid: "QmHash...",
  documentHash: "0xabc123...",
  timestamp: Date.now(),
  nonce: crypto.randomBytes(32).toString('hex'),
  salt: process.env.HASH_SALT,
};

const proofString = JSON.stringify(documentProof);
const hash = keccak256(toBytes(proofString));
```

### 3. Server-Side Authentication

Before minting, verify:
1. User owns the wallet address
2. User has uploaded valid documents
3. Documents passed verification checks
4. No duplicate requests

```typescript
// Example authentication flow
async function mintProofForUser(userAddress: string, documentData: any) {
  // 1. Verify user signature
  const verified = await verifyUserSignature(userAddress, documentData);
  if (!verified) throw new Error("Invalid signature");
  
  // 2. Check document verification status
  const request = await getRequestFromDb(documentData.requestId);
  if (request.status !== "verified") throw new Error("Not verified");
  
  // 3. Generate hash with salt
  const hash = generateSecureHash(documentData, userAddress);
  
  // 4. Mint token
  await proofNFT.ownerMintTo(userAddress, hash);
}
```

### 4. Batch Minting Optimization

For gas efficiency:
- Batch multiple mints in single transaction
- Limit batch size to prevent gas limit issues (50-100 items)
- Use `ownerBatchMintTo` instead of multiple `ownerMintTo` calls

```typescript
// Efficient batching
const BATCH_SIZE = 50;

for (let i = 0; i < entries.length; i += BATCH_SIZE) {
  const batch = entries.slice(i, i + BATCH_SIZE);
  const recipients = batch.map(e => e.wallet);
  const hashes = batch.map(e => e.hash);
  
  await proofNFT.ownerBatchMintTo(recipients, hashes);
}
```

### 5. Event Monitoring

Monitor ProofMinted events for:
- Unusual minting patterns
- Unexpected addresses
- High-frequency minting
- Gas anomalies

```typescript
// Event monitoring example
proofNFT.watchEvent.ProofMinted({
  onLogs: (logs) => {
    for (const log of logs) {
      console.log(`Minted token ${log.args.tokenId} to ${log.args.to}`);
      // Alert if unusual pattern detected
    }
  }
});
```

---

## Recommended Enhancements

### 1. Zero-Knowledge Proofs (ZK-SNARKs/ZK-STARKs)

**Problem**: Current implementation requires revealing plaintext data to verify proof.

**Solution**: Implement ZK proofs for verification without revealing data.

**Libraries**:
- [SnarkJS](https://github.com/iden3/snarkjs)
- [Circom](https://docs.circom.io/)
- [ZoKrates](https://zokrates.github.io/)

**Example Flow**:
```
1. User generates ZK proof: "I know data D such that hash(D) = H"
2. Contract verifies proof without seeing D
3. Privacy preserved
```

**Implementation Sketch**:
```solidity
// Add ZK verifier
import "./Verifier.sol";

contract ProofNFTZK is ProofNFT {
    Verifier public verifier;
    
    function verifyProofZK(
        uint256 tokenId,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[1] memory input
    ) external view returns (bool) {
        bytes32 storedHash = _tokenHashes[tokenId];
        return verifier.verifyProof(a, b, c, [uint(storedHash)]);
    }
}
```

### 2. Time-Bound Proofs

Add expiration dates to proofs:

```solidity
mapping(uint256 => uint256) private _tokenExpiry;

function verifyProof(
    address claimer,
    uint256 tokenId,
    bytes calldata plainData
) external view returns (bool) {
    // Check expiration
    if (_tokenExpiry[tokenId] > 0 && block.timestamp > _tokenExpiry[tokenId]) {
        return false;
    }
    
    // ... existing verification logic
}
```

### 3. Multi-Signature Minting

Replace single owner with multi-sig:

```solidity
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ProofNFTMultiSig is ProofNFT, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    constructor() {
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    function ownerMintTo(address to, bytes32 hash) 
        external 
        onlyRole(MINTER_ROLE) 
        returns (uint256) 
    {
        // ... minting logic
    }
}
```

### 4. Revocation Mechanism

Allow revoking compromised proofs:

```solidity
mapping(uint256 => bool) private _revoked;

function revokeProof(uint256 tokenId) external onlyOwner {
    _revoked[tokenId] = true;
    emit ProofRevoked(tokenId, block.timestamp);
}

function verifyProof(...) external view returns (bool) {
    if (_revoked[tokenId]) return false;
    // ... existing logic
}
```

### 5. Merkle Tree Batching

For extremely large datasets, use Merkle trees:

```solidity
mapping(uint256 => bytes32) private _merkleRoots;

function verifyProofWithMerkle(
    uint256 tokenId,
    bytes32 leaf,
    bytes32[] calldata proof
) external view returns (bool) {
    bytes32 root = _merkleRoots[tokenId];
    return MerkleProof.verify(proof, root, leaf);
}
```

---

## Privacy Considerations

### On-Chain Privacy

**What's Public**:
- All hashes are permanently visible
- Wallet addresses associated with hashes
- Minting timestamps
- Transaction metadata

**Privacy Risks**:
1. **Linkability**: Observers can link multiple tokens to same user
2. **Timing Analysis**: Minting patterns may reveal user behavior
3. **Hash Correlation**: If data becomes public, hash can be verified

### Mitigation Strategies

#### 1. Use Privacy-Preserving Layer 2

Deploy on privacy-focused L2s:
- **Aztec Network**: ZK-rollup with built-in privacy
- **Polygon Nightfall**: Privacy-focused Ethereum L2
- **zkSync Era**: ZK-rollup with privacy features

#### 2. Stealth Addresses

Mint tokens to stealth addresses:
- User generates one-time address per proof
- True owner revealed only when needed
- Requires off-chain tracking of stealth addresses

#### 3. Homomorphic Encryption

Store encrypted hashes that can be verified without decryption.

#### 4. Trusted Execution Environments (TEE)

Use TEEs for verification:
- Intel SGX
- ARM TrustZone
- AWS Nitro Enclaves

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
  }
};
```

### Incident Response

**If Owner Key is Compromised**:
1. Immediately pause minting operations
2. Deploy new contract with new owner
3. Migrate legitimate tokens if possible
4. Notify users of contract migration
5. Revoke compromised keys

**If Hash Preimage is Leaked**:
1. Assess impact (which users affected)
2. Consider revoking affected tokens
3. Implement stronger salting
4. Notify affected users
5. Re-mint with improved hashing

---

## Deployment Checklist

Before production deployment:

- [ ] Implement data salting with secure random salt
- [ ] Store salt in secure environment variable
- [ ] Use HSM or multi-sig for owner key
- [ ] Set up event monitoring and alerts
- [ ] Audit contract code (consider external audit)
- [ ] Test with production-like data volumes
- [ ] Document backup and recovery procedures
- [ ] Plan for key rotation
- [ ] Implement rate limiting on minting
- [ ] Test incident response procedures
- [ ] Review and update privacy policy
- [ ] Ensure compliance with data protection laws (GDPR, CCPA, etc.)

---

## Testing Recommendations

### Security Tests

```typescript
describe("Security Tests", () => {
  it("Should prevent duplicate hash minting", async () => {
    const hash = keccak256(toBytes("data"));
    await proofNFT.ownerMintTo(user1, hash);
    await expect(proofNFT.ownerMintTo(user2, hash)).to.be.rejected;
  });
  
  it("Should prevent zero hash minting", async () => {
    await expect(proofNFT.ownerMintTo(user1, ZERO_HASH)).to.be.rejected;
  });
  
  it("Should prevent non-owner minting", async () => {
    await expect(
      proofNFT.connect(user1).ownerMintTo(user2, hash)
    ).to.be.rejected;
  });
  
  it("Should verify proof only for correct owner", async () => {
    await proofNFT.ownerMintTo(user1, hash);
    expect(await proofNFT.verifyProof(user1, 1, data)).to.be.true;
    expect(await proofNFT.verifyProof(user2, 1, data)).to.be.false;
  });
});
```

### Fuzzing Tests

Use Echidna or Foundry fuzzing:
```solidity
// Foundry invariant test
function invariant_totalSupplyMatchesCounter() public {
    assertEq(proofNFT.totalSupply(), expectedSupply);
}

function invariant_noHashCollisions() public {
    // Verify uniqueness constraint holds
}
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

- [OpenZeppelin Security Best Practices](https://docs.openzeppelin.com/contracts/4.x/api/security)
- [Ethereum Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [NIST Cryptographic Standards](https://csrc.nist.gov/publications)
- [Zero Knowledge Proofs: An Introduction](https://z.cash/technology/zksnarks/)

---

## Contact and Support

For security issues or questions:
- Review code carefully before deployment
- Consider professional security audit
- Test thoroughly on testnet
- Monitor production contract continuously

---

**Last Updated**: October 2024  
**Version**: 1.0.0
