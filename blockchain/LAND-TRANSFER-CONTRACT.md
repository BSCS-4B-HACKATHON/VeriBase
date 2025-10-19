# Land Transfer Contract Documentation

## Overview

The `LandTransferContract` is an authorized smart contract that facilitates **FREE and INSTANT** land ownership NFT transfers between wallets. It provides a simple, immediate transfer mechanism that only requires the recipient's wallet address.

**Important**: This is **NOT an escrow system**. Transfers happen instantly - there is no holding period, no payment, and no pending state. The contract simply provides an authorized way to transfer LandOwnershipNFTs with legal document tracking.

## Key Features

✅ **FREE Transfers** - No payment or fees required
✅ **Instant Transfer** - NFT transfers immediately (no escrow)
✅ **Simple Process** - Only needs recipient wallet address
✅ **Legal Compliance** - IPFS document linking for transfer agreements
✅ **Authorized Only** - Only this contract can transfer LandOwnershipNFTs

## How It Works

### Transfer Flow

```
1. Seller calls initiateTransfer() with recipient wallet
   ↓
2. Contract verifies seller owns the NFT
   ↓
3. NFT is INSTANTLY transferred to buyer (FREE)
   ↓
4. Transfer record created as "Completed"
```

### State Diagram

```
┌──────────┐
│ Initiate │──→ seller calls initiateTransfer()
└─────┬────┘
      │
      ↓
┌───────────┐
│ Completed │──→ NFT transferred INSTANTLY (NO ESCROW)
└───────────┘

Note: There is no "Pending" state - transfers are instant!
```

## Contract Architecture

### State Variables

```solidity
address public landOwnershipNFT;           // LandOwnershipNFT contract
```

### Transfer Request Structure

```solidity
struct TransferRequest {
    uint256 tokenId;              // Land NFT being transferred
    address seller;               // Current owner
    address buyer;                // New owner
    TransferStatus status;        // Pending/Completed/Cancelled
    uint256 createdAt;            // Creation timestamp
    string legalDocumentCid;      // IPFS CID of legal docs
}
```

## Functions

### For Sellers (Land Owners)

#### initiateTransfer()

```solidity
function initiateTransfer(
    uint256 tokenId,
    address buyer,
    string calldata legalDocumentCid
) external returns (uint256 transferId)
```

**INSTANTLY** transfers the NFT to the buyer. No escrow, no waiting period.

**Parameters:**

- `tokenId` - The land NFT to transfer
- `buyer` - Buyer's wallet address
- `legalDocumentCid` - IPFS CID of transfer agreement

**Returns:** Transfer ID for record-keeping

**What happens:**

1. Verifies caller owns the NFT
2. Creates transfer record (already marked "Completed")
3. **Immediately transfers NFT to buyer**
4. Emits events

**Example:**

```typescript
// This transfers the NFT immediately!
const transferId = await transferContract.write.initiateTransfer([
  tokenId,
  buyerAddress,
  "QmLegalDoc123...", // IPFS CID
]);
// NFT is now owned by buyer!
```

### For Buyers

No action required! Once seller calls `initiateTransfer()`, you instantly own the NFT.

#### cancelTransfer()

```solidity
function cancelTransfer(uint256 transferId) external view
```

**DEPRECATED** - This function is kept for backwards compatibility but cannot actually cancel transfers since they complete instantly.

Will always revert with `TransferNotPending()` because transfers are never in a pending state.

### View Functions

#### getTransferDetails()

```solidity
function getTransferDetails(uint256 transferId)
    external view returns (TransferRequest memory)
```

Gets full transfer details.

#### hasActiveTransfer()

```solidity
function hasActiveTransfer(uint256 tokenId)
    external view returns (bool)
```

Checks if a token has an active transfer.

## Usage Examples

### Complete Transfer Flow

```typescript
// Seller initiates and COMPLETES transfer in one call
const sellerContract = await hre.viem.getContractAt(
  "LandTransferContract",
  transferContractAddress,
  { account: sellerAccount }
);

const transferId = await sellerContract.write.initiateTransfer([
  tokenId,
  buyerAddress,
  "QmLegalDoc...",
]);

console.log("Transfer completed instantly! ID:", transferId);
// NFT is now owned by buyer - no additional steps needed!
```

### Query Transfer Status

```typescript
const transfer = await transferContract.read.getTransferDetails([transferId]);

console.log({
  tokenId: transfer.tokenId,
  seller: transfer.seller,
  buyer: transfer.buyer,
  status: transfer.status, // 0=Pending, 1=Completed, 2=Cancelled
  createdAt: new Date(Number(transfer.createdAt) * 1000),
});
```

### Cancel Transfer

```typescript
// NOTE: Cancellation is NOT possible - transfers are instant!
// This will always revert with TransferNotPending()
try {
  await transferContract.write.cancelTransfer([transferId]);
} catch (error) {
  console.log("Cannot cancel - transfer already completed");
}
```

## Security Features

### 1. Access Control

- Only NFT owner can initiate (and complete) transfer
- Transfer happens instantly - no admin approval needed
- No cancellation possible (transfer is immediate)

### 2. NFT Protection

- Only the authorized transfer contract can move LandOwnershipNFTs
- Ownership verification before transfer
- Legal document CID recorded on-chain for audit trail

## Integration with LandOwnershipNFT

The transfer contract must be set as the authorized contract:

```typescript
// Deploy LandTransferContract first
const transferContract = await deployContract("LandTransferContract", [
  landNFTAddress,
]);

// Set as authorized on LandOwnershipNFT
await landOwnershipNFT.write.setTransferContract([transferContract.address]);

// Now transfers can only go through this contract
```

## Events

### TransferInitiated

```solidity
event TransferInitiated(
    uint256 indexed transferId,
    uint256 indexed tokenId,
    address indexed seller,
    address buyer
);
```

### TransferCompleted

```solidity
event TransferCompleted(
    uint256 indexed transferId,
    uint256 indexed tokenId,
    address indexed seller,
    address buyer
);
```

### TransferCancelled

```solidity
event TransferCancelled(
    uint256 indexed transferId,
    uint256 indexed tokenId,
    address indexed initiator
);
```

## Error Handling

```solidity
error InvalidLandNFTContract();        // Invalid NFT contract address
error TransferNotFound();              // Transfer ID doesn't exist
error TransferAlreadyExists();         // Token already has active transfer
error TransferNotPending();            // Transfer not in pending state
error UnauthorizedCaller();            // Caller not authorized for action
error TransferFailed();                // NFT transfer failed
```

## Gas Optimization Tips

1. **Cancel early** - Cancel soon if deal falls through to free gas
2. **Batch operations** - Verify documents before initiating to avoid cancellations

## Best Practices

### For Sellers

- ✅ Upload legal documents to IPFS before initiating
- ✅ **DOUBLE-CHECK buyer wallet address** - transfer is instant and irreversible!
- ✅ Understand that once you call `initiateTransfer()`, the NFT is immediately transferred

### For Buyers

- ✅ Coordinate with seller before transfer
- ✅ Have wallet ready to receive NFT
- ✅ Verify legal documents on IPFS after receiving

### For Admins

- ✅ Monitor transfer records for audit purposes
- ✅ Keep records of legal document CIDs

## Deployment

```bash
# Deploy all contracts
npx hardhat run scripts/deployNFTs.ts --network baseSepolia

# Contracts deployed:
# - NationalIdNFT
# - LandOwnershipNFT
# - LandTransferContract (authorized automatically)
```

## Testing

```bash
# Run tests
npx hardhat test test/LandTransferContract.ts

# Test coverage should include:
# - Instant transfer execution
# - Ownership verification
# - Legal document CID recording
# - Access control
# - Error handling
# - Edge cases
```

## Monitoring

### Key Metrics to Track

- Total transfers completed
- Transfer frequency
- Legal document CID usage

### Alerts to Set Up

- 🚨 High transfer frequency from single wallet
- 🚨 Transfers without legal document CIDs
- 🚨 Unusual transfer patterns

## Future Enhancements

Possible improvements:

- [ ] Add escrow functionality with payment support
- [ ] Multi-signature approval for high-value transfers
- [ ] Automatic legal document verification (oracle)
- [ ] Time-delayed transfers with cancellation period
- [ ] Transfer history dashboard

## License

MIT
