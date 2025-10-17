# BigInt Serialization Error - Fixed

## Error Message
```
TypeError: Do not know how to serialize a BigInt
at JSON.stringify (<anonymous>)
at mintNFT
```

## Root Cause
When logging or handling errors, JavaScript tried to serialize a `BigInt` value using `JSON.stringify()`, which doesn't support `BigInt` natively.

The `consentTimestamp` was created as:
```typescript
BigInt(Date.now()) // This creates a BigInt
```

Then when catching errors, the code tried:
```typescript
const fullError = JSON.stringify(err); // ❌ Fails if err contains BigInt
```

## Solution Applied

### 1. Separate BigInt Creation
```typescript
// Calculate timestamp as regular number first
const consentTimestampMs = request.consent?.timestamp
  ? new Date(request.consent.timestamp).getTime()
  : Date.now();

// Then convert to BigInt only when passing to contract
const contractArgs = [
  // ... other args
  BigInt(consentTimestampMs), // Convert at the last moment
];
```

### 2. Safe JSON Serialization
```typescript
// Use a replacer function to handle BigInt
try {
  fullError = JSON.stringify(err, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
} catch {
  fullError = String(err);
}
```

## Key Takeaways

### BigInt Best Practices:
1. ✅ Keep values as `number` until you need `BigInt`
2. ✅ Convert to `BigInt` only when passing to smart contracts
3. ✅ Use custom replacer function when stringifying objects with BigInt
4. ✅ Never use `JSON.stringify()` directly on objects that might contain BigInt

### Alternative Serialization:
```typescript
// Option 1: Custom replacer
JSON.stringify(obj, (k, v) => typeof v === 'bigint' ? v.toString() : v)

// Option 2: BigInt prototype extension (global)
BigInt.prototype.toJSON = function() { return this.toString() }

// Option 3: Avoid serializing altogether
console.log("Value:", myBigInt.toString())
```

## Testing
After this fix, the minting should proceed without serialization errors. The next step is to actually mint the NFT (if you don't already have one with that wallet).

## Status
✅ BigInt serialization error fixed
✅ Better logging added
✅ Safe error handling implemented

Next: Test minting with a wallet that doesn't have a National ID NFT yet!
