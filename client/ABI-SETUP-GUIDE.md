# 🎯 ABI Setup Complete - Usage Guide

## ✅ What's Ready

Your ABIs are fully set up and ready to use! Here's what you have:

### 📁 Files Created

1. **`client/lib/contracts.ts`** - Contract addresses and ABIs
2. **`client/hooks/useContracts.ts`** - Ready-to-use React hooks
3. **`client/src/abis/`** - JSON files with ABIs and addresses

---

## 🚀 Quick Start

### 1. Import What You Need

```typescript
// Import hooks
import {
  useHasNationalId,
  useLandBalance,
  useLandPurchaseFlow,
} from "@/hooks/useContracts";

// Or import contract config directly
import { CONTRACTS, CONTRACT_ADDRESSES } from "@/lib/contracts";
```

### 2. Use in Your Components

#### Check if User Has National ID

```typescript
import { useHasNationalId } from "@/hooks/useContracts";
import { useWallet } from "@/hooks/useWallet";

function MyComponent() {
  const { address } = useWallet();
  const { hasNationalId, balance, isLoading } = useHasNationalId(address);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {hasNationalId ? (
        <p>✅ You have a National ID NFT</p>
      ) : (
        <p>❌ No National ID found</p>
      )}
    </div>
  );
}
```

#### Check User's Land Holdings

```typescript
import { useLandBalance } from "@/hooks/useContracts";

function LandHoldings() {
  const { address } = useWallet();
  const { data: landCount, isLoading } = useLandBalance(address);

  return (
    <div>
      <h3>Your Land Holdings</h3>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <p>You own {landCount?.toString() ?? "0"} land parcels</p>
      )}
    </div>
  );
}
```

#### Purchase Land (Complete Flow)

```typescript
import { useLandPurchaseFlow } from "@/hooks/useContracts";
import { formatEther } from "viem";

function PurchaseLandButton({ tokenId }: { tokenId: bigint }) {
  const {
    salePrice,
    fee,
    totalPrice,
    isLoading,
    executePurchase,
    isPending,
    isSuccess,
  } = useLandPurchaseFlow(tokenId);

  if (isLoading) return <div>Loading price...</div>;

  return (
    <div>
      <p>Price: {formatEther(salePrice ?? 0n)} ETH</p>
      <p>Fee: {formatEther(fee ?? 0n)} ETH</p>
      <p>
        <strong>Total: {formatEther(totalPrice ?? 0n)} ETH</strong>
      </p>

      <button onClick={executePurchase} disabled={isPending || !totalPrice}>
        {isPending ? "Purchasing..." : "Purchase Land"}
      </button>

      {isSuccess && <p className="text-green-600">✅ Purchase successful!</p>}
    </div>
  );
}
```

---

## 📚 Available Hooks

### National ID NFT

| Hook                             | Purpose                         |
| -------------------------------- | ------------------------------- |
| `useHasNationalId(address)`      | Check if wallet has National ID |
| `useNationalIdTokenURI(tokenId)` | Get token metadata URI          |
| `useNationalIdOwner(tokenId)`    | Get token owner                 |
| `useMintNationalId()`            | Mint new National ID (admin)    |

### Land Ownership NFT

| Hook                        | Purpose                          |
| --------------------------- | -------------------------------- |
| `useLandBalance(address)`   | Get number of land parcels owned |
| `useLandTokenURI(tokenId)`  | Get land metadata URI            |
| `useLandOwner(tokenId)`     | Get land owner                   |
| `useIsLandForSale(tokenId)` | Check if land is for sale        |
| `useLandSalePrice(tokenId)` | Get sale price                   |
| `useMintLand()`             | Mint new land (admin)            |
| `useListLandForSale()`      | List land for sale               |
| `useUnlistLandFromSale()`   | Remove from sale                 |

### Land Transfer Contract

| Hook                             | Purpose                   |
| -------------------------------- | ------------------------- |
| `useTransferFee()`               | Get fee in basis points   |
| `useFeeRecipient()`              | Get fee recipient address |
| `useCalculateTransferFee(price)` | Calculate fee for price   |
| `usePurchaseLand()`              | Purchase land with fee    |
| `useLandPurchaseFlow(tokenId)`   | Complete purchase flow    |

### Helper Hooks

| Hook                      | Purpose                          |
| ------------------------- | -------------------------------- |
| `useLandDetails(tokenId)` | Get all data about a land parcel |

---

## 💡 Pro Tips

### 1. Loading States

All hooks return `isLoading` - always check it:

```typescript
const { data, isLoading, error } = useLandBalance(address);

if (isLoading) return <Spinner />;
if (error) return <Error message={error.message} />;
```

### 2. Transaction States

Write hooks return `isPending` and `isSuccess`:

```typescript
const { mint, isPending, isSuccess } = useMintLand();

useEffect(() => {
  if (isSuccess) {
    toast.success("Land minted successfully!");
  }
}, [isSuccess]);
```

### 3. Format BigInt Values

Use `formatEther` from viem:

```typescript
import { formatEther, parseEther } from "viem";

// Format for display
const priceInEth = formatEther(salePrice);

// Parse user input
const priceInWei = parseEther("1.5"); // 1.5 ETH
```

### 4. Conditional Queries

Hooks won't run if required data is missing:

```typescript
// This won't call the contract if tokenId is undefined
const { data } = useLandTokenURI(tokenId);
```

---

## 🔧 Direct Contract Access

If you need more control, import directly:

```typescript
import { useReadContract, useWriteContract } from "wagmi";
import { CONTRACTS } from "@/lib/contracts";

function CustomComponent() {
  const { data } = useReadContract({
    ...CONTRACTS.LandOwnershipNFT,
    functionName: "yourCustomFunction",
    args: [arg1, arg2],
  });
}
```

---

## 🎯 Contract Addresses

Quick reference (also in `lib/contracts.ts`):

```typescript
NationalIdNFT: 0xbe5fb46274763165a8e9bda180273b75d817fec0;
LandOwnershipNFT: 0xdfaf754cc95a9060bd6e467a652f9642e9e33c26;
LandTransferContract: 0xecc7d23c7d82bbaf59cd0b40329d24fd42617467;
```

All on **Base Sepolia** (Chain ID: 84532)

---

## 🔗 View on BaseScan

- [NationalIdNFT](https://sepolia.basescan.org/address/0xbe5fb46274763165a8e9bda180273b75d817fec0)
- [LandOwnershipNFT](https://sepolia.basescan.org/address/0xdfaf754cc95a9060bd6e467a652f9642e9e33c26)
- [LandTransferContract](https://sepolia.basescan.org/address/0xecc7d23c7d82bbaf59cd0b40329d24fd42617467)

---

## ✅ You're All Set!

Your ABIs are configured and ready. Start using them in your components! 🎊
