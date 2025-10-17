# NFT Minting Fix - October 17, 2025

## Issues Fixed

### 1. ✅ Contract Address Mismatch
**Problem**: Contract addresses in `contracts.ts` didn't match deployed addresses
**Solution**: Updated to correct Base Sepolia addresses:
- NationalIdNFT: `0x7c7460c78336108964588d4de147d47c20606c6d`
- LandOwnershipNFT: `0xeca5a68f0e3ba9d09949d146d963531ef6853faf`
- LandTransferContract: `0x36f4969c4966ff718bd489af9d4dc1257f4489f2`

### 2. ✅ Network Detection & Switching
**Problem**: Chain ID was undefined, causing "Wrong network" errors
**Solution**: 
- Added `chainId` parameter to `useWalletClient` and `usePublicClient`
- Integrated `useSwitchChain` hook for automatic network switching
- Added automatic network switch before minting

### 3. ✅ Better User Experience
**Problem**: Users had to manually switch networks
**Solution**:
- Mint button now attempts to switch network automatically
- Better error messages and loading states
- Toast notifications for network switching

## Files Modified

### Client
1. `client/lib/contracts.ts` - Updated contract addresses
2. `client/hooks/useClientMint.ts` - Added network switching logic
3. `client/components/request-card.tsx` - Improved UX with auto-switch

### Server
1. `server/src/utils/contracts.ts` - Updated fallback addresses

## Testing Steps

1. **Start Development Servers**:
   ```bash
   # Terminal 1 - Client
   cd d:\veri-base\client
   npm run dev
   
   # Terminal 2 - Server
   cd d:\veri-base\server
   npm run dev
   ```

2. **Test Minting**:
   - Go to `http://localhost:3000/requests`
   - Connect your wallet (any network is fine)
   - Click "Mint NFT" on a verified request
   - The app will automatically switch to Base Sepolia
   - Confirm the transaction in your wallet
   - Wait for confirmation (should take 2-5 seconds)

3. **Verify Success**:
   - Check the toast notification for success message
   - Click "View on Explorer" to see transaction
   - Page will auto-refresh and request will be removed

## Key Changes in Code

### useClientMint.ts
```typescript
// Added automatic network switching
const { switchChain, switchChainAsync } = useSwitchChain();

// Specify chainId for clients
const { data: walletClient } = useWalletClient({ chainId: baseSepolia.id });
const publicClient = usePublicClient({ chainId: baseSepolia.id });

// Auto-switch network if wrong
if (chain?.id !== baseSepolia.id) {
  await switchChainAsync?.({ chainId: baseSepolia.id });
}
```

### request-card.tsx
```typescript
// Handle network switching in UI
if (!isCorrectNetwork && switchToBaseSepolia) {
  toast.info("Switching to Base Sepolia network...");
  await switchToBaseSepolia();
  toast.success("Switched to Base Sepolia!");
}
```

## Expected Behavior

1. **User clicks "Mint NFT"**
2. **If wrong network**: Automatically prompts wallet to switch to Base Sepolia
3. **After switch**: Proceeds with minting
4. **User signs transaction** in wallet
5. **Transaction confirms** on Base Sepolia
6. **Success toast** appears with transaction link
7. **Request auto-deletes** from database
8. **Page refreshes** to show updated list

## Troubleshooting

### "Transaction failed"
- Check wallet has enough ETH on Base Sepolia (get from faucet)
- Verify wallet address matches request wallet
- Check contract addresses in `.env` file

### "Network switch failed"
- User rejected network switch in wallet
- Wallet doesn't support automatic network switching
- Ask user to switch manually to Base Sepolia

### "Wallet not ready"
- Refresh page and reconnect wallet
- Check browser console for errors
- Verify wagmi providers are properly configured

## Contract Functions Used

### National ID NFT
```solidity
function mintNationalId(
    string memory requestType,
    string memory minimalPublicLabel,
    string memory metadataCid,
    string memory metadataHash,
    string memory uploaderSignature,
    string memory consentTextVersion,
    uint256 consentTimestamp
) external returns (uint256)
```

### Land Ownership NFT
```solidity
function mintLandOwnership(
    string memory requestType,
    string memory minimalPublicLabel,
    string memory metadataCid,
    string memory metadataHash,
    string memory uploaderSignature,
    string memory consentTextVersion,
    uint256 consentTimestamp
) external returns (uint256)
```

## Next Steps

- [ ] Test minting National ID NFT
- [ ] Test minting Land Ownership NFT
- [ ] Verify NFTs appear in `/nfts` page
- [ ] Check transaction on Base Sepolia block explorer
- [ ] Test with different wallet providers (MetaMask, Coinbase Wallet)
