# 🚀 Quick Start: Using Your Deployed Contracts

## Contract Addresses (Base Sepolia)

```typescript
NationalIdNFT: 0xbe5fb46274763165a8e9bda180273b75d817fec0;
LandOwnershipNFT: 0xdfaf754cc95a9060bd6e467a652f9642e9e33c26;
LandTransferContract: 0xecc7d23c7d82bbaf59cd0b40329d24fd42617467;
```

---

## 📦 Import ABIs in Your Components

### Option 1: Direct Import

```typescript
import NationalIdNFT from "@/src/abis/NationalIdNFT.json";
import LandOwnershipNFT from "@/src/abis/LandOwnershipNFT.json";
import LandTransferContract from "@/src/abis/LandTransferContract.json";
```

### Option 2: Use Contract Constants

```typescript
import { CONTRACTS } from "@/lib/contracts";

// Access addresses
const nationalIdAddress = CONTRACTS.NationalIdNFT.address;
```

---

## 🔧 Basic Wagmi Usage

### Read from Contract (Free, No Gas)

```typescript
import { useReadContract } from "wagmi";
import NationalIdNFT from "@/src/abis/NationalIdNFT.json";

function MyComponent() {
  const { data: balance } = useReadContract({
    address: NationalIdNFT.address as `0x${string}`,
    abi: NationalIdNFT.abi,
    functionName: "balanceOf",
    args: [userAddress],
  });

  return <div>Balance: {balance?.toString()}</div>;
}
```

### Write to Contract (Costs Gas)

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import LandOwnershipNFT from "@/src/abis/LandOwnershipNFT.json";

function ListLandForSale() {
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleListForSale = () => {
    writeContract({
      address: LandOwnershipNFT.address as `0x${string}`,
      abi: LandOwnershipNFT.abi,
      functionName: "listForSale",
      args: [tokenId, salePrice],
    });
  };

  return (
    <button onClick={handleListForSale} disabled={isLoading}>
      {isLoading ? "Listing..." : "List for Sale"}
    </button>
  );
}
```

---

## 📋 Available Contract Functions

### NationalIdNFT (`0xbe5f...fec0`)

**Read Functions:**

- `balanceOf(address)` - Get number of IDs owned
- `ownerOf(tokenId)` - Get owner of specific ID
- `tokenURI(tokenId)` - Get metadata URI
- `name()` - Get contract name
- `symbol()` - Get contract symbol

**Write Functions (Admin Only):**

- `safeMint(address to, string uri)` - Mint new ID
- `burn(tokenId)` - Burn an ID

---

### LandOwnershipNFT (`0xdfaf...3c26`)

**Read Functions:**

- `balanceOf(address)` - Get number of land parcels owned
- `ownerOf(tokenId)` - Get owner of land parcel
- `tokenURI(tokenId)` - Get land metadata
- `isForSale(tokenId)` - Check if land is listed for sale
- `salePrice(tokenId)` - Get sale price if listed

**Write Functions:**

- `safeMint(address to, string uri)` - Mint new land (admin)
- `listForSale(tokenId, price)` - List land for sale
- `unlistFromSale(tokenId)` - Remove from sale
- `approve(address, tokenId)` - Approve transfer

---

### LandTransferContract (`0xecc7...7467`)

**Read Functions:**

- `transferFeeBasisPoints()` - Get fee (250 = 2.5%)
- `calculateFee(price)` - Calculate fee for a price
- `feeRecipient()` - Get fee recipient address

**Write Functions:**

- `purchaseLand(tokenId)` - Buy land (send ETH)
- `updateTransferFee(newFee)` - Update fee (owner only)
- `updateFeeRecipient(newRecipient)` - Update recipient (owner only)

---

## 💡 Example: Complete Purchase Flow

```typescript
import { useReadContract, useWriteContract } from "wagmi";
import LandOwnershipNFT from "@/src/abis/LandOwnershipNFT.json";
import LandTransferContract from "@/src/abis/LandTransferContract.json";

function PurchaseLand({ tokenId }: { tokenId: bigint }) {
  // 1. Get sale price
  const { data: salePrice } = useReadContract({
    address: LandOwnershipNFT.address as `0x${string}`,
    abi: LandOwnershipNFT.abi,
    functionName: "salePrice",
    args: [tokenId],
  });

  // 2. Calculate fee
  const { data: fee } = useReadContract({
    address: LandTransferContract.address as `0x${string}`,
    abi: LandTransferContract.abi,
    functionName: "calculateFee",
    args: salePrice ? [salePrice] : undefined,
  });

  // 3. Purchase
  const { writeContract, isPending } = useWriteContract();

  const handlePurchase = () => {
    if (!salePrice || !fee) return;

    const totalPrice = salePrice + fee;

    writeContract({
      address: LandTransferContract.address as `0x${string}`,
      abi: LandTransferContract.abi,
      functionName: "purchaseLand",
      args: [tokenId],
      value: totalPrice, // Send ETH
    });
  };

  return (
    <div>
      <p>Price: {salePrice?.toString()} wei</p>
      <p>Fee: {fee?.toString()} wei</p>
      <button onClick={handlePurchase} disabled={isPending}>
        {isPending ? "Purchasing..." : "Purchase Land"}
      </button>
    </div>
  );
}
```

---

## 🔗 Useful Links

- **Your Contracts on BaseScan:**

  - [NationalIdNFT](https://sepolia.basescan.org/address/0xbe5fb46274763165a8e9bda180273b75d817fec0)
  - [LandOwnershipNFT](https://sepolia.basescan.org/address/0xdfaf754cc95a9060bd6e467a652f9642e9e33c26)
  - [LandTransferContract](https://sepolia.basescan.org/address/0xecc7d23c7d82bbaf59cd0b40329d24fd42617467)

- **Documentation:**

  - [Wagmi Docs](https://wagmi.sh)
  - [Viem Docs](https://viem.sh)
  - [Base Docs](https://docs.base.org)

- **Get Testnet ETH:**
  - [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)

---

## ✅ Next Steps

1. **Test in your app:**

   - Import ABIs in your components
   - Use `useReadContract` to display data
   - Use `useWriteContract` for transactions

2. **Add to existing hooks:**

   - Create custom hooks like `useHasNationalId()`
   - Wrap contract calls for cleaner code

3. **Error handling:**

   ```typescript
   const { data, error, isLoading } = useReadContract({
     // ... config
   });

   if (error) return <div>Error: {error.message}</div>;
   if (isLoading) return <div>Loading...</div>;
   ```

4. **Transaction feedback:**

   ```typescript
   const { writeContract, data: hash } = useWriteContract();
   const { isSuccess } = useWaitForTransactionReceipt({ hash });

   useEffect(() => {
     if (isSuccess) {
       toast.success("Transaction confirmed!");
     }
   }, [isSuccess]);
   ```

---

**Your contracts are ready to use! 🎉**
