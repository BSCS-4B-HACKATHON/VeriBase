import { shorten } from "@/lib/helpers";
import { RequestType } from "@/lib/types";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Copy, Loader, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/card";
import getStatusBadge from "./get-status-badge";
import { useRouter } from "next/navigation";
import { useClientMint } from "@/hooks/useClientMint";
import { useAccount } from "wagmi";
import { baseSepolia } from "viem/chains";

export default function RequestCard({
  request,
  onClick,
}: {
  request: RequestType;
  onClick: () => void;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [copiedAssetId, setCopiedAssetId] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const { mintNFT, isMinting } = useClientMint();
  const { isConnected, chain } = useAccount();

  // Check if on correct network
  const isCorrectNetwork = chain?.id === baseSepolia.id;

  const copyToClipboard = async (text: string, type: "asset" | "wallet") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "asset") {
        setCopiedAssetId(true);
        setTimeout(() => setCopiedAssetId(false), 2000);
        toast.success("Asset ID copied to clipboard");
      } else {
        setCopiedWallet(true);
        setTimeout(() => setCopiedWallet(false), 2000);
        toast.success("Wallet address copied to clipboard");
      }
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDelete = async (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    try {
      setIsLoading(true);

      const BE_URL = process.env.NEXT_PUBLIC_BE_URL || "";
      if (!BE_URL) {
        throw new Error("backend url not configured");
      }

      const url = `${BE_URL}/api/requests/${encodeURIComponent(
        request.requesterWallet
      )}/${encodeURIComponent(request.requestId)}`;

      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => null);
        throw new Error(`delete failed ${res.status} ${body ?? ""}`);
      }

      toast.success("Request deleted");
      // optional: navigate or refresh list
      // for now, reload the page so UI reflects deletion
      setTimeout(() => window.location.reload(), 400);
    } catch (err) {
      console.error("delete failed", err);
      toast.error("Failed to delete request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = () => router.push(`/requests/${request.requestId}`);

  const handleMint = async (e?: React.SyntheticEvent) => {
    e?.stopPropagation();

    console.log("🔘 Mint button clicked!");
    console.log("   Is connected:", isConnected);
    console.log("   Is correct network:", isCorrectNetwork);
    console.log("   Chain ID:", chain?.id);
    console.log("   Expected chain ID:", baseSepolia.id);

    // Check wallet connection first
    if (!isConnected) {
      console.log("❌ Not connected");
      toast.error("Please connect your wallet first");
      return;
    }

    // Check network - user must switch manually
    if (!isCorrectNetwork) {
      console.log("❌ Wrong network");
      toast.error("Please switch to Base Sepolia network in your wallet");
      return;
    }

    console.log("✅ All checks passed, calling mintNFT...");

    try {
      setIsLoading(true);

      // Call client-side mint - user pays gas!
      // This will automatically switch networks if needed
      const result = await mintNFT({
        requestId: request.requestId,
        requestType: request.requestType as "national_id" | "land_ownership",
        metadataURI: request.metadataCid || `ipfs://${request.metadataCid}`,
      });

      if (result.success) {
        toast.success("NFT minted successfully! 🎉", {
          description: `Token ID: ${result.tokenId?.toString() || "N/A"}`,
          action: result.explorerUrl
            ? {
                label: "View on Explorer",
                onClick: () => window.open(result.explorerUrl, "_blank"),
              }
            : undefined,
        });

        // Refresh the page after successful mint
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error("Failed to mint NFT", {
          description: result.error || "Please try again",
        });
      }
    } catch (err: any) {
      console.error("mint failed", err);
      toast.error("Failed to mint NFT", {
        description: err.message || "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isPending = String(request.status).toLowerCase() === "pending";
  const isRejected = String(request.status).toLowerCase() === "rejected";

  return (
    // make card a column flex so content pushes footer to bottom and cards align in grid
    <Card className="group rounded-2xl border-muted/40 bg-muted/40 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-visible flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {request.requestType}
            </span>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>

      {/* let content grow so footer sticks to bottom */}
      <CardContent className="space-y-3 pb-4 flex-1">
        {/* Request ID, Wallet, Date (unchanged) */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Request ID</p>
          <div className="flex items-center gap-2 group/copy">
            <p className="font-mono text-sm font-medium text-foreground truncate">
              {shorten(request.requestId)}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover/copy:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(request.requestId, "asset");
              }}
            >
              {copiedAssetId ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Wallet Address</p>
          <div className="flex items-center gap-2 group/copy">
            <p className="font-mono text-sm text-foreground">
              {shorten(request.requesterWallet)}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover/copy:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(request.requesterWallet, "wallet");
              }}
            >
              {copiedWallet ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Date Submitted</p>
          <p className="text-sm text-foreground">
            {request.createdAt
              ? format(new Date(request.createdAt), "MMM dd, yyyy")
              : "—"}
          </p>
        </div>
      </CardContent>

      {/* responsive footer: stacked on mobile, inline on sm+; trigger is not absolute */}
      <CardFooter className="pt-4 border-t border-border/40 flex items-center gap-2">
        <div className="flex-1">
          {String(request.status).toLowerCase() === "approved" ||
          String(request.status).toLowerCase() === "verified" ? (
            <Button
              onClick={handleMint}
              variant="default"
              size="sm"
              className="flex-1 h-10 w-full"
              disabled={isLoading || isMinting}
            >
              {isLoading || isMinting ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : !isConnected ? (
                "Connect Wallet to Mint"
              ) : !isCorrectNetwork ? (
                "Switch to Base Sepolia"
              ) : (
                "Mint NFT"
              )}
            </Button>
          ) : isRejected ? (
            <Button
              onClick={async (e) => {
                e.stopPropagation();
                await handleDelete(e);
              }}
              variant="destructive"
              size="sm"
              className="flex-1 h-10 w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          ) : (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleView();
              }}
              variant="default"
              size="sm"
              className="flex-1 h-10 w-full cursor-pointer"
            >
              View
            </Button>
          )}
        </div>

        <div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="h-10 w-10 p-0 ml-2 cursor-pointer"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                side="top"
                align="end"
                sideOffset={8}
                className="z-50 w-[160px] rounded-md border bg-popover p-1 shadow-lg"
              >
                <DropdownMenu.Item
                  onClick={(e: any) => {
                    e.stopPropagation();
                    handleView();
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm hover:bg-muted/20 cursor-pointer"
                >
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </DropdownMenu.Item>

                <DropdownMenu.Separator className="my-1 h-px bg-border" />

                <DropdownMenu.Item
                  onClick={(e: any) => {
                    e.stopPropagation();
                    handleDelete(e);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </CardFooter>
    </Card>
  );
}
