# Contract Verification Guide

## Overview

Contract verification allows anyone to view the source code of your smart contracts on BaseScan. This provides transparency and allows users to verify the contract's functionality.

## Current Status

Your contracts are deployed to Base Sepolia:

- **NationalIdNFT**: `0x7c7460c78336108964588d4de147d47c20606c6d`
- **LandOwnershipNFT**: `0xeca5a68f0e3ba9d09949d146d963531ef6853faf`
- **LandTransferContract**: `0x36f4969c4966ff718bd489af9d4dc1257f4489f2`

## Why Verification is Optional

- ✅ Your NFTs work perfectly without verification
- ✅ Users can mint, transfer, and view NFTs
- ✅ Backend can decrypt metadata (independent of blockchain)
- ⭐ Verification adds **transparency** (users can read the contract code)

## Method 1: Automatic Verification (Recommended)

### Using BaseScan API

Run our verification script:

```bash
cd blockchain
npx tsx scripts/verify-basescan.ts
```

**Requirements:**

- BaseScan API key in `.env`: `BASESCAN_API_KEY=your_key_here`
- Get free key from: https://basescan.org/myapikey

### Verification Script (`verify-basescan.ts`)

- ✅ Reads deployment addresses automatically
- ✅ Submits source code to BaseScan API
- ✅ Handles constructor arguments
- ✅ Checks verification status

## Method 2: Manual Verification (Via Website)

### Step-by-Step Instructions

#### 1. Get Contract Source Code

The source files are in:

- `contracts/NationalIdNFT.sol`
- `contracts/LandOwnershipNFT.sol`
- `contracts/LandTransferContract.sol`

You'll need to flatten them (include imports):

```bash
npx hardhat flatten contracts/NationalIdNFT.sol > NationalIdNFT-flattened.sol
npx hardhat flatten contracts/LandOwnershipNFT.sol > LandOwnershipNFT-flattened.sol
npx hardhat flatten contracts/LandTransferContract.sol > LandTransferContract-flattened.sol
```

#### 2. Visit BaseScan

Go to each contract on BaseScan:

- https://sepolia.basescan.org/address/0x7c7460c78336108964588d4de147d47c20606c6d#code
- https://sepolia.basescan.org/address/0xeca5a68f0e3ba9d09949d146d963531ef6853faf#code
- https://sepolia.basescan.org/address/0x36f4969c4966ff718bd489af9d4dc1257f4489f2#code

#### 3. Click "Verify and Publish"

#### 4. Fill in Verification Form

**Compiler Type**: Solidity (Single file)

**Compiler Version**: v0.8.28+commit.7893614a

**Open Source License**: MIT License (3)

**Optimization**: Yes

- Runs: 200

**EVM Version**: default (Cancun)

**Constructor Arguments** (only for LandTransferContract):

```
000000000000000000000000eca5a68f0e3ba9d09949d146d963531ef6853faf
```

(This is the LandOwnershipNFT address without "0x", left-padded to 64 characters)

#### 5. Paste Flattened Source Code

Copy the contents of the flattened `.sol` file

#### 6. Complete CAPTCHA and Submit

Wait 30-60 seconds for verification to complete

## Method 3: Hardhat Verify (Not Working with v3)

⚠️ **Note**: The standard `hardhat verify` command doesn't work with Hardhat v3 yet.

```bash
# This will fail with "Task 'verify' not found"
npx hardhat verify --network baseSepolia 0x7c7460...
```

**Reason**: Hardhat v3 changed the plugin system, and `@nomicfoundation/hardhat-verify` isn't fully compatible yet.

**Alternative**: Use Methods 1 or 2 above.

## Checking Verification Status

### On BaseScan

Visit the contract address and look for:

- ✅ Green checkmark next to "Contract" tab
- Source code visible under "Contract" → "Code"
- Compiler version and settings shown

### Via Script

```bash
# Check if contracts are verified
npx tsx scripts/check-verification.ts
```

## Troubleshooting

### "Contract already verified"

✅ This means verification succeeded! Check the BaseScan link.

### "Unable to locate ContractName"

- Make sure contract name matches exactly (case-sensitive)
- Use format: `ContractName` not `contracts/ContractName.sol:ContractName`

### "Constructor arguments mismatch"

Only LandTransferContract has constructor args:

- Argument: The LandOwnershipNFT contract address
- Encoding: ABI-encoded (remove "0x", pad to 64 hex characters)

### "Compiler version mismatch"

Use exactly: `v0.8.28+commit.7893614a`

- Check your `hardhat.config.ts` for the correct version
- Solidity version must match exactly

### "Bytecode doesn't match"

This means:

1. Source code doesn't match deployed contract
2. Compiler settings different (optimization, runs, viaIR)
3. Wrong constructor arguments

**Solution**: Verify using the exact source code from the repo, exact compiler settings from `hardhat.config.ts`.

## Important Notes

### Contract Addresses

Always use the addresses from `deployments/baseSepolia.json`:

```json
{
  "nationalIdNFT": "0x7c7460c78336108964588d4de147d47c20606c6d",
  "landOwnershipNFT": "0xeca5a68f0e3ba9d09949d146d963531ef6853faf",
  "landTransferContract": "0x36f4969c4966ff718bd489af9d4dc1257f4489f2"
}
```

### Compiler Settings

From `hardhat.config.ts`:

```typescript
solidity: {
  version: "0.8.28",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    viaIR: true,  // Important! Must match
  },
}
```

### Constructor Arguments

Only LandTransferContract has constructor args:

- Parameter: `address _landOwnershipNFT`
- Value: Address of LandOwnershipNFT contract

To encode:

```typescript
// In ethers.js
const encoded = ethers.utils.defaultAbiCoder.encode(
  ["address"],
  ["0xeca5a68f0e3ba9d09949d146d963531ef6853faf"]
);

// Result: 0x000000000000000000000000eca5a68f0e3ba9d09949d146d963531ef6853faf
// Remove "0x" for BaseScan: 000000000000000000000000eca5a68f0e3ba9d09949d146d963531ef6853faf
```

## Benefits of Verification

### For Users

- 👀 Read contract source code
- ✅ Verify contract functionality
- 🔒 Check security features
- 🤝 Trust through transparency

### For Developers

- 📊 Better analytics on BaseScan
- 🔍 Easier debugging via explorer
- 🌟 Professional appearance
- 💼 Investor/auditor confidence

## Quick Reference

| Contract             | Address         | Constructor Args         | Verified?  |
| -------------------- | --------------- | ------------------------ | ---------- |
| NationalIdNFT        | `0x7c74...6c6d` | None                     | ⏳ Pending |
| LandOwnershipNFT     | `0xeca5...3faf` | None                     | ⏳ Pending |
| LandTransferContract | `0x36f4...9f2`  | LandOwnershipNFT address | ⏳ Pending |

## Summary

**✅ Contracts work perfectly without verification**  
**⭐ Verification is optional but recommended for transparency**  
**🚀 Use `verify-basescan.ts` script for easiest verification**  
**📝 Manual verification via website is also simple**  
**⚠️ Hardhat v3 doesn't support `hardhat verify` command yet**

---

**Need help?** Check the links below:

- BaseScan: https://docs.basescan.org/
- Hardhat Verification: https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify
- Contract Verification API: https://docs.etherscan.io/api-endpoints/contracts#verify-source-code
