"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@/hooks/useWallet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  FileCheck,
  RefreshCw,
  ExternalLink,
  Copy,
  Eye,
  Shield,
  CheckCircle2,
  Calendar,
  Hash,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Send,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface NFTDocument {
  id: string;
  tokenId: string;
  title: string;
  type: "Land Title" | "National ID";
  mintedDate: string;
  contractAddress: string;
  ownerAddress: string;
  imageUrl?: string;
  metadataUrl?: string;
  verified: boolean;
  blockchainExplorerUrl: string;
}

export default function NFTsPage() {
  const { address } = useWallet();
  const [nfts, setNfts] = useState<NFTDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFTDocument | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch NFTs from blockchain
  const fetchNFTs = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual blockchain API call
      // Mock data for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockNFTs: NFTDocument[] = [
        {
          id: "1",
          tokenId: "1298",
          title: "Land Title #1298",
          type: "Land Title",
          mintedDate: "2025-10-14T10:30:00Z",
          contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
          ownerAddress: address || "0x0000000000000000000000000000000000000000",
          imageUrl:
            "https://via.placeholder.com/300x200/1a1a1a/3ECF8E?text=Land+Title",
          verified: true,
          blockchainExplorerUrl: `https://etherscan.io/nft/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/1298`,
        },
        {
          id: "2",
          tokenId: "0x5A7B",
          title: "National ID Verification",
          type: "National ID",
          mintedDate: "2025-10-12T14:20:00Z",
          contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
          ownerAddress: address || "0x0000000000000000000000000000000000000000",
          imageUrl:
            "https://via.placeholder.com/300x200/1a1a1a/3ECF8E?text=National+ID",
          verified: true,
          blockchainExplorerUrl: `https://etherscan.io/nft/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/23163`,
        },
        {
          id: "3",
          tokenId: "2405",
          title: "Land Title #2405",
          type: "Land Title",
          mintedDate: "2025-10-10T09:15:00Z",
          contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
          ownerAddress: address || "0x0000000000000000000000000000000000000000",
          imageUrl:
            "https://via.placeholder.com/300x200/1a1a1a/3ECF8E?text=Property+Deed",
          verified: true,
          blockchainExplorerUrl: `https://etherscan.io/nft/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/2405`,
        },
      ];

      setNfts(mockNFTs);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
      toast.error("Failed to fetch NFT documents");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchNFTs();
    } else {
      setIsLoading(false);
    }
  }, [address]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNFTs();
    toast.success("Refreshing NFT documents...");
  };

  const handleCopyTokenId = (tokenId: string) => {
    navigator.clipboard.writeText(tokenId);
    toast.success("Token ID copied to clipboard!");
  };

  const handleViewDetails = (nft: NFTDocument) => {
    setSelectedNFT(nft);
    setIsDetailsOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container mx-auto p-6 lg:p-8 space-y-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight flex items-center gap-3">
                Your NFT Documents
                <Sparkles className="w-8 h-8 text-[#3ECF8E]" />
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                All your verified ownership proofs stored securely on-chain.
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="lg"
              className="w-full md:w-auto border-[#3ECF8E]/30 hover:bg-[#3ECF8E]/10 hover:border-[#3ECF8E]/50 transition-colors"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* NFT Grid or Empty State */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <Card className="bg-surface-75 rounded-xl overflow-hidden">
                  <div className="aspect-video bg-surface-300 animate-pulse" />
                  <CardContent className="p-6 space-y-3">
                    <div className="h-6 bg-surface-300 rounded animate-pulse" />
                    <div className="h-4 bg-surface-300 rounded w-2/3 animate-pulse" />
                    <div className="h-4 bg-surface-300 rounded w-1/2 animate-pulse" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : nfts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-surface-75 rounded-2xl border-border/40">
              <CardContent className="py-24 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#3ECF8E]/10 mb-6 relative">
                  <FileCheck className="h-10 w-10 text-[#3ECF8E]" />
                  <div className="absolute inset-0 rounded-full bg-[#3ECF8E]/20 animate-ping" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">
                  No NFT Documents yet
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Once your verifications are approved, they'll appear here as
                  blockchain-backed proof of ownership.
                </p>
                <Button
                  asChild
                  size="lg"
                  className="shadow-lg shadow-primary/20"
                >
                  <Link href="/requests">
                    <FileText className="mr-2 h-5 w-5" />
                    Go to Requests
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {nfts.map((nft, index) => (
              <motion.div
                key={nft.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="bg-surface-75 rounded-xl overflow-hidden group hover:shadow-xl hover:shadow-[#3ECF8E]/10 transition-all duration-300 border-border/40 hover:border-[#3ECF8E]/30">
                  {/* NFT Image */}
                  <div className="relative aspect-video bg-surface-200 overflow-hidden">
                    {nft.imageUrl ? (
                      <img
                        src={nft.imageUrl}
                        alt={nft.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}

                    {/* Verified Badge Overlay */}
                    {nft.verified && (
                      <div className="absolute top-3 right-3 bg-[#3ECF8E]/90 backdrop-blur-sm text-black px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium">
                        <Shield className="w-3 h-3" />
                        Verified
                      </div>
                    )}
                  </div>

                  <CardContent className="p-5 space-y-4">
                    {/* Title & Type */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg leading-tight line-clamp-1">
                        {nft.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`${
                          nft.type === "Land Title"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                        }`}
                      >
                        {nft.type}
                      </Badge>
                    </div>

                    {/* Token ID */}
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <code className="font-mono text-xs text-muted-foreground">
                        {nft.tokenId}
                      </code>
                    </div>

                    {/* Minted Date */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">
                        Minted on {formatDate(nft.mintedDate)}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-2">
                      <Button
                        onClick={() => handleViewDetails(nft)}
                        variant="outline"
                        size="sm"
                        className="w-full border-[#3ECF8E]/30 hover:bg-[#3ECF8E]/10 hover:border-[#3ECF8E]/50 transition-colors"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="flex-1 hover:bg-surface-300"
                        >
                          <Link href={`/nfts/${nft.contractAddress}}/transfer`}>
                            <Send className="mr-2 h-3 w-3" />
                            Transfer
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="flex-1 hover:bg-surface-300"
                        >
                          <a
                            href={nft.blockchainExplorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-3 w-3" />
                            Explorer
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* NFT Details Sheet (Modal) */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-4">
          {selectedNFT && (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl">
                  {selectedNFT.title}
                </SheetTitle>
                <SheetDescription>
                  Blockchain-verified ownership document
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* NFT Image */}
                <div className="relative aspect-video bg-surface-200 rounded-lg overflow-hidden border border-border/40">
                  {selectedNFT.imageUrl ? (
                    <img
                      src={selectedNFT.imageUrl}
                      alt={selectedNFT.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-20 h-20 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Verification Status */}
                <div className="flex items-center gap-2 p-4 bg-[#3ECF8E]/10 border border-[#3ECF8E]/30 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-[#3ECF8E]" />
                  <span className="text-sm font-medium text-[#3ECF8E]">
                    Verified on Blockchain
                  </span>
                </div>

                {/* Details Grid */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Document Type
                    </label>
                    <div>
                      <Badge
                        variant="outline"
                        className={`${
                          selectedNFT.type === "Land Title"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                            : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                        }`}
                      >
                        {selectedNFT.type}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Token ID
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 font-mono text-sm bg-surface-200 px-3 py-2 rounded border border-border/40">
                        {selectedNFT.tokenId}
                      </code>
                      <Button
                        onClick={() => handleCopyTokenId(selectedNFT.tokenId)}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Contract Address
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 font-mono text-sm bg-surface-200 px-3 py-2 rounded border border-border/40 overflow-x-auto">
                        {shortenAddress(selectedNFT.contractAddress)}
                      </code>
                      <Button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            selectedNFT.contractAddress
                          )
                        }
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Owner Address
                    </label>
                    <code className="block font-mono text-sm bg-surface-200 px-3 py-2 rounded border border-border/40 overflow-x-auto">
                      {shortenAddress(selectedNFT.ownerAddress)}
                    </code>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Minted Date
                    </label>
                    <div className="text-sm font-medium">
                      {new Date(selectedNFT.mintedDate).toLocaleString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 space-y-2">
                  <Button asChild className="w-full" size="lg">
                    <Link href="/nfts/1">
                      <ExternalLink className="mr-2 h-5 w-5" />
                      More Details
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
