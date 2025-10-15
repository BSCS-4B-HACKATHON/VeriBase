# Deployment Checklist

## Pre-Deployment

### 1. Environment Setup

- [ ] Copy `.env.example` to `.env`
- [ ] Add `BASE_SEPOLIA_PRIVATE_KEY` (wallet with test ETH)
- [ ] Verify RPC URL: `https://sepolia.base.org`
- [ ] Get test ETH from Base Sepolia faucet

### 2. Compile Contracts

```bash
cd blockchain
npx hardhat compile
```

- [ ] No compilation errors
- [ ] Both contracts compiled successfully

### 3. Run Tests (Optional)

```bash
npx hardhat test
```

- [ ] Tests pass (if implemented)

## Deployment

### 1. Deploy to Base Sepolia

```bash
npx hardhat run scripts/deployNFTs.ts --network baseSepolia
```

### 2. Record Contract Addresses

After deployment, addresses will be in `deployments/nfts-baseSepolia.json`:

- [ ] National ID NFT: `0x________________`
- [ ] Land Ownership NFT: `0x________________`
- [ ] Deployer Address: `0x________________`

### 3. Verify Contracts on Basescan

```bash
# Get API key from https://basescan.org/myapikey
npx hardhat verify --network baseSepolia 0xNATIONAL_ID_ADDRESS
npx hardhat verify --network baseSepolia 0xLAND_OWNERSHIP_ADDRESS
```

- [ ] National ID NFT verified
- [ ] Land Ownership NFT verified

## Post-Deployment

### 1. Update Environment Variables

**Backend `.env`:**

```bash
NATIONAL_ID_NFT_ADDRESS=0x...
LAND_OWNERSHIP_NFT_ADDRESS=0x...
BACKEND_WALLET_PRIVATE_KEY=0x... # Same as deployer
```

**Frontend `.env`:**

```bash
NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS=0x...
NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS=0x...
```

### 2. Update Backend Code

**File: `server/src/services/nftService.ts`** (or similar)

- [ ] Import NationalIdNFT ABI
- [ ] Import LandOwnershipNFT ABI
- [ ] Update minting logic to use correct contract based on `requestType`
- [ ] Add `addFileToToken` calls after minting
- [ ] Test minting flow

Example:

```typescript
async function mintNFT(request: IRequest) {
  const contract =
    request.requestType === "national_id"
      ? nationalIdNFTContract
      : landOwnershipNFTContract;

  const tokenId = await contract.write.mintNationalId([
    request.requesterWallet,
    request.requestType,
    request.minimalPublicLabel,
    request.metadataCid,
    request.metadataHash,
    request.uploaderSignature,
    request.consent.textVersion,
    BigInt(request.consent.timestamp),
  ]);

  // Add files
  for (const file of request.files) {
    await contract.write.addFileToToken([
      tokenId,
      file.cid,
      file.filename,
      file.mime,
      BigInt(file.size),
      file.iv,
      file.ciphertextHash,
      file.tag,
    ]);
  }

  return tokenId;
}
```

### 3. Update Frontend Code

**Contract Initialization:**

```typescript
// lib/contracts.ts
import NationalIdNFTABI from "./abis/NationalIdNFT.json";
import LandOwnershipNFTABI from "./abis/LandOwnershipNFT.json";

export const getNFTContract = (requestType: string) => {
  const address =
    requestType === "national_id"
      ? process.env.NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS
      : process.env.NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS;

  const abi =
    requestType === "national_id" ? NationalIdNFTABI : LandOwnershipNFTABI;

  return { address, abi };
};
```

**Display Logic:**

```typescript
// Check if user has National ID
const hasNationalId = await nationalIdContract.read.hasNationalId([
  userAddress,
]);

// Get user's land ownership tokens
const landTokens = await landOwnershipContract.read.getTokensByWallet([
  userAddress,
]);
```

### 4. Copy ABI Files

After compilation, copy ABIs to frontend:

```bash
# From blockchain directory
cp artifacts/contracts/NationalIdNFT.sol/NationalIdNFT.json ../client/lib/abis/
cp artifacts/contracts/LandOwnershipNFT.sol/LandOwnershipNFT.json ../client/lib/abis/
```

- [ ] NationalIdNFT ABI copied
- [ ] LandOwnershipNFT ABI copied

## Testing

### 1. Test Minting

**National ID:**

- [ ] Mint National ID to test wallet
- [ ] Verify one NFT per wallet limit
- [ ] Try to mint second ID (should fail)
- [ ] Verify cannot transfer
- [ ] Check metadata on-chain
- [ ] View on Basescan

**Land Ownership:**

- [ ] Mint Land Ownership to test wallet
- [ ] Mint multiple to same wallet
- [ ] Verify cannot transfer directly
- [ ] Check metadata on-chain
- [ ] View on Basescan

### 2. Test Frontend

- [ ] Connect wallet
- [ ] Submit National ID request
- [ ] Admin approves request
- [ ] NFT mints successfully
- [ ] NFT displays in user dashboard
- [ ] Metadata loads correctly
- [ ] Repeat for Land Ownership

### 3. Test Edge Cases

- [ ] Try minting without admin approval
- [ ] Try minting to zero address
- [ ] Try adding files to non-existent token
- [ ] Try transferring National ID (should fail)
- [ ] Try transferring Land Ownership without auth contract (should fail)

## Monitoring

### 1. Set Up Alerts

- [ ] Monitor minting transactions
- [ ] Track gas costs
- [ ] Alert on failed transactions
- [ ] Monitor contract balance

### 2. Dashboard Metrics

Track:

- Total National IDs minted
- Total Land Ownerships minted
- Average gas cost per mint
- Failed transactions
- Unique users with NFTs

## Mainnet Deployment (When Ready)

- [ ] Audit contracts (recommended for production)
- [ ] Get BASE mainnet ETH
- [ ] Deploy to BASE mainnet
- [ ] Verify contracts
- [ ] Update production .env
- [ ] Test with small amount first
- [ ] Monitor closely for first week
- [ ] Announce to users

## Rollback Plan

If something goes wrong:

1. Stop all minting operations
2. Do NOT transfer ownership or make changes
3. Debug issue on testnet
4. Deploy new contracts if needed
5. Migrate data (NFTs cannot be moved)

**Note:** NFTs are permanent once minted. Cannot be edited or removed.

## Documentation

- [ ] Update API documentation
- [ ] Update user guide
- [ ] Create admin guide for minting
- [ ] Document emergency procedures
- [ ] Share contract addresses with team

## Success Criteria

✅ Contracts deployed and verified on Basescan
✅ Backend can mint both NFT types
✅ Frontend displays NFTs correctly
✅ Transfer restrictions work as expected
✅ One National ID per wallet enforced
✅ Multiple Land Ownerships per wallet works
✅ Gas costs acceptable
✅ No security vulnerabilities found
✅ Team trained on new system
✅ Monitoring in place

---

**Last Updated:** {date}
**Deployed By:** {your_name}
**Network:** Base Sepolia
**Status:** [ ] Not Started | [ ] In Progress | [ ] Complete
