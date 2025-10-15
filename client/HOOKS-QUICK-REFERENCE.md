# 🎯 Quick Reference - Contract Hooks

## Import Statement

```typescript
import {
  useHasNationalId,
  useLandBalance,
  useLandPurchaseFlow,
} from "@/hooks/useContracts";
```

---

## National ID Hooks

### ✅ Check if User Has ID

```typescript
const { hasNationalId, balance, isLoading } = useHasNationalId(
  address ?? undefined
);
```

### 📄 Get Token Metadata

```typescript
const { data: tokenURI } = useNationalIdTokenURI(tokenId);
```

### 👤 Get Token Owner

```typescript
const { data: owner } = useNationalIdOwner(tokenId);
```

### 🔨 Mint (Admin Only)

```typescript
const { mint, isPending, isSuccess } = useMintNationalId();
mint(recipientAddress, metadataURI);
```

---

## Land Ownership Hooks

### 🏠 Get Land Balance

```typescript
const { data: landCount } = useLandBalance(address ?? undefined);
```

### 📄 Get Land Metadata

```typescript
const { data: tokenURI } = useLandTokenURI(tokenId);
```

### 👤 Get Land Owner

```typescript
const { data: owner } = useLandOwner(tokenId);
```

### 💰 Check If For Sale

```typescript
const { data: isForSale } = useIsLandForSale(tokenId);
const { data: salePrice } = useLandSalePrice(tokenId);
```

### 📝 List For Sale

```typescript
const { listForSale, isPending } = useListLandForSale();
listForSale(tokenId, priceInWei);
```

### ❌ Unlist From Sale

```typescript
const { unlist, isPending } = useUnlistLandFromSale();
unlist(tokenId);
```

### 🔨 Mint Land (Admin Only)

```typescript
const { mint, isPending } = useMintLand();
mint(recipientAddress, metadataURI);
```

---

## Transfer Contract Hooks

### 💵 Get Transfer Fee

```typescript
const { data: feeBasisPoints } = useTransferFee();
// Returns 250 for 2.5%
```

### 🧮 Calculate Fee

```typescript
const { data: fee } = useCalculateTransferFee(salePrice);
```

### 🛒 Purchase Land

```typescript
const { purchase, isPending } = usePurchaseLand();
purchase(tokenId, totalPrice);
```

### 🎯 Complete Purchase Flow (Recommended)

```typescript
const { salePrice, fee, totalPrice, executePurchase, isPending, isSuccess } =
  useLandPurchaseFlow(tokenId);

executePurchase(); // Handles everything!
```

---

## Helper Hooks

### 📊 Get All Land Details

```typescript
const { owner, tokenURI, isForSale, salePrice } = useLandDetails(tokenId);
```

---

## Common Patterns

### Loading State

```typescript
const { data, isLoading, error } = useHook();

if (isLoading) return <Spinner />;
if (error) return <Error />;
return <Display data={data} />;
```

### Transaction State

```typescript
const { write, isPending, isSuccess, hash } = useWriteHook();

useEffect(() => {
  if (isSuccess) {
    toast.success("Success!");
  }
}, [isSuccess]);
```

### Format BigInt

```typescript
import { formatEther, parseEther } from "viem";

const ethValue = formatEther(weiValue);
const weiValue = parseEther("1.5"); // 1.5 ETH
```

---

## Contract Addresses

```typescript
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

CONTRACT_ADDRESSES.NationalIdNFT;
CONTRACT_ADDRESSES.LandOwnershipNFT;
CONTRACT_ADDRESSES.LandTransferContract;
```

All on **Base Sepolia** (84532)
