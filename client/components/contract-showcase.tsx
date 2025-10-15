/**
 * Example Component - Showcase Contract Hooks
 *
 * Copy this to see your contracts in action!
 * Location: components/contract-showcase.tsx
 */

"use client";

import { useWallet } from "@/hooks/useWallet";
import {
  useHasNationalId,
  useLandBalance,
  useTransferFee,
  useLandDetails,
} from "@/hooks/useContracts";
import { formatEther } from "viem";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function ContractShowcase() {
  const { address, isConnected } = useWallet();

  // Check National ID
  const {
    hasNationalId,
    balance: nationalIdBalance,
    isLoading: loadingNationalId,
  } = useHasNationalId(address ?? undefined);

  // Check Land Holdings
  const { data: landBalance, isLoading: loadingLand } = useLandBalance(
    address ?? undefined
  );

  // Get Transfer Fee
  const { data: transferFeeBasisPoints } = useTransferFee();

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contract Status</CardTitle>
          <CardDescription>
            Connect your wallet to see your NFTs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please connect your wallet to view your assets
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* National ID Status */}
      <Card>
        <CardHeader>
          <CardTitle>National ID Status</CardTitle>
          <CardDescription>
            Your verified identity on Base Sepolia
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingNationalId ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            <div className="flex items-center gap-2">
              {hasNationalId ? (
                <>
                  <Badge variant="default" className="bg-green-600">
                    ✅ Verified
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Balance: {nationalIdBalance?.toString() ?? "0"}
                  </span>
                </>
              ) : (
                <Badge variant="destructive">❌ No National ID</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Land Holdings */}
      <Card>
        <CardHeader>
          <CardTitle>Land Holdings</CardTitle>
          <CardDescription>Your registered land parcels</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingLand ? (
            <Skeleton className="h-6 w-32" />
          ) : (
            <div>
              <p className="text-2xl font-bold">
                {landBalance?.toString() ?? "0"}
              </p>
              <p className="text-sm text-muted-foreground">
                Land parcels owned
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer Fee Info */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer Fee</CardTitle>
          <CardDescription>Fee charged when purchasing land</CardDescription>
        </CardHeader>
        <CardContent>
          {transferFeeBasisPoints ? (
            <div>
              <p className="text-2xl font-bold">
                {Number(transferFeeBasisPoints) / 100}%
              </p>
              <p className="text-sm text-muted-foreground">
                Applied to all land transfers
              </p>
            </div>
          ) : (
            <Skeleton className="h-6 w-24" />
          )}
        </CardContent>
      </Card>

      {/* Contract Addresses */}
      <Card>
        <CardHeader>
          <CardTitle>Deployed Contracts</CardTitle>
          <CardDescription>Base Sepolia Testnet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm font-mono">
          <div>
            <p className="text-muted-foreground">National ID NFT:</p>
            <a
              href="https://sepolia.basescan.org/address/0xbe5fb46274763165a8e9bda180273b75d817fec0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              0xbe5f...7fec0
            </a>
          </div>
          <div>
            <p className="text-muted-foreground">Land Ownership NFT:</p>
            <a
              href="https://sepolia.basescan.org/address/0xdfaf754cc95a9060bd6e467a652f9642e9e33c26"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              0xdfaf...33c26
            </a>
          </div>
          <div>
            <p className="text-muted-foreground">Land Transfer Contract:</p>
            <a
              href="https://sepolia.basescan.org/address/0xecc7d23c7d82bbaf59cd0b40329d24fd42617467"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              0xecc7...17467
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Example: Land Details Component
 * Shows all info about a specific land parcel
 */
export function LandDetailsCard({ tokenId }: { tokenId: bigint }) {
  const { owner, tokenURI, isForSale, salePrice } = useLandDetails(tokenId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Land Parcel #{tokenId.toString()}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="text-sm font-medium">Owner</p>
          <p className="text-sm text-muted-foreground font-mono break-all">
            {owner ? String(owner) : "Loading..."}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium">Metadata URI</p>
          <p className="text-sm text-muted-foreground break-all">
            {tokenURI ? String(tokenURI) : "Loading..."}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium">Sale Status</p>
          {isForSale ? (
            <div className="flex items-center gap-2">
              <Badge>For Sale</Badge>
              <span className="text-sm">
                {salePrice ? formatEther(salePrice as bigint) : "..."} ETH
              </span>
            </div>
          ) : (
            <Badge variant="secondary">Not for sale</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
