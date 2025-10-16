# Land Transfer Contract Documentation

## Overview

The `LandTransferContract` is an authorized smart contract that facilitates **FREE** land ownership NFT transfers between wallets. It provides a simple transfer mechanism that only requires the recipient's wallet address.

## Key Features

✅ **FREE Transfers** - No payment or fees required
✅ **Simple Process** - Only needs recipient wallet address
✅ **Legal Compliance** - IPFS document linking for transfer agreements
✅ **Multi-Party Control** - Seller, buyer, or admin can cancel
✅ **Transfer Lock** - Prevents concurrent transfers of same NFT

## How It Works

### Transfer Flow

```
1. Seller initiates transfer with recipient wallet
   ↓
2. Admin verifies legal documents (off-chain)
   ↓
3. Admin completes transfer
   ↓
4. NFT transferred to recipient (FREE)
```

### State Diagram

```
┌──────────┐
│ Initiate │──→ seller creates transfer request (FREE)
└─────┬────┘
      │
      ↓
┌──────────┐
│ Pending  │──→ waiting for admin verification
└─────┬────┘
      │
      ├──→ Cancelled ──→ Transfer unlocked
      │
      ↓
┌───────────┐
│ Completed │──→ NFT transferred (NO PAYMENT)
└───────────┘
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

Creates a new FREE transfer request. Locks the NFT from other transfers.

**Parameters:**

- `tokenId` - The land NFT to transfer
- `buyer` - Buyer's wallet address
- `legalDocumentCid` - IPFS CID of transfer agreement

**Returns:** Transfer ID for tracking

**Example:**

```typescript
const transferId = await transferContract.write.initiateTransfer([
  tokenId,
  buyerAddress,
  "QmLegalDoc123...", // IPFS CID
]);
```

### For Buyers

No action required! Transfer is FREE - just wait for admin completion.

### For Admin/Owner

#### completeTransfer()

```solidity
function completeTransfer(uint256 transferId) external onlyOwner
```

Completes the FREE transfer after verification. Transfers NFT to buyer.

**Process:**

1. Verifies transfer is pending
2. Transfers NFT to buyer
3. Marks transfer as completed
4. Unlocks NFT

#### cancelTransfer()

```solidity
function cancelTransfer(uint256 transferId) external
```

Cancels a pending transfer. Can be called by seller, buyer, or admin.

**Process:**

1. Marks transfer as cancelled
2. Unlocks NFT

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
// 1. Seller initiates FREE transfer
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

console.log("Transfer initiated:", transferId);

// 2. Admin verifies documents (off-chain)
// ... legal verification process ...

// 3. Admin completes FREE transfer
const adminContract = await hre.viem.getContractAt(
  "LandTransferContract",
  transferContractAddress,
  { account: adminAccount }
);

await adminContract.write.completeTransfer([transferId]);

console.log("FREE transfer completed!");
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
// Seller, buyer, or admin can cancel
await transferContract.write.cancelTransfer([transferId]);

console.log("Transfer cancelled");
```

## Security Features

### 1. Access Control

- Only NFT owner can initiate transfer
- Only admin can complete transfer
- Multi-party can cancel (seller, buyer, or admin)

### 2. NFT Protection

- Token locked during active transfer
- Only one transfer per token at a time
- Transfer must complete or cancel to unlock

## Integration with LandOwnershipNFT

The transfer contract must be set as the authorized contract:

```typescript
// Deploy LandTransferContract first
const transferContract = await deployContract("LandTransferContract", [landNFTAddress]);

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
- ✅ Verify buyer wallet address is correct
- ✅ Cancel promptly if buyer backs out

### For Buyers

- ✅ Verify legal documents before accepting
- ✅ Coordinate with seller on transfer timing
- ✅ Have wallet ready to receive NFT

### For Admins

- ✅ Verify all legal documents thoroughly
- ✅ Complete transfers promptly after verification
- ✅ Keep good records of all transfers

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
# - Transfer initiation
# - Escrow deposits
# - Transfer completion
# - Cancellation
# - Fee calculation
# - Access control
# - Edge cases
```

## Monitoring

### Key Metrics to Track

- Total transfers initiated
- Total transfers completed
- Average transfer duration
- Cancellation rate

### Alerts to Set Up

- 🚨 Transfer pending for too long
- 🚨 High cancellation rate
- 🚨 Unusual transfer patterns

## Future Enhancements

Possible improvements:

- [ ] Multi-signature approval for high-value transfers
- [ ] Automatic legal document verification (oracle)
- [ ] Dispute resolution mechanism
- [ ] Transfer history dashboard

## License

MIT
