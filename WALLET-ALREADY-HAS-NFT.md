# Check if Wallet Already Has NFT

You can verify on Base Sepolia Block Explorer:

**Your Wallet:** `0xFEf5186c2dB14c06A1918581E85D4B4640d5FABC`

**National ID NFT Contract:** `0x7c7460c78336108964588d4de147d47c20606c6d`

## Check Methods:

### Option 1: Block Explorer
1. Go to: https://sepolia.basescan.org/address/0xFEf5186c2dB14c06A1918581E85D4B4640d5FABC
2. Click the "Tokens" tab
3. Look for "National ID Proof (NATID)" token

### Option 2: Read Contract
1. Go to: https://sepolia.basescan.org/address/0x7c7460c78336108964588d4de147d47c20606c6d#readContract
2. Find function `hasNationalId`
3. Enter your wallet: `0xFEf5186c2dB14c06A1918581E85D4B4640d5FABC`
4. Click "Query"
5. If it returns `true`, you already have one!

### Option 3: Read from Your App
Add this to your requests page to check first:

```typescript
const { data: hasNationalId } = useReadContract({
  address: '0x7c7460c78336108964588d4de147d47c20606c6d',
  abi: NationalIdNFTABI.abi,
  functionName: 'hasNationalId',
  args: [address],
});

console.log('Already has National ID:', hasNationalId);
```

## Solutions:

### Solution 1: Use a Different Wallet
Try minting with a different wallet address that doesn't have a National ID yet.

### Solution 2: Check Before Minting
Add a check in your UI to hide the mint button if user already has an NFT:

```typescript
const { data: hasNFT } = useHasNationalId(address);

// In your component:
{!hasNFT && <Button onClick={handleMint}>Mint NFT</Button>}
{hasNFT && <Badge>Already Minted</Badge>}
```

### Solution 3: Show Better Error Message
The error is showing "circuit breaker" but it's actually "WalletAlreadyHasNationalId". Let me fix the error detection!
