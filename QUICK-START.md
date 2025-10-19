# 🚀 VeriBase Quick Start Guide

Get up and running with VeriBase in 5 minutes!

## ⚡ Super Quick Setup

### 1️⃣ Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/BSCS-4B-HACKATHON/base-own.git
cd base-own

# Install all dependencies
cd client && npm install && cd ..
cd server && npm install && cd ..
cd blockchain && npm install && cd ..
```

### 2️⃣ Configure Environment (2 minutes)

**Server** (`server/.env`):

```env
MONGODB_URI=mongodb://localhost:27017/veribase
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_API_KEY=your_pinata_secret
BLOCKCHAIN_RPC_URL=https://sepolia.base.org
ADMIN_PRIVATE_KEY=0xYOUR_ADMIN_KEY
NATIONAL_ID_NFT_ADDRESS=0x66fe865e6a737fd58905d2f46d2e952a5633bf4d
LAND_OWNERSHIP_NFT_ADDRESS=0x5a93b0d7a0e05396f2a4d830ac9bbc4d896ce0ff
LAND_TRANSFER_CONTRACT_ADDRESS=0x9a46b9f558d9dad1973095d0ab3c7c07d1055e0c
PORT=6969
FRONTEND_ORIGIN=http://localhost:3000
```

**Client** (`client/.env.local`):

```env
NEXT_PUBLIC_BE_URL=http://localhost:6969
NEXT_PUBLIC_SERVER_URL=http://localhost:6969
NEXT_PUBLIC_API_URL=http://localhost:6969
NEXT_PUBLIC_NATIONAL_ID_NFT_ADDRESS=0x66fe865e6a737fd58905d2f46d2e952a5633bf4d
NEXT_PUBLIC_LAND_OWNERSHIP_NFT_ADDRESS=0x5a93b0d7a0e05396f2a4d830ac9bbc4d896ce0ff
NEXT_PUBLIC_LAND_TRANSFER_CONTRACT_ADDRESS=0x9a46b9f558d9dad1973095d0ab3c7c07d1055e0c
```

### 3️⃣ Run the App (1 minute)

```bash
# Terminal 1: Start Backend
cd server && npm run dev

# Terminal 2: Start Frontend
cd client && npm run dev
```

## 🎯 Access Points

| Service               | URL                            | Description                  |
| --------------------- | ------------------------------ | ---------------------------- |
| 🏠 **Landing Page**   | http://localhost:3000          | Public landing page          |
| 👤 **User Dashboard** | http://localhost:3000/home     | User home with stats         |
| 📋 **Requests**       | http://localhost:3000/requests | Manage verification requests |
| 🎫 **NFT Documents**  | http://localhost:3000/nfts     | View minted NFTs             |
| 🛡️ **Admin Panel**    | http://localhost:3000/admin    | Admin dashboard              |
| 🔌 **Backend API**    | http://localhost:6969          | REST API endpoints           |

## 📝 Essential Information

### Smart Contract Addresses (Base Sepolia)

- **NationalIdNFT**: `0x66fe865e6a737fd58905d2f46d2e952a5633bf4d`
- **LandOwnershipNFT**: `0x5a93b0d7a0e05396f2a4d830ac9bbc4d896ce0ff`
- **LandTransferContract**: `0x9a46b9f558d9dad1973095d0ab3c7c07d1055e0c`

### Network Details

- **Network**: Base Sepolia Testnet
- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Block Explorer**: https://sepolia.basescan.org

### Required Resources

- 🔗 **Base Sepolia ETH**: [Get from faucet](https://docs.base.org/docs/tools/network-faucets)
- 📦 **Pinata Account**: [Sign up](https://pinata.cloud)
- 💾 **MongoDB**: Local or [Atlas](https://mongodb.com/cloud/atlas)
- 🦊 **Wallet**: MetaMask or Coinbase Wallet

## 🎮 Quick Test Flow

### As a User:

1. Connect your wallet (MetaMask/Coinbase)
2. Go to "Requests" → "New Request"
3. Fill in document details and upload files
4. Wait for admin approval
5. Mint your NFT document
6. View in "NFT Documents"

### As an Admin:

1. Navigate to `/admin`
2. Review pending requests
3. Click "Approve" or "Reject"
4. Monitor system statistics
5. Check blockchain sync status

## 🔧 Troubleshooting

### Can't connect wallet?

- Make sure you're on Base Sepolia network
- Check if you have test ETH
- Try refreshing the page

### Backend not responding?

- Verify MongoDB is running
- Check if port 6969 is available
- Ensure `.env` file exists in server directory

### Transactions failing?

- Confirm you have Base Sepolia ETH
- Check contract addresses are correct
- Verify RPC URL is working

## 📚 Next Steps

- Read full [README.md](./README.md)
- Explore [Smart Contract Docs](./blockchain/README.md)
- Check [NFT Contract Details](./blockchain/NFT-CONTRACTS-README.md)
- Review [API Documentation](./server/README.md)

## 🆘 Need Help?

- 📖 Check the main README.md
- 🐛 Open an issue on GitHub
- 💬 Review existing documentation
- 🔍 Search closed issues

---

**Ready to build on Base!** 🚀
