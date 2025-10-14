# Quick Reference: Using Wagmi in Your Components

## Basic Usage

### Get Wallet Address

```typescript
import { useAccount } from "wagmi";

function MyComponent() {
  const { address, isConnected } = useAccount();

  return <div>{isConnected ? `Connected: ${address}` : "Not connected"}</div>;
}
```

### Connect Wallet

```typescript
import { useConnect } from "wagmi";

function ConnectButton() {
  const { connect, connectors } = useConnect();

  const handleConnect = () => {
    const metamask = connectors.find((c) => c.id === "metaMaskSDK");
    if (metamask) {
      connect({ connector: metamask });
    }
  };

  return <button onClick={handleConnect}>Connect MetaMask</button>;
}
```

### Disconnect Wallet

```typescript
import { useDisconnect } from "wagmi";

function DisconnectButton() {
  const { disconnect } = useDisconnect();

  return <button onClick={() => disconnect()}>Disconnect</button>;
}
```

### Sign Messages / Transactions

```typescript
import { useWalletClient } from "wagmi";

function SignButton() {
  const { data: walletClient } = useWalletClient();

  const handleSign = async () => {
    if (!walletClient) return;

    const signature = await walletClient.signMessage({
      message: "Hello from Base!",
    });

    console.log("Signature:", signature);
  };

  return <button onClick={handleSign}>Sign Message</button>;
}
```

### Watch for Account Changes

```typescript
import { useAccount } from "wagmi";
import { useEffect } from "react";

function AccountWatcher() {
  const { address } = useAccount();

  useEffect(() => {
    if (address) {
      console.log("Account changed:", address);
      // Fetch user data, update UI, etc.
    }
  }, [address]);

  return null;
}
```

## Common Patterns

### Protected Route

```typescript
"use client";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  if (!isConnected) return null;

  return <div>Protected Content</div>;
}
```

### Conditional Rendering

```typescript
import { useAccount } from "wagmi";

function Header() {
  const { isConnected, address } = useAccount();

  return (
    <header>
      {isConnected ? (
        <span>Welcome, {address?.slice(0, 6)}...</span>
      ) : (
        <ConnectWalletButton />
      )}
    </header>
  );
}
```

## Available Hooks

| Hook                 | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `useAccount()`       | Get wallet address, connection status, chain info   |
| `useConnect()`       | Connect wallets, list available connectors          |
| `useDisconnect()`    | Disconnect current wallet                           |
| `useWalletClient()`  | Get wallet client for signing messages/transactions |
| `useBalance()`       | Get wallet balance                                  |
| `useChainId()`       | Get current chain ID                                |
| `useSwitchChain()`   | Switch between different chains                     |
| `useSignMessage()`   | Sign messages                                       |
| `useWriteContract()` | Write to smart contracts                            |
| `useReadContract()`  | Read from smart contracts                           |

## Connector IDs in This Project

- **MetaMask**: `"metaMaskSDK"`
- **Coinbase Wallet**: `"coinbaseWalletSDK"`

## Network Configuration

This project is configured for **Base Sepolia** testnet:

- Chain ID: 84532
- Explorer: https://sepolia.basescan.org

To add more networks, edit `lib/wagmi.ts`:

```typescript
import { base, baseSepolia } from "wagmi/chains";

export const config = createConfig({
  chains: [baseSepolia, base], // Add more chains here
  // ...
});
```

## Troubleshooting

### "No connector found"

Make sure you're using the correct connector ID: `"metaMaskSDK"` or `"coinbaseWalletSDK"`

### "Not connected" after page refresh

Wagmi automatically reconnects. Make sure your component is wrapped with the Providers in `app/layout.tsx`.

### TypeScript errors

The Wagmi config in `lib/wagmi.ts` includes type augmentation. Restart your TypeScript server if needed.

## Learn More

- [Wagmi Docs](https://wagmi.sh)
- [Viem Docs](https://viem.sh)
- [Base Docs](https://docs.base.org)
