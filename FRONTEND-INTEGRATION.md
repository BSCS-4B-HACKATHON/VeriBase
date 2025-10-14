# Frontend Integration Guide - User-Initiated NFT Minting

## Overview

This guide explains how to integrate the **user-initiated NFT minting** feature into your frontend. After an admin verifies a request, users can click a "Mint" button to mint their NFT.

---

## Button State Logic

The button should change based on the request's status and whether an NFT has been minted:

| Request Status | NFT Minted | Button Text | Button Action |
|----------------|------------|-------------|---------------|
| `pending`      | -          | **View**    | View request details |
| `rejected`     | -          | **View**    | View request details |
| `verified`     | `false`    | **Mint**    | Trigger NFT minting |
| `verified`     | `true`     | **View NFT**| View NFT on blockchain |

---

## API Endpoints

### 1. Check Mint Eligibility

**Endpoint:** `GET /api/requests/:requestId/can-mint`

**Purpose:** Check if a request can be minted and get button state

**Example Request:**
```typescript
const response = await fetch(
  `http://localhost:6969/api/requests/${requestId}/can-mint`
);
const data = await response.json();
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "requestId": "REQ-1234",
    "status": "verified",
    "canMint": true,
    "buttonText": "Mint",
    "buttonAction": "mint",
    "reason": "Request is verified and ready to mint",
    "nftMinted": false,
    "nftTokenId": null,
    "nftTransactionHash": null
  }
}
```

---

### 2. Mint NFT (User-Initiated)

**Endpoint:** `POST /api/requests/:requestId/mint`

**Purpose:** Mint an NFT for a verified request

**Example Request:**
```typescript
const response = await fetch(
  `http://localhost:6969/api/requests/${requestId}/mint`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userWalletAddress: connectedWallet, // From MetaMask/WalletConnect
    }),
  }
);
const data = await response.json();
```

**Example Response (Success):**
```json
{
  "success": true,
  "message": "NFT minted successfully!",
  "data": {
    "requestId": "REQ-1234",
    "tokenId": 42,
    "transactionHash": "0xabc123...",
    "mintedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Example Response (Error):**
```json
{
  "success": false,
  "error": "Cannot mint: Request status is \"pending\". Must be \"verified\"."
}
```

---

### 3. Get All Requests for a Wallet

**Endpoint:** `GET /api/wallet/:address/requests`

**Purpose:** Get all requests for a wallet with mint status

**Example Request:**
```typescript
const response = await fetch(
  `http://localhost:6969/api/wallet/${walletAddress}/requests`
);
const data = await response.json();
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "requestId": "REQ-1234",
      "requestType": "national_id",
      "status": "verified",
      "createdAt": "2024-01-10T08:00:00.000Z",
      "canMint": true,
      "buttonText": "Mint",
      "buttonAction": "mint",
      "nftMinted": false,
      "nftTokenId": null,
      "nftTransactionHash": null,
      "filesCount": 2
    },
    {
      "requestId": "REQ-5678",
      "requestType": "land_ownership",
      "status": "pending",
      "createdAt": "2024-01-12T10:00:00.000Z",
      "canMint": false,
      "buttonText": "View",
      "buttonAction": "view",
      "nftMinted": false,
      "nftTokenId": null,
      "nftTransactionHash": null,
      "filesCount": 3
    }
  ]
}
```

---

## React Component Example

### Basic Button Component

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MintButtonProps {
  requestId: string;
  status: 'pending' | 'verified' | 'rejected';
  nftMinted?: boolean;
  nftTokenId?: number;
  nftTransactionHash?: string;
  userWalletAddress?: string;
}

export function MintButton({
  requestId,
  status,
  nftMinted = false,
  nftTokenId,
  nftTransactionHash,
  userWalletAddress,
}: MintButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Determine button state
  let buttonText = 'View';
  let buttonAction = 'view';
  
  if (status === 'verified' && !nftMinted) {
    buttonText = 'Mint';
    buttonAction = 'mint';
  } else if (status === 'verified' && nftMinted) {
    buttonText = 'View NFT';
    buttonAction = 'viewNFT';
  }

  const handleClick = async () => {
    if (buttonAction === 'mint') {
      await handleMint();
    } else if (buttonAction === 'viewNFT') {
      handleViewNFT();
    } else {
      handleViewRequest();
    }
  };

  const handleMint = async () => {
    if (!userWalletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(
        `http://localhost:6969/api/requests/${requestId}/mint`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userWalletAddress,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success('NFT minted successfully!', {
          description: `Token ID: ${data.data.tokenId}`,
        });
        
        // Refresh the page or update state
        window.location.reload();
      } else {
        toast.error('Minting failed', {
          description: data.error,
        });
      }
    } catch (error) {
      toast.error('Minting failed', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewNFT = () => {
    // Open blockchain explorer
    const explorerUrl = `https://etherscan.io/tx/${nftTransactionHash}`;
    window.open(explorerUrl, '_blank');
  };

  const handleViewRequest = () => {
    // Navigate to request details page
    window.location.href = `/requests/${requestId}`;
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={buttonAction === 'mint' ? 'default' : 'outline'}
    >
      {isLoading ? 'Processing...' : buttonText}
    </Button>
  );
}
```

---

## Usage in Your Requests Page

Update your existing request card component to use the new button:

```typescript
// In your page.tsx or component
import { MintButton } from '@/components/mint-button';
import { useWallet } from '@/context/walletContext'; // Your wallet context

export default function RequestsPage() {
  const { address: walletAddress } = useWallet();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    // Fetch requests with mint status
    const fetchRequests = async () => {
      if (!walletAddress) return;
      
      const response = await fetch(
        `http://localhost:6969/api/wallet/${walletAddress}/requests`
      );
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data);
      }
    };

    fetchRequests();
  }, [walletAddress]);

  return (
    <div className="grid gap-4">
      {requests.map((request) => (
        <div key={request.requestId} className="border p-4 rounded">
          <h3>{request.requestType}</h3>
          <p>Status: {request.status}</p>
          
          <MintButton
            requestId={request.requestId}
            status={request.status}
            nftMinted={request.nftMinted}
            nftTokenId={request.nftTokenId}
            nftTransactionHash={request.nftTransactionHash}
            userWalletAddress={walletAddress}
          />
        </div>
      ))}
    </div>
  );
}
```

---

## Wallet Integration Requirements

Your frontend needs to have:

1. **Wallet Connection** - User's wallet address must be available
2. **Wallet Context** - Use React Context or similar to manage wallet state
3. **Transaction Signing** - User will sign the blockchain transaction (handled by backend, but user needs to be connected)

Example wallet context usage:
```typescript
import { useWallet } from '@/context/walletContext';

function MyComponent() {
  const { address, isConnected } = useWallet();
  
  if (!isConnected) {
    return <ConnectWalletButton />;
  }
  
  return <MintButton userWalletAddress={address} />;
}
```

---

## Error Handling

Common errors you should handle:

### 1. User Not Connected
```typescript
if (!userWalletAddress) {
  toast.error('Please connect your wallet first');
  return;
}
```

### 2. Request Not Verified
```json
{
  "success": false,
  "error": "Cannot mint: Request status is \"pending\". Must be \"verified\"."
}
```

### 3. Already Minted
```json
{
  "success": false,
  "error": "NFT already minted for this request",
  "nftTokenId": 42,
  "nftTransactionHash": "0xabc123..."
}
```

### 4. Wallet Mismatch
```json
{
  "success": false,
  "error": "Wallet address does not match request owner"
}
```

---

## Testing Checklist

- [ ] User sees "View" button when request is pending
- [ ] User sees "View" button when request is rejected
- [ ] User sees "Mint" button when request is verified and not minted
- [ ] User sees "View NFT" button when NFT is already minted
- [ ] Clicking "Mint" triggers minting API call
- [ ] Success toast shows after successful minting
- [ ] Error toast shows appropriate error messages
- [ ] Button is disabled during minting process
- [ ] Page refreshes or state updates after successful mint
- [ ] "View NFT" button opens blockchain explorer

---

## Next Steps

1. **Integrate blockchain minting** - Update `server/src/controllers/nft.controller.ts` to call the actual blockchain script instead of mock data
2. **Add authentication** - Implement proper user authentication if not already present
3. **Add transaction confirmation** - Show transaction hash and link to blockchain explorer
4. **Add loading states** - Show spinner while minting is in progress
5. **Add NFT preview** - Show NFT metadata after minting

---

## Production Checklist

Before deploying to production:

- [ ] Replace mock minting with actual blockchain calls
- [ ] Add proper authentication/authorization
- [ ] Implement rate limiting on mint endpoint
- [ ] Add transaction retry logic
- [ ] Add comprehensive error logging
- [ ] Add analytics tracking for minting events
- [ ] Test with real blockchain network (testnet first)
- [ ] Add gas estimation before minting
- [ ] Implement transaction confirmation UI
- [ ] Add webhook notifications for minting events
