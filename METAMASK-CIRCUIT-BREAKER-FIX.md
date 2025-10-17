# MetaMask Circuit Breaker Error Fix

## Error Message
```
Execution prevented because the circuit breaker is open
```

## What is This?
MetaMask has a built-in circuit breaker (spam protection) that triggers when:
- Too many transactions are attempted in a short time
- The RPC endpoint is overwhelmed
- There's suspicious activity detected

## Solutions

### Option 1: Wait (Easiest)
- **Wait 2-5 minutes** for the circuit breaker to reset
- Then try minting again

### Option 2: Reset MetaMask Connection
1. Click the MetaMask extension
2. Click the three dots (⋮) next to your account
3. Click **"Connected sites"**
4. Find **localhost:3000**
5. Click **"Disconnect"**
6. Refresh your browser page
7. **Reconnect** your wallet

### Option 3: Clear MetaMask Activity
1. Open MetaMask
2. Go to **Settings** → **Advanced**
3. Scroll down to **"Clear activity and nonce data"**
4. Click **"Clear"**
5. Restart browser
6. Try again

### Option 4: Use Different RPC (Best for Production)
The circuit breaker often triggers on public RPCs. Use a better RPC endpoint:

**For Base Sepolia:**
- Alchemy: `https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY`
- QuickNode: Sign up at quicknode.com
- Infura: Sign up at infura.io

Update in `client/lib/wagmi.ts`:
```typescript
transports: {
  [baseSepolia.id]: http('https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY'),
},
```

### Option 5: Switch Network Temporarily
1. Switch to a different network in MetaMask (e.g., Ethereum Mainnet)
2. Wait 30 seconds
3. Switch back to Base Sepolia
4. Try minting again

### Option 6: Use Different Wallet
- Try Coinbase Wallet instead of MetaMask
- Or use a different MetaMask account

## Prevention
- Don't spam transaction requests
- Use a dedicated RPC endpoint (Alchemy, QuickNode, Infura)
- Add delays between transaction attempts
- Use exponential backoff for retries

## For Development
If this happens frequently during development, consider:
1. Getting a free API key from Alchemy or Infura
2. Using a local blockchain (Hardhat Network) for testing
3. Adding retry logic with delays in your code
