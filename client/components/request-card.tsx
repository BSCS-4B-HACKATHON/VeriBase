import { shorten } from "@/lib/helpers";
import { RequestType } from "@/lib/types";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Copy, Loader, MoreHorizontal, Eye, Trash2, Home, IdCard, Calendar, User } from "lucide-react";
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
import { motion } from "motion/react";

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
  const isLandTitle = request.requestType === "land_ownership";
  const isNationalId = request.requestType === "national_id";

  // Define document type configurations
  const docConfig = isLandTitle
    ? {
        icon: Home,
        label: "Land Title",
        accentColor: "emerald",
        bgGradient: "bg-surface-75",
        iconBg: "bg-emerald-500/10",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        borderAccent: "border-l-emerald-500",
        hoverShadow: "hover:shadow-emerald-500/20",
      }
    : {
        icon: IdCard,
        label: "National ID",
        accentColor: "blue",
        bgGradient: "bg-surface-75",
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-600 dark:text-blue-400",
        borderAccent: "border-l-blue-500",
        hoverShadow: "hover:shadow-blue-500/20",
      };

  const DocIcon = docConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card className={`group rounded-2xl ${docConfig.borderAccent} border-muted/40 bg-gradient-to-br ${docConfig.bgGradient} hover:shadow-xl ${docConfig.hoverShadow} transition-all duration-300 cursor-pointer overflow-visible flex flex-col h-full`}>
        <CardHeader className="pb-3 pt-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className={`${docConfig.iconBg} p-2.5 rounded-xl`}>
                <DocIcon className={`h-5 w-5 ${docConfig.iconColor}`} />
              </div>
              <div>
                <span className={`text-sm font-bold ${docConfig.iconColor} tracking-wide`}>
                  {docConfig.label}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {request.minimalPublicLabel || "Document Request"}
                </p>
              </div>
            </div>
            {getStatusBadge(request.status)}
          </div>
        </CardHeader>

      {/* let content grow so footer sticks to bottom */}
      <CardContent className="space-y-4 pb-4 flex-1">
        {/* Request ID with enhanced styling */}
        <div className="bg-surface-100 rounded-lg p-3 border border-surface-300">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Request ID
            </p>
          </div>
          <div className="flex items-center gap-2 group/copy">
            <p className="font-mono text-sm font-semibold text-foreground truncate">
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

        {/* Requester Info with icon */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Requester
            </p>
          </div>
          <div className="flex items-center gap-2 group/copy pl-1">
            <p className="font-mono text-sm text-foreground font-medium">
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

        {/* Date Submitted with icon */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Date Submitted
            </p>
          </div>
          <p className="text-sm font-medium text-foreground pl-1">
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
    </motion.div>
  );
}
