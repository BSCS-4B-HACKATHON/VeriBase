# How to Get Free RPC API Keys

## Alchemy (Recommended - Easy Setup)

1. Go to https://www.alchemy.com/
2. Click "Get started for free"
3. Sign up with email or Google
4. Create a new app:
   - Name: "VeriBase"
   - Chain: "Base"
   - Network: "Base Sepolia"
5. Copy your HTTP URL (looks like: `https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY`)

### Update wagmi.ts:
```typescript
transports: {
  [baseSepolia.id]: http('https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY'),
},
```

## QuickNode (Alternative)

1. Go to https://www.quicknode.com/
2. Sign up for free
3. Create endpoint:
   - Chain: "Base"
   - Network: "Sepolia Testnet"
4. Copy HTTP endpoint

## Infura (Alternative)

1. Go to https://infura.io/
2. Sign up
3. Create new API key
4. Select "Base Sepolia"
5. Copy endpoint URL

## Environment Variable Approach (Best Practice)

Add to `.env.local`:
```env
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

Update `wagmi.ts`:
```typescript
transports: {
  [baseSepolia.id]: http(
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'
  ),
},
```

## Free Tier Limits
- **Alchemy**: 300M compute units/month (plenty for development)
- **QuickNode**: 500K requests/month
- **Infura**: 100K requests/day

Any of these will prevent the circuit breaker issue!
