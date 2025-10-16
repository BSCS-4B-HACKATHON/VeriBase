# Statistics Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT APPLICATIONS                             │
├─────────────────────────────┬───────────────────────────────────────────────┤
│                             │                                               │
│   USER DASHBOARD (/home)    │     ADMIN DASHBOARD (/admin)                  │
│                             │                                               │
│  ┌──────────────────────┐   │   ┌──────────────────────────┐               │
│  │ • NFT Documents      │   │   │ • Total Users            │               │
│  │ • Pending Requests   │   │   │ • Pending Requests       │               │
│  │ • Approved           │   │   │ • Approved Verifications │               │
│  │ • Rejected           │   │   │ • Rejected Verifications │               │
│  │ • Recent Activity    │   │   │ • Total NFTs Minted      │               │
│  └──────────────────────┘   │   └──────────────────────────┘               │
│            │                 │              │                                │
│            │ GET /api/stats/user/:address   │ GET /api/stats/global        │
│            │                 │              │                                │
└────────────┼─────────────────┴──────────────┼────────────────────────────────┘
             │                                │
             ▼                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND API (Express + TypeScript)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │                    /api/stats Routes                               │     │
│  │                                                                    │     │
│  │  GET /global          →  GetGlobalStatsHandler                     │     │
│  │  GET /user/:address   →  GetUserStatsHandler                       │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                      │                           │                           │
│                      ▼                           ▼                           │
│         ┌──────────────────────┐   ┌──────────────────────────┐            │
│         │  Stats Controller    │   │  Stats Controller        │            │
│         │  (Global)            │   │  (User-Specific)         │            │
│         └──────────────────────┘   └──────────────────────────┘            │
│                      │                           │                           │
│         ┌────────────┴────────────┐   ┌─────────┴──────────┐                │
│         ▼                         ▼   ▼                    ▼                │
│  ┌─────────────┐        ┌────────────────────────┐  ┌─────────────┐        │
│  │  MongoDB    │        │  Viem Public Client    │  │  MongoDB    │        │
│  │  Queries    │        │  (Base Sepolia)        │  │  Queries    │        │
│  └─────────────┘        └────────────────────────┘  └─────────────┘        │
│         │                         │                           │              │
│         ▼                         ▼                           ▼              │
│  • Count documents       • readContract()            • Find user docs       │
│  • Aggregate stats       • totalSupply()             • Count by status      │
│  • Distinct wallets      • balanceOf(address)        • Recent requests      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA SOURCES                                      │
├──────────────────────────────┬──────────────────────────────────────────────┤
│                              │                                              │
│   MongoDB Atlas              │     Base Sepolia Blockchain                  │
│                              │                                              │
│  ┌────────────────────────┐  │  ┌─────────────────────────────────────┐    │
│  │  Request Collection    │  │  │  NationalIdNFT Contract             │    │
│  │                        │  │  │  0x57c236c2097c49c6f3c998b2fcf...   │    │
│  │  • requestId           │  │  │                                     │    │
│  │  • requesterWallet     │  │  │  • totalSupply() → count           │    │
│  │  • status              │  │  │  • balanceOf(address) → user NFTs  │    │
│  │  • requestType         │  │  └─────────────────────────────────────┘    │
│  │  • createdAt           │  │                                              │
│  │  • files               │  │  ┌─────────────────────────────────────┐    │
│  │  • minimalPublicLabel  │  │  │  LandOwnershipNFT Contract          │    │
│  └────────────────────────┘  │  │  0x7d59c36de7c8825b55c73038fa6...   │    │
│                              │  │                                     │    │
│  Statistics Available:       │  │  • totalSupply() → count           │    │
│  • totalRequests             │  │  • balanceOf(address) → user NFTs  │    │
│  • pendingRequests           │  │                                     │    │
│  • verifiedRequests          │  └─────────────────────────────────────┘    │
│  • rejectedRequests          │                                              │
│  • nationalIdRequests        │  RPC: https://sepolia.base.org               │
│  • landOwnershipRequests     │                                              │
│  • totalUsers (distinct)     │                                              │
│                              │                                              │
└──────────────────────────────┴──────────────────────────────────────────────┘

DATA FLOW EXAMPLE - User Dashboard:

1. User connects wallet (0xABC...)
2. Frontend: GET /api/stats/user/0xABC...
3. Backend queries:
   - MongoDB: Count user's requests by status
   - Base Sepolia: balanceOf(0xABC...) on both NFT contracts
4. Backend returns combined data
5. Frontend displays:
   - NFT Documents: 5 (from blockchain)
   - Pending: 2 (from MongoDB)
   - Approved: 1 (from MongoDB)
   - Rejected: 0 (from MongoDB)

DATA FLOW EXAMPLE - Admin Dashboard:

1. Admin loads dashboard
2. Frontend: GET /api/stats/global
3. Backend queries:
   - MongoDB: Aggregate all requests, count by status/type, distinct users
   - Base Sepolia: totalSupply() on both NFT contracts
4. Backend calculates rates:
   - Approval rate = (verified / total) * 100
   - Rejection rate = (rejected / total) * 100
5. Frontend displays:
   - Total Users: 127 (from MongoDB distinct wallets)
   - Total NFTs Minted: 89 (from blockchain totalSupply)
   - Pending: 23 (from MongoDB)
   - Approved: 67 (from MongoDB)
   - Rejection Rate: 8.3% (calculated)
```

## Key Benefits

### 🎯 Real-Time Accuracy

- No stale mock data
- Direct blockchain reads
- Live database queries

### 🔄 Hybrid Data Sources

- **MongoDB**: User interactions, request states
- **Blockchain**: Permanent NFT records
- **Calculated**: Rates, percentages, trends

### 🛡️ Fault Tolerance

- Independent data sources
- Graceful degradation
- Error logging without crashes

### 📊 Comprehensive Insights

- User-specific views
- System-wide analytics
- Historical context
- Activity timelines

### ⚡ Performance

- Parallel queries (Promise.all)
- Efficient contract reads
- Minimal RPC calls
- Type-safe operations
