# 📊 Stats API Quick Reference

## Endpoints

### Global Statistics

```http
GET /api/stats/global
```

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalRequests": 156,
    "pendingRequests": 23,
    "verifiedRequests": 89,
    "rejectedRequests": 44,
    "nationalIdRequests": 78,
    "landOwnershipRequests": 78,
    "totalUsers": 127,
    "totalNFTsMinted": 89,
    "nationalIdNFTsMinted": 45,
    "landOwnershipNFTsMinted": 44,
    "approvalRate": "57.1",
    "rejectionRate": "28.2"
  }
}
```

### User Statistics

```http
GET /api/stats/user/:walletAddress
```

**Response:**

```json
{
  "success": true,
  "stats": {
    "totalRequests": 5,
    "pendingRequests": 2,
    "verifiedRequests": 1,
    "rejectedRequests": 0,
    "nationalIdRequests": 3,
    "landOwnershipRequests": 2,
    "totalNFTsOwned": 3,
    "nationalIdNFTsOwned": 2,
    "landOwnershipNFTsOwned": 1,
    "recentRequests": [
      {
        "id": "req_123",
        "type": "national_id",
        "status": "verified",
        "createdAt": "2025-10-15T10:30:00Z",
        "minimalPublicLabel": "National ID Verification"
      }
    ]
  }
}
```

## Frontend Usage

### Import Helper

```typescript
import { fetchGlobalStats, fetchUserStats } from "@/lib/stats";
```

### Fetch Global Stats

```typescript
const stats = await fetchGlobalStats();
if (stats) {
  console.log("Total NFTs:", stats.totalNFTsMinted);
  console.log("Approval Rate:", stats.approvalRate);
}
```

### Fetch User Stats

```typescript
const userStats = await fetchUserStats("0xUserWalletAddress");
if (userStats) {
  console.log("NFTs Owned:", userStats.totalNFTsOwned);
  console.log("Pending:", userStats.pendingRequests);
}
```

## Data Sources

| Stat                    | Source     | Method                                 |
| ----------------------- | ---------- | -------------------------------------- |
| totalRequests           | MongoDB    | `countDocuments()`                     |
| pendingRequests         | MongoDB    | `countDocuments({status: 'pending'})`  |
| verifiedRequests        | MongoDB    | `countDocuments({status: 'verified'})` |
| rejectedRequests        | MongoDB    | `countDocuments({status: 'rejected'})` |
| totalUsers              | MongoDB    | `distinct('requesterWallet')`          |
| totalNFTsMinted         | Blockchain | `totalSupply()`                        |
| nationalIdNFTsMinted    | Blockchain | `NationalIdNFT.totalSupply()`          |
| landOwnershipNFTsMinted | Blockchain | `LandOwnershipNFT.totalSupply()`       |
| totalNFTsOwned          | Blockchain | `balanceOf(address)`                   |
| approvalRate            | Calculated | `(verified / total) * 100`             |
| rejectionRate           | Calculated | `(rejected / total) * 100`             |

## Smart Contracts

### NationalIdNFT

- **Address**: `0x57c236c2097c49c6f3c998b2fcf07f67596dc5f4`
- **Network**: Base Sepolia
- **Functions Used**: `totalSupply()`, `balanceOf(address)`

### LandOwnershipNFT

- **Address**: `0x7d59c36de7c8825b55c73038fa6bcfd52f903c7a`
- **Network**: Base Sepolia
- **Functions Used**: `totalSupply()`, `balanceOf(address)`

## Environment Variables

### Server

```env
MONGO_URI=mongodb+srv://...
BLOCKCHAIN_RPC_URL=https://sepolia.base.org
NATIONAL_ID_NFT_ADDRESS=0x57c236c2097c49c6f3c998b2fcf07f67596dc5f4
LAND_OWNERSHIP_NFT_ADDRESS=0x7d59c36de7c8825b55c73038fa6bcfd52f903c7a
```

### Client

```env
NEXT_PUBLIC_BE_URL=http://localhost:6969
```

## Testing Commands

```bash
# Test global stats
curl http://localhost:6969/api/stats/global | jq

# Test user stats
curl http://localhost:6969/api/stats/user/0xYourAddress | jq

# Check backend is running
curl http://localhost:6969/

# Start backend
cd server && npm run dev

# Start frontend
cd client && npm run dev
```

## Common Issues

### Stats showing 0?

- ✅ Check contract addresses in `.env`
- ✅ Verify RPC URL is accessible
- ✅ Ensure NFTs have been minted

### API not responding?

- ✅ Backend running on port 6969?
- ✅ `NEXT_PUBLIC_BE_URL` set correctly?
- ✅ CORS configured properly?

### User stats empty?

- ✅ Wallet connected?
- ✅ User has requests in database?
- ✅ Correct address format (0x...)?

## Performance Notes

- Stats endpoints use `Promise.all()` for parallel queries
- On-chain calls are cached by viem
- No gas fees (read-only operations)
- Average response time: 200-500ms
- Blockchain calls: ~100-200ms each
- MongoDB queries: ~50-100ms each

## Rate Limits

- No rate limits currently implemented
- Consider adding caching for production
- Recommended: Cache stats for 30-60 seconds
- Use Redis or in-memory cache

## Status Codes

| Code | Meaning                              |
| ---- | ------------------------------------ |
| 200  | Success                              |
| 400  | Bad request (missing wallet address) |
| 500  | Server error                         |

## Example Implementations

### React Component

```typescript
function StatsDisplay() {
  const [stats, setStats] = useState<GlobalStats | null>(null);

  useEffect(() => {
    fetchGlobalStats().then(setStats);
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      <h2>Total NFTs: {stats.totalNFTsMinted}</h2>
      <p>Approval Rate: {stats.approvalRate}%</p>
    </div>
  );
}
```

### User Dashboard

```typescript
function UserDashboard({ address }: { address: string }) {
  const [stats, setStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (address) {
      fetchUserStats(address).then(setStats);
    }
  }, [address]);

  return (
    <div>
      <p>NFTs Owned: {stats?.totalNFTsOwned ?? 0}</p>
      <p>Pending: {stats?.pendingRequests ?? 0}</p>
    </div>
  );
}
```

---

**Quick Links:**

- Full Guide: `STATS-INTEGRATION.md`
- Architecture: `STATS-ARCHITECTURE.md`
- Summary: `STATS-COMPLETE.md`
