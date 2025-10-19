# ✅ VeriBase Setup Checklist

Use this checklist to ensure you have everything configured correctly.

## 📦 Prerequisites

### Required Software

- [ ] Node.js 16+ installed
- [ ] npm or yarn installed
- [ ] Git installed
- [ ] MongoDB installed (or Atlas account created)
- [ ] Code editor (VS Code recommended)

### Required Accounts

- [ ] Pinata account created ([pinata.cloud](https://pinata.cloud))
- [ ] Base Sepolia wallet with test ETH
- [ ] MongoDB Atlas account (if using cloud)
- [ ] GitHub account (for cloning)

### Required Tools

- [ ] MetaMask or Coinbase Wallet installed
- [ ] Base Sepolia network added to wallet
- [ ] Test ETH in wallet (from faucet)

## 🚀 Installation Steps

### 1. Repository Setup

- [ ] Cloned repository from GitHub
- [ ] Navigated to project root directory

### 2. Client Setup

- [ ] Ran `cd client && npm install`
- [ ] Created `client/.env.local` file
- [ ] Set `NEXT_PUBLIC_BE_URL=http://localhost:6969`
- [ ] Set `NEXT_PUBLIC_SERVER_URL=http://localhost:6969`
- [ ] Set `NEXT_PUBLIC_API_URL=http://localhost:6969`
- [ ] Set `NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS=0x66fe865e6a737fd58905d2f46d2e952a5633bf4d`
- [ ] Set `NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS=0x5a93b0d7a0e05396f2a4d830ac9bbc4d896ce0ff`
- [ ] Set `NEXT_PUBLIC_LAND_TRANSFER_CONTRACT_ADDRESS=0x9a46b9f558d9dad1973095d0ab3c7c07d1055e0c`

### 3. Server Setup

- [ ] Ran `cd server && npm install`
- [ ] Created `server/.env` file
- [ ] Set `MONGODB_URI` (local or Atlas)
- [ ] Set `PINATA_API_KEY` from Pinata dashboard
- [ ] Set `PINATA_SECRET_API_KEY` from Pinata dashboard
- [ ] Set `BLOCKCHAIN_RPC_URL=https://sepolia.base.org`
- [ ] Set `ADMIN_PRIVATE_KEY` (optional - only for specific admin ops)
- [ ] Set `NATIONAL_ID_NFT_ADDRESS=0x66fe865e6a737fd58905d2f46d2e952a5633bf4d`
- [ ] Set `LAND_OWNERSHIP_NFT_ADDRESS=0x5a93b0d7a0e05396f2a4d830ac9bbc4d896ce0ff`
- [ ] Set `LAND_TRANSFER_CONTRACT_ADDRESS=0x9a46b9f558d9dad1973095d0ab3c7c07d1055e0c`
- [ ] Set `PORT=6969`
- [ ] Set `FRONTEND_ORIGIN=http://localhost:3000`

### 4. Blockchain Setup (Optional)

- [ ] Ran `cd blockchain && npm install`
- [ ] Created `blockchain/.env` file (only if deploying)
- [ ] Set `BASE_SEPOLIA_PRIVATE_KEY` (only if deploying)
- [ ] Set `BASE_SEPOLIA_RPC_URL` (only if deploying)

## 🔑 Credentials Checklist

### Pinata

- [ ] Obtained API Key from Pinata
- [ ] Obtained Secret API Key from Pinata
- [ ] Verified keys work (test upload)

### Blockchain

- [ ] User wallet has Base Sepolia ETH (for minting gas fees)
- [ ] Admin wallet private key (optional - only if using admin features)
- [ ] Wallet address recorded for reference

### MongoDB

- [ ] MongoDB running locally OR
- [ ] MongoDB Atlas cluster created
- [ ] Connection string obtained
- [ ] Database user created (if using Atlas)
- [ ] IP whitelist configured (if using Atlas)

## 🧪 Testing Checklist

### Before First Run

- [ ] All dependencies installed
- [ ] All .env files created and filled
- [ ] MongoDB is accessible
- [ ] Port 3000 is available (frontend)
- [ ] Port 6969 is available (backend)

### Start Services

- [ ] Started MongoDB (if local)
- [ ] Started backend: `cd server && npm run dev`
- [ ] Backend shows "Connected to MongoDB"
- [ ] Started frontend: `cd client && npm run dev`
- [ ] No compilation errors in frontend

### Verify Access

- [ ] Can access http://localhost:3000
- [ ] Can access http://localhost:6969
- [ ] Frontend loads without errors
- [ ] Can see landing page

### Test Wallet Connection

- [ ] MetaMask/Coinbase Wallet installed
- [ ] Wallet connected to Base Sepolia
- [ ] Can click "Connect Wallet" button
- [ ] Wallet connection successful
- [ ] Address displayed in UI

### Test User Flow

- [ ] Can navigate to /home (user dashboard)
- [ ] Can see stats (may be 0)
- [ ] Can navigate to /requests
- [ ] Can open "New Request" form
- [ ] Can fill out form
- [ ] Can upload test file
- [ ] Can submit request
- [ ] Request appears in list

### Test Admin Flow

- [ ] Can navigate to /admin
- [ ] Can see pending request
- [ ] Can click "Approve" button
- [ ] Request status changes to "approved"
- [ ] Stats update correctly

### Test Minting

- [ ] Return to user dashboard
- [ ] Approved request shows "Mint NFT" button
- [ ] Click "Mint NFT"
- [ ] Wallet prompts for transaction
- [ ] User approves and pays gas fee
- [ ] Transaction processes successfully
- [ ] NFT appears in /nfts page
- [ ] Can see NFT metadata

## 🔧 Configuration Verification

### Environment Variables Match

- [ ] Contract addresses same in client and server
- [ ] Backend URL same in all client variables
- [ ] Admin private key same in server and blockchain (if used)
- [ ] RPC URL consistent across configs

### Network Configuration

- [ ] Wallet on Base Sepolia (Chain ID: 84532)
- [ ] Backend using Base Sepolia RPC
- [ ] Contract addresses are Base Sepolia addresses

### File Permissions

- [ ] .env files are readable
- [ ] .env files are in .gitignore
- [ ] Upload directories are writable (if applicable)

## 🐛 Troubleshooting Checklist

### If Frontend Won't Start

- [ ] Checked Node.js version (16+)
- [ ] Cleared node_modules: `rm -rf node_modules`
- [ ] Reinstalled: `npm install`
- [ ] Checked for port conflicts
- [ ] Reviewed console errors

### If Backend Won't Start

- [ ] MongoDB is running/accessible
- [ ] All required env variables set
- [ ] Port 6969 is available
- [ ] Checked backend logs for errors
- [ ] Verified MONGODB_URI format

### If Wallet Won't Connect

- [ ] Wallet extension installed
- [ ] Wallet unlocked
- [ ] On Base Sepolia network
- [ ] Browser allows popups
- [ ] Page refreshed after changes

### If Requests Fail

- [ ] Backend is running
- [ ] CORS configured correctly
- [ ] Pinata credentials valid
- [ ] File size under limits
- [ ] Network request not blocked

### If Minting Fails

- [ ] User wallet has Base Sepolia ETH for gas
- [ ] User is on Base Sepolia network
- [ ] Contract addresses correct
- [ ] RPC URL accessible
- [ ] Request was approved first

## 📊 Health Check Commands

### Check MongoDB Connection

```bash
# Local
mongosh
# or
mongo

# Atlas
mongosh "your_connection_string"
```

### Check Backend Status

```bash
curl http://localhost:6969
# Should return: "Hello, Blockchain API is running!"
```

### Check Frontend Build

```bash
cd client
npm run build
# Should complete without errors
```

### Check Smart Contracts

```bash
cd blockchain
npx hardhat test
# Should pass all tests
```

## 🎯 Production Checklist

### Security

- [ ] All .env files in .gitignore
- [ ] Private keys never committed
- [ ] MongoDB authentication enabled
- [ ] CORS restricted to known origins
- [ ] Rate limiting implemented
- [ ] HTTPS enabled
- [ ] API keys rotated regularly

### Performance

- [ ] Database indexes created
- [ ] Images optimized
- [ ] Caching configured
- [ ] CDN setup for static assets
- [ ] Error tracking enabled (Sentry)

### Deployment

- [ ] Frontend deployed (Vercel/Netlify)
- [ ] Backend deployed (Railway/Render)
- [ ] MongoDB Atlas configured
- [ ] Environment variables set in hosting
- [ ] Custom domain configured (optional)
- [ ] SSL certificates active

### Monitoring

- [ ] Uptime monitoring setup
- [ ] Error logging configured
- [ ] Analytics tracking enabled
- [ ] Gas price alerts setup
- [ ] Database backup scheduled

## ✨ Final Verification

### Functionality

- [ ] Users can connect wallets
- [ ] Users can submit requests
- [ ] Admins can approve/reject
- [ ] NFTs can be minted
- [ ] NFTs display correctly
- [ ] Stats show accurate data
- [ ] All pages load properly

### UI/UX

- [ ] Mobile responsive
- [ ] Dark/light mode works
- [ ] Loading states show
- [ ] Error messages clear
- [ ] Success confirmations shown
- [ ] Navigation intuitive

### Documentation

- [ ] README.md accurate
- [ ] .env.example files complete
- [ ] API endpoints documented
- [ ] Code comments present
- [ ] Deployment guide clear

## 📝 Notes

**Deployment Date**: **\*\*\*\***\_**\*\*\*\***

**Admin Wallet Address**: **\*\*\*\***\_**\*\*\*\***

**Contract Deployment Date**: October 17, 2025

**Network**: Base Sepolia (84532)

**Issues Encountered**:

---

---

---

**Solutions Applied**:

---

---

---

---

**Status**:

- [ ] ✅ All checks passed - Ready for production
- [ ] ⚠️ Some issues - Needs fixes
- [ ] ❌ Major issues - Requires debugging
