# 🔐 Environment Variables Reference

Complete guide to all environment variables used in VeriBase.

## 📁 File Locations

| Module     | File Location       | Required               |
| ---------- | ------------------- | ---------------------- |
| Server     | `server/.env`       | ✅ Yes                 |
| Client     | `client/.env.local` | ✅ Yes                 |
| Blockchain | `blockchain/.env`   | ⚠️ Only for deployment |

## 🖥️ Server Environment Variables

**File**: `server/.env`

### Database Configuration

| Variable      | Description               | Example                              | Required |
| ------------- | ------------------------- | ------------------------------------ | -------- |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/veribase` | ✅ Yes   |

**Options**:

- Local: `mongodb://localhost:27017/veribase`
- Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/veribase`

### IPFS Storage (Pinata)

| Variable                | Description       | Where to Get                         | Required |
| ----------------------- | ----------------- | ------------------------------------ | -------- |
| `PINATA_API_KEY`        | Pinata API key    | [pinata.cloud](https://pinata.cloud) | ✅ Yes   |
| `PINATA_SECRET_API_KEY` | Pinata secret key | [pinata.cloud](https://pinata.cloud) | ✅ Yes   |

### Blockchain Configuration

| Variable             | Description                               | Example                    | Required    |
| -------------------- | ----------------------------------------- | -------------------------- | ----------- |
| `BLOCKCHAIN_RPC_URL` | Base Sepolia RPC endpoint                 | `https://sepolia.base.org` | ✅ Yes      |
| `ADMIN_PRIVATE_KEY`  | Admin wallet private key (with 0x prefix) | `0xabc123...`              | ⚠️ Optional |

**Important**:

- `ADMIN_PRIVATE_KEY` is optional - only used for specific admin operations
- Users pay their own gas fees when minting NFTs
- Never share or commit private keys
- Use a dedicated wallet if admin operations are needed

### Smart Contract Addresses

| Variable                         | Description               | Current Value                                | Required |
| -------------------------------- | ------------------------- | -------------------------------------------- | -------- |
| `NATIONAL_ID_NFT_ADDRESS`        | NationalIdNFT contract    | `0x66fe865e6a737fd58905d2f46d2e952a5633bf4d` | ✅ Yes   |
| `LAND_OWNERSHIP_NFT_ADDRESS`     | LandOwnershipNFT contract | `0x5a93b0d7a0e05396f2a4d830ac9bbc4d896ce0ff` | ✅ Yes   |
| `LAND_TRANSFER_CONTRACT_ADDRESS` | LandTransferContract      | `0x9a46b9f558d9dad1973095d0ab3c7c07d1055e0c` | ✅ Yes   |

**Note**: These are current deployed addresses. Update if you deploy new contracts.

### Server Configuration

| Variable          | Description         | Default                 | Required    |
| ----------------- | ------------------- | ----------------------- | ----------- |
| `PORT`            | Server port number  | `6969`                  | ⚠️ Optional |
| `FRONTEND_ORIGIN` | Allowed CORS origin | `http://localhost:3000` | ⚠️ Optional |

## 🌐 Client Environment Variables

**File**: `client/.env.local`

### Backend API URLs

| Variable                 | Description           | Example                 | Required |
| ------------------------ | --------------------- | ----------------------- | -------- |
| `NEXT_PUBLIC_BE_URL`     | Backend URL (primary) | `http://localhost:6969` | ✅ Yes   |
| `NEXT_PUBLIC_SERVER_URL` | Backend URL (alias)   | `http://localhost:6969` | ✅ Yes   |
| `NEXT_PUBLIC_API_URL`    | Backend URL (alias)   | `http://localhost:6969` | ✅ Yes   |

**Note**: All three should point to the same backend server.

### Smart Contract Addresses

| Variable                                     | Description               | Current Value                                | Required |
| -------------------------------------------- | ------------------------- | -------------------------------------------- | -------- |
| `NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS`        | NationalIdNFT contract    | `0x66fe865e6a737fd58905d2f46d2e952a5633bf4d` | ✅ Yes   |
| `NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS`     | LandOwnershipNFT contract | `0x5a93b0d7a0e05396f2a4d830ac9bbc4d896ce0ff` | ✅ Yes   |
| `NEXT_PUBLIC_LAND_TRANSFER_CONTRACT_ADDRESS` | LandTransferContract      | `0x9a46b9f558d9dad1973095d0ab3c7c07d1055e0c` | ✅ Yes   |

### Optional Configuration

| Variable                               | Description                      | Where to Get                                               | Required |
| -------------------------------------- | -------------------------------- | ---------------------------------------------------------- | -------- |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID         | [cloud.walletconnect.com](https://cloud.walletconnect.com) | ❌ No    |
| `NEXT_PUBLIC_SERVER_PUBKEY_PEM`        | Server public key for encryption | Generated by server                                        | ❌ No    |

## ⛓️ Blockchain Environment Variables

**File**: `blockchain/.env`

**⚠️ Only needed if deploying new contracts!**

### Network Configuration

| Variable                   | Description          | Example                    | Required |
| -------------------------- | -------------------- | -------------------------- | -------- |
| `NETWORK`                  | Target network       | `baseSepolia`              | ✅ Yes   |
| `BASE_SEPOLIA_PRIVATE_KEY` | Deployer private key | `0xabc123...`              | ✅ Yes   |
| `BASE_SEPOLIA_RPC_URL`     | Base Sepolia RPC     | `https://sepolia.base.org` | ✅ Yes   |

### Contract Addresses (Auto-populated)

| Variable                         | Description                   | Current Value                                | Required        |
| -------------------------------- | ----------------------------- | -------------------------------------------- | --------------- |
| `NATIONAL_ID_NFT_ADDRESS`        | Deployed NationalIdNFT        | `0x66fe865e6a737fd58905d2f46d2e952a5633bf4d` | ⚠️ After deploy |
| `LAND_OWNERSHIP_NFT_ADDRESS`     | Deployed LandOwnershipNFT     | `0x5a93b0d7a0e05396f2a4d830ac9bbc4d896ce0ff` | ⚠️ After deploy |
| `LAND_TRANSFER_CONTRACT_ADDRESS` | Deployed LandTransferContract | `0x9a46b9f558d9dad1973095d0ab3c7c07d1055e0c` | ⚠️ After deploy |

### Admin Configuration

| Variable            | Description                   | Example       | Required |
| ------------------- | ----------------------------- | ------------- | -------- |
| `ADMIN_PRIVATE_KEY` | Admin wallet (same as server) | `0xabc123...` | ✅ Yes   |

### Optional: Contract Verification

| Variable           | Description      | Where to Get                                  | Required |
| ------------------ | ---------------- | --------------------------------------------- | -------- |
| `BASESCAN_API_KEY` | BaseScan API key | [basescan.org](https://basescan.org/myapikey) | ❌ No    |

## 🔑 Getting Your Credentials

### 1. Pinata (IPFS)

1. Go to [pinata.cloud](https://pinata.cloud)
2. Sign up for free account
3. Navigate to "API Keys" section
4. Create new API key
5. Copy `API Key` and `API Secret`

### 2. Base Sepolia ETH

1. Visit [Base faucet](https://docs.base.org/docs/tools/network-faucets)
2. Connect your wallet
3. Request test ETH
4. Wait for confirmation

### 3. Private Keys

**⚠️ Security Warning**: Never use your personal wallet!

**Option A: Create New Wallet (Recommended)**

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Add 0x prefix: 0x[output]
```

**Option B: Export from MetaMask**

1. Open MetaMask
2. Select account → Account details
3. Export private key (requires password)
4. Copy with 0x prefix

### 4. MongoDB

**Local**:

```bash
# Install MongoDB
# macOS: brew install mongodb-community
# Ubuntu: sudo apt install mongodb

# Start MongoDB
# macOS: brew services start mongodb-community
# Ubuntu: sudo systemctl start mongodb

# Use connection string:
mongodb://localhost:27017/veribase
```

**Cloud (MongoDB Atlas)**:

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create free cluster
3. Set up database user
4. Get connection string
5. Replace `<password>` with your password

## ✅ Configuration Checklist

### Before Running Server

- [ ] MongoDB is running/accessible
- [ ] Pinata API keys are valid
- [ ] Admin wallet has Base Sepolia ETH
- [ ] Contract addresses are correct
- [ ] All required variables are set

### Before Running Client

- [ ] Backend server is running on specified port
- [ ] Contract addresses match server config
- [ ] URLs point to correct backend

### Before Deploying Contracts

- [ ] Deployer wallet has Base Sepolia ETH
- [ ] Network is set correctly
- [ ] RPC URL is accessible

## 🐛 Common Issues

### "Failed to connect to MongoDB"

- ✅ Check MongoDB is running: `mongosh` or `mongo`
- ✅ Verify connection string format
- ✅ For Atlas: Check IP whitelist and credentials

### "Insufficient funds for gas"

- ✅ **Users** need Base Sepolia ETH in their wallet to mint NFTs
- ✅ Get ETH from faucet
- ✅ Confirm you're on Base Sepolia network

### "Contract not found"

- ✅ Verify contract addresses match in all configs
- ✅ Check network is Base Sepolia (84532)
- ✅ Confirm contracts are deployed

### "CORS error"

- ✅ Check `FRONTEND_ORIGIN` in server `.env`
- ✅ Ensure client URL matches
- ✅ Restart server after changes

### "Pinata upload failed"

- ✅ Verify API keys are correct
- ✅ Check Pinata account status
- ✅ Ensure sufficient Pinata storage

## 📖 Production Considerations

### Security

- [ ] Use environment variables, never hardcode
- [ ] Rotate private keys periodically
- [ ] Use hardware wallets for production
- [ ] Enable MongoDB authentication
- [ ] Use HTTPS in production
- [ ] Implement rate limiting

### Scaling

- [ ] Use MongoDB Atlas for cloud database
- [ ] Consider Alchemy/Infura RPC for reliability
- [ ] Deploy backend to cloud service
- [ ] Use CDN for frontend
- [ ] Enable caching where appropriate

### Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Monitor gas prices
- [ ] Track API usage
- [ ] Log contract interactions
- [ ] Monitor database performance

---

**Need help?** Check [README.md](./README.md) or open an issue on GitHub.
