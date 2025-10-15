# Land Transfer Contract Documentation

## Overview

The `LandTransferContract` is an authorized smart contract that facilitates regulated land ownership NFT transfers between wallets. It provides escrow functionality, fee collection, and legal compliance checks.

## Key Features

✅ **Escrow System** - Secure fund holding until transfer completion
✅ **Fee Collection** - Configurable transfer fees
✅ **Legal Compliance** - IPFS document linking for transfer agreements
✅ **Time-Limited Transfers** - Expiration dates for transfer requests
✅ **Multi-Party Control** - Seller, buyer, or admin can cancel
✅ **Refund Protection** - Automatic refunds on cancellation

## How It Works

### Transfer Flow

```
1. Seller initiates transfer
   ↓
2. Buyer deposits funds to escrow
   ↓
3. Admin verifies legal documents
   ↓
4. Admin completes transfer
   ↓
5. NFT transferred + Funds released
```

### State Diagram

```
┌──────────┐
│ Initiate │──→ seller creates transfer request
└─────┬────┘
      │
      ↓
┌──────────┐
│ Pending  │──→ buyer deposits escrow
└─────┬────┘
      │
      ├──→ Expires ──→ Can be cancelled
      │
      ├──→ Cancelled ──→ Funds refunded
      │
      ↓
┌───────────┐
│ Completed │──→ NFT + Funds transferred
└───────────┘
```

## Contract Architecture

### State Variables

```solidity
address public landOwnershipNFT;           // LandOwnershipNFT contract
uint256 public transferFeeBasisPoints;     // Fee (250 = 2.5%)
address payable public feeRecipient;       // Fee collector
uint256 public minimumPrice;               // Minimum transfer price
```

### Transfer Request Structure

```solidity
struct TransferRequest {
    uint256 tokenId;              // Land NFT being transferred
    address seller;               // Current owner
    address buyer;                // New owner
    uint256 price;                // Agreed price (wei)
    uint256 escrowedAmount;       // Funds in escrow
    TransferStatus status;        // Pending/Completed/Cancelled
    uint256 createdAt;            // Creation timestamp
    uint256 expiresAt;            // Expiration timestamp
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
    uint256 price,
    uint256 durationDays,
    string calldata legalDocumentCid
) external returns (uint256 transferId)
```

Creates a new transfer request. Locks the NFT from other transfers.

**Parameters:**

- `tokenId` - The land NFT to transfer
- `buyer` - Buyer's wallet address
- `price` - Transfer price in wei
- `durationDays` - Days until transfer expires
- `legalDocumentCid` - IPFS CID of transfer agreement

**Returns:** Transfer ID for tracking

**Example:**

```typescript
const transferId = await transferContract.write.initiateTransfer([
  tokenId,
  buyerAddress,
  ethers.parseEther("100"), // 100 ETH
  30, // 30 days
  "QmLegalDoc123...", // IPFS CID
]);
```

### For Buyers

#### depositEscrow()

```solidity
function depositEscrow(uint256 transferId) external payable
```

Deposits funds into escrow for a transfer.

**Example:**

```typescript
await transferContract.write.depositEscrow([transferId], {
  value: ethers.parseEther("100"), // Send payment
});
```

### For Admin/Owner

#### completeTransfer()

```solidity
function completeTransfer(uint256 transferId) external onlyOwner
```

Completes the transfer after legal verification. Transfers NFT and releases funds.

**Process:**

1. Verifies sufficient escrow
2. Calculates and deducts fee
3. Transfers NFT to buyer
4. Sends funds to seller
5. Sends fee to fee recipient
6. Refunds excess escrow

#### cancelTransfer()

```solidity
function cancelTransfer(uint256 transferId) external
```

Cancels a pending transfer. Can be called by seller, buyer, or admin.

**Process:**

1. Marks transfer as cancelled
2. Unlocks NFT
3. Refunds escrowed funds to buyer

#### updateFees()

```solidity
function updateFees(
    uint256 _newFeeBasisPoints,
    address payable _newFeeRecipient
) external onlyOwner
```

Updates transfer fee and recipient.

**Example:**

```typescript
// Set 3% fee
await transferContract.write.updateFees([
  300, // 3% in basis points
  feeRecipientAddress,
]);
```

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

#### calculateFee()

```solidity
function calculateFee(uint256 price)
    external view returns (uint256)
```

Calculates fee for a given price.

#### getEscrowedBalance()

```solidity
function getEscrowedBalance(address account)
    external view returns (uint256)
```

Gets total escrowed funds for an address.

## Usage Examples

### Complete Transfer Flow

```typescript
// 1. Seller initiates transfer
const sellerContract = await hre.viem.getContractAt(
  "LandTransferContract",
  transferContractAddress,
  { account: sellerAccount }
);

const transferId = await sellerContract.write.initiateTransfer([
  tokenId,
  buyerAddress,
  ethers.parseEther("100"),
  30, // 30 days
  "QmLegalDoc...",
]);

console.log("Transfer initiated:", transferId);

// 2. Buyer deposits escrow
const buyerContract = await hre.viem.getContractAt(
  "LandTransferContract",
  transferContractAddress,
  { account: buyerAccount }
);

await buyerContract.write.depositEscrow([transferId], {
  value: ethers.parseEther("100"),
});

console.log("Funds escrowed");

// 3. Admin verifies documents (off-chain)
// ... legal verification process ...

// 4. Admin completes transfer
const adminContract = await hre.viem.getContractAt(
  "LandTransferContract",
  transferContractAddress,
  { account: adminAccount }
);

await adminContract.write.completeTransfer([transferId]);

console.log("Transfer completed!");
```

### Query Transfer Status

```typescript
const transfer = await transferContract.read.getTransferDetails([transferId]);

console.log({
  tokenId: transfer.tokenId,
  seller: transfer.seller,
  buyer: transfer.buyer,
  price: ethers.formatEther(transfer.price),
  status: transfer.status, // 0=Pending, 1=Completed, 2=Cancelled
  escrowed: ethers.formatEther(transfer.escrowedAmount),
  expires: new Date(Number(transfer.expiresAt) * 1000),
});
```

### Cancel Transfer

```typescript
// Seller, buyer, or admin can cancel
await transferContract.write.cancelTransfer([transferId]);

console.log("Transfer cancelled, funds refunded");
```

## Fee Structure

Fees are calculated in **basis points** (1 basis point = 0.01%):

| Basis Points | Percentage | Example (100 ETH sale)          |
| ------------ | ---------- | ------------------------------- |
| 100          | 1%         | 1 ETH fee, 99 ETH to seller     |
| 250          | 2.5%       | 2.5 ETH fee, 97.5 ETH to seller |
| 500          | 5%         | 5 ETH fee, 95 ETH to seller     |
| 1000         | 10% (max)  | 10 ETH fee, 90 ETH to seller    |

**Default:** 250 basis points (2.5%)

## Security Features

### 1. Reentrancy Protection

- Uses `ReentrancyGuard` on all state-changing functions
- Prevents reentrancy attacks during fund transfers

### 2. Access Control

- Only NFT owner can initiate transfer
- Only specified buyer can deposit escrow
- Only admin can complete transfer
- Multi-party can cancel (seller, buyer, or admin)

### 3. Fund Safety

- Escrowed funds tracked per buyer
- Automatic refunds on cancellation
- Excess escrow automatically refunded
- Emergency withdrawal for owner (last resort)

### 4. NFT Protection

- Token locked during active transfer
- Only one transfer per token at a time
- Transfer must complete or cancel to unlock

## Integration with LandOwnershipNFT

The transfer contract must be set as the authorized contract:

```typescript
// Deploy LandTransferContract first
const transferContract = await deployContract("LandTransferContract", [...]);

// Set as authorized on LandOwnershipNFT
await landOwnershipNFT.write.setTransferContract([
  transferContract.address
]);

// Now transfers can only go through this contract
```

## Events

### TransferInitiated

```solidity
event TransferInitiated(
    uint256 indexed transferId,
    uint256 indexed tokenId,
    address indexed seller,
    address buyer,
    uint256 price
);
```

### FundsEscrowed

```solidity
event FundsEscrowed(
    uint256 indexed transferId,
    address indexed buyer,
    uint256 amount
);
```

### TransferCompleted

```solidity
event TransferCompleted(
    uint256 indexed transferId,
    uint256 indexed tokenId,
    address indexed seller,
    address buyer,
    uint256 price,
    uint256 fee
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
error TransferNotFound();          // Transfer ID doesn't exist
error TransferAlreadyExists();     // Token already has active transfer
error TransferExpired();           // Transfer past expiration date
error TransferNotPending();        // Transfer not in pending state
error UnauthorizedCaller();        // Caller not authorized for action
error InsufficientEscrow();        // Not enough funds in escrow
error PriceBelowMinimum();         // Price below minimum threshold
error InvalidPrice();              // Price is zero
error TransferFailed();            // Native transfer failed
```

## Gas Optimization Tips

1. **Batch deposits** - Deposit full amount once instead of multiple times
2. **Cancel early** - Cancel soon if deal falls through to free gas
3. **Set realistic durations** - Don't set unnecessarily long expiration

## Best Practices

### For Sellers

- ✅ Upload legal documents to IPFS before initiating
- ✅ Set reasonable expiration (30-60 days typical)
- ✅ Set price above minimum
- ✅ Cancel promptly if buyer backs out

### For Buyers

- ✅ Verify legal documents before depositing
- ✅ Deposit full amount promptly
- ✅ Keep some ETH for gas fees
- ✅ Monitor expiration date

### For Admins

- ✅ Verify all legal documents thoroughly
- ✅ Complete transfers promptly after verification
- ✅ Monitor for expired transfers
- ✅ Keep fee recipient updated

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
- Total value transferred
- Average transfer duration
- Cancellation rate
- Fee revenue collected

### Alerts to Set Up

- 🚨 Transfer expired without completion
- 🚨 Insufficient escrow after deadline
- 🚨 Unusual fee changes
- 🚨 High cancellation rate

## Future Enhancements

Possible improvements:

- [ ] Multi-signature approval for high-value transfers
- [ ] Automatic legal document verification (oracle)
- [ ] Installment payments
- [ ] Dispute resolution mechanism
- [ ] Secondary market integration
- [ ] Auction functionality

## License

MIT
