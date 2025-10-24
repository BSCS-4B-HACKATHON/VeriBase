"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  useUserNFTs,
  type NFTDocument,
  type DecryptedFile,
} from "@/hooks/useUserNFTs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Download,
  Shield,
  Calendar,
  Hash,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  Globe,
  Clock,
  User,
  Maximize2,
  Link as LinkIcon,
  Send,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { TransferNFTModal } from "@/components/transfer-nft-modal";
import Image from "next/image";

interface TimelineEvent {
  title: string;
  date: string;
  status: "completed" | "current" | "upcoming";
}

export default function NFTDocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenId = params.address as string;
  const nftType = searchParams.get("type") as
    | "national-id"
    | "land-title"
    | null;

  const { nfts, isLoading: nftsLoading } = useUserNFTs();
  const [nft, setNft] = useState<NFTDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  useEffect(() => {
    // Find the NFT from the loaded list by tokenId AND type
    if (!nftsLoading && nfts.length > 0) {
      const foundNFT = nfts.find((nftItem) => {
        const matchesTokenId = nftItem.tokenId === tokenId;

        // If type parameter is provided, also match by type
        if (nftType) {
          const nftTypeLower = nftItem.type.toLowerCase().replace(" ", "-");
          const matchesType = nftTypeLower === nftType;
          return matchesTokenId && matchesType;
        }

        // If no type specified, just match by tokenId (first match)
        return matchesTokenId;
      });

      if (foundNFT) {
        setNft(foundNFT);
      } else {
        toast.error("NFT not found");
        router.push("/nfts");
      }
      setIsLoading(false);
    } else if (!nftsLoading) {
      setIsLoading(false);
    }
  }, [tokenId, nftType, nfts, nftsLoading, router]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleDownloadMetadata = () => {
    if (!nft) return;

    // TODO: Extended metadata from tokenURI when available
    const metadata = {
      name: nft.title,
      description: `Verified ${nft.type} document stored on-chain`,
      type: nft.type,
      tokenId: nft.tokenId,
      contractAddress: nft.contractAddress,
      ownerAddress: nft.ownerAddress,
      mintedDate: nft.mintedDate,
      verified: nft.verified,
      attributes: [
        { trait_type: "Document Type", value: nft.type },
        { trait_type: "Verified", value: nft.verified ? "Yes" : "No" },
      ],
    };

    const blob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nft-metadata-${nft.tokenId}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Metadata downloaded!");
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "bg-green-500/10 text-green-500 border-green-500/30",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
      rejected: "bg-red-500/10 text-red-400 border-red-500/30",
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  // TODO: Get timeline from metadata or transaction history
  const timeline: TimelineEvent[] = [
    {
      title: "Request Submitted",
      date: nft?.mintedDate || "",
      status: "completed",
    },
    {
      title: "NFT Minted",
      date: nft?.mintedDate || "",
      status: "completed",
    },
    {
      title: "Stored On-Chain",
      date: nft?.mintedDate || "",
      status: "completed",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 lg:p-8 space-y-8">
          <div className="space-y-4">
            <div className="h-10 w-48 bg-surface-300 rounded animate-pulse" />
            <div className="h-6 w-96 bg-surface-300 rounded animate-pulse" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-96 bg-surface-300 rounded-xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-12 bg-surface-300 rounded animate-pulse" />
              <div className="h-8 bg-surface-300 rounded animate-pulse" />
              <div className="h-8 bg-surface-300 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-surface-75 rounded-2xl border-border/40 max-w-md">
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">NFT Not Found</h3>
            <p className="text-muted-foreground mb-6">
              The NFT document you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button asChild>
              <Link href="/nfts">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to NFTs
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container mx-auto p-6 lg:p-8 space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <Button
            onClick={() => router.push("/nfts")}
            variant="ghost"
            size="sm"
            className="mb-2 hover:bg-surface-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to NFTs
          </Button>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              NFT Document Details
            </h1>
            <p className="text-muted-foreground">
              View all on-chain and verification details of your document.
            </p>
          </div>
        </motion.div>

        {/* Main Content - Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - NFT Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-surface-75 rounded-xl overflow-hidden border-border/40 sticky top-6">
              <CardContent className="p-0">
                <div className="relative aspect-[4/3] bg-surface-200">
                  {
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-20 h-20 text-muted-foreground/30" />
                    </div>
                  }

                  {/* Verified Badge Overlay */}
                  {nft.verified && (
                    <div className="absolute top-4 left-4 bg-[#3ECF8E]/90 backdrop-blur-sm text-black px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium">
                      <Shield className="w-4 h-4" />
                      Verified On-Chain
                    </div>
                  )}

                  {/* Zoom Button */}
                  <Button
                    onClick={() => setIsImageModalOpen(true)}
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white border-white/20"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
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
                    <Badge
                      variant="outline"
                      className={getStatusBadge(nft.status)}
                    >
                      {nft.status.charAt(0).toUpperCase() + nft.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - NFT Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Title Card */}
            <Card className="bg-surface-75 rounded-xl border-border/40">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-bold">{nft.title}</h2>

                <Separator className="bg-border/40" />

                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">Minted on</span>
                    </div>
                    <span className="text-sm font-medium text-right">
                      {new Date(nft.mintedDate).toLocaleString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">Owner</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-foreground">
                        {shortenAddress(nft.ownerAddress)}
                      </code>
                      <Button
                        onClick={() =>
                          handleCopy(nft.ownerAddress, "Owner address")
                        }
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">Token ID</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-foreground">
                        {nft.tokenId}
                      </code>
                      <Button
                        onClick={() => handleCopy(nft.tokenId, "Token ID")}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">Contract</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://etherscan.io/address/${nft.contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-[#3ECF8E] hover:underline"
                      >
                        {shortenAddress(nft.contractAddress)}
                      </a>
                      <Button
                        onClick={() =>
                          handleCopy(nft.contractAddress, "Contract address")
                        }
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">Network</span>
                    </div>
                    <span className="text-sm font-medium">{nft.network}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-surface-75 rounded-xl border-border/40">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  <Button asChild className="w-full" size="lg">
                    <a
                      href={nft.blockchainExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on Explorer
                    </a>
                  </Button>
                  <Button
                    onClick={handleDownloadMetadata}
                    variant="outline"
                    size="lg"
                    className="w-full border-[#3ECF8E]/30 hover:bg-[#3ECF8E]/10"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                {/* Only show transfer button for Land Title NFTs (National ID is soul-bound) */}
                {nft.type === "Land Title" && (
                  <Button
                    onClick={() => setIsTransferModalOpen(true)}
                    variant="ghost"
                    size="lg"
                    className="w-full mt-3 hover:bg-surface-300"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Transfer
                  </Button>
                )}
                {nft.type === "National ID" && (
                  <div className="mt-3 p-3 bg-surface-200/50 rounded-lg border border-border/40">
                    <p className="text-xs text-muted-foreground text-center">
                      <Shield className="inline w-3 h-3 mr-1" />
                      National ID NFTs are soul-bound and cannot be transferred
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Metadata & Verification Details Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid gap-6 md:grid-cols-2"
        >
          {/* Verification Details */}
          <Card className="bg-surface-75 rounded-xl border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="w-5 h-5 text-[#3ECF8E]" />
                Verification Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Document Type
                </label>
                <div className="text-sm font-medium">{nft.type}</div>
              </div>

              <Separator className="bg-border/40" />

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Upload Date
                </label>
                <div className="text-sm font-medium">
                  {new Date(nft.uploadDate).toLocaleString()}
                </div>
              </div>

              <Separator className="bg-border/40" />

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Verification Authority
                </label>
                <div className="text-sm font-medium">
                  {nft.verificationAuthority}
                </div>
              </div>

              <Separator className="bg-border/40" />

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  Validation Timestamp
                </label>
                <div className="text-sm font-medium">
                  {new Date(nft.validationTimestamp).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Details */}
          <Card className="bg-surface-75 rounded-xl border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LinkIcon className="w-5 h-5 text-[#3ECF8E]" />
                Blockchain Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">
                  NFT Contract Address
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-surface-200 px-3 py-2 rounded border border-border/40 overflow-x-auto">
                    {nft.contractAddress}
                  </code>
                  <Button
                    onClick={() =>
                      handleCopy(nft.contractAddress, "Contract address")
                    }
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator className="bg-border/40" />

              {nft.ipfsCid && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">
                      IPFS CID
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono bg-surface-200 px-3 py-2 rounded border border-border/40 overflow-x-auto">
                        {nft.ipfsCid}
                      </code>
                      <Button
                        onClick={() => handleCopy(nft.ipfsCid!, "IPFS CID")}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Decrypted Metadata Section - Only visible to owner */}
        {nft.decryptedMetadata && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-6"
          >
            {/* Decrypted Personal Data Fields */}
            {(nft.decryptedMetadata.nationalIdData ||
              nft.decryptedMetadata.landTitleData ||
              nft.decryptedMetadata.decryptedFields) && (
              <Card className="bg-surface-75 rounded-xl border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="w-5 h-5 text-[#3ECF8E]" />
                    {nft.type === "National ID"
                      ? "National ID Information"
                      : "Land Title Information"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Decrypted data from on-chain metadata
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* National ID Data */}
                  {nft.type === "National ID" &&
                    nft.decryptedMetadata.nationalIdData && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {nft.decryptedMetadata.nationalIdData.firstName && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wide">
                              First Name
                            </label>
                            <div className="text-sm font-medium">
                              {nft.decryptedMetadata.nationalIdData.firstName}
                            </div>
                          </div>
                        )}
                        {nft.decryptedMetadata.nationalIdData.lastName && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wide">
                              Last Name
                            </label>
                            <div className="text-sm font-medium">
                              {nft.decryptedMetadata.nationalIdData.lastName}
                            </div>
                          </div>
                        )}
                        {nft.decryptedMetadata.nationalIdData.middleName && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wide">
                              Middle Name
                            </label>
                            <div className="text-sm font-medium">
                              {nft.decryptedMetadata.nationalIdData.middleName}
                            </div>
                          </div>
                        )}
                        {nft.decryptedMetadata.nationalIdData.idNumber && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wide">
                              ID Number
                            </label>
                            <div className="text-sm font-mono">
                              {nft.decryptedMetadata.nationalIdData.idNumber}
                            </div>
                          </div>
                        )}
                        {nft.decryptedMetadata.nationalIdData.issueDate && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wide">
                              Issue Date
                            </label>
                            <div className="text-sm font-medium">
                              {nft.decryptedMetadata.nationalIdData.issueDate}
                            </div>
                          </div>
                        )}
                        {nft.decryptedMetadata.nationalIdData.expiryDate && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wide">
                              Expiry Date
                            </label>
                            <div className="text-sm font-medium">
                              {nft.decryptedMetadata.nationalIdData.expiryDate}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Land Title Data */}
                  {nft.type === "Land Title" &&
                    nft.decryptedMetadata.landTitleData && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {nft.decryptedMetadata.landTitleData.firstName && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wide">
                              First Name
                            </label>
                            <div className="text-sm font-medium">
                              {nft.decryptedMetadata.landTitleData.firstName}
                            </div>
                          </div>
                        )}
                        {nft.decryptedMetadata.landTitleData.lastName && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wide">
                              Last Name
                            </label>
                            <div className="text-sm font-medium">
                              {nft.decryptedMetadata.landTitleData.lastName}
                            </div>
                          </div>
                        )}
                        {nft.decryptedMetadata.landTitleData.middleName && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wide">
                              Middle Name
                            </label>
                            <div className="text-sm font-medium">
                              {nft.decryptedMetadata.landTitleData.middleName}
                            </div>
                          </div>
                        )}
                        {nft.decryptedMetadata.landTitleData.titleNumber && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wide">
                              Title Number
                            </label>
                            <div className="text-sm font-mono">
                              {nft.decryptedMetadata.landTitleData.titleNumber}
                            </div>
                          </div>
                        )}
                        {nft.decryptedMetadata.landTitleData.latitude && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wide">
                              Latitude
                            </label>
                            <div className="text-sm font-medium">
                              {nft.decryptedMetadata.landTitleData.latitude}
                            </div>
                          </div>
                        )}
                        {nft.decryptedMetadata.landTitleData.longitude && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wide">
                              Longitude
                            </label>
                            <div className="text-sm font-medium">
                              {nft.decryptedMetadata.landTitleData.longitude}
                            </div>
                          </div>
                        )}
                        {nft.decryptedMetadata.landTitleData.lotArea && (
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wide">
                              Lot Area (sqm)
                            </label>
                            <div className="text-sm font-medium">
                              {nft.decryptedMetadata.landTitleData.lotArea}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Generic Decrypted Fields (fallback) */}
                  {!nft.decryptedMetadata.nationalIdData &&
                    !nft.decryptedMetadata.landTitleData &&
                    nft.decryptedMetadata.decryptedFields && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(
                          nft.decryptedMetadata.decryptedFields
                        ).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <label className="text-xs text-muted-foreground uppercase tracking-wide">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </label>
                            <div className="text-sm font-medium">
                              {String(value || "N/A")}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Document Uploads */}
            {((nft.decryptedMetadata?.decryptedFiles &&
              nft.decryptedMetadata.decryptedFiles.length > 0) ||
              (nft.decryptedMetadata?.files &&
                nft.decryptedMetadata.files.length > 0)) && (
              <Card className="bg-surface-75 rounded-xl border-border/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="w-5 h-5 text-[#3ECF8E]" />
                    Document Uploads
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Encrypted files stored securely on IPFS
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(
                    nft.decryptedMetadata.decryptedFiles ||
                    nft.decryptedMetadata.files ||
                    []
                  ).map(
                    (
                      fileData: DecryptedFile | Record<string, unknown>,
                      index: number
                    ) => {
                      const file = fileData as DecryptedFile;
                      const isImage =
                        file.mime?.startsWith("image/") ||
                        file.filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {file.filename || `File ${index + 1}`}
                            </span>
                            {file.size && (
                              <span className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(2)} KB
                              </span>
                            )}
                          </div>
                          {isImage ? (
                            <div className="rounded-lg border border-border/40 overflow-hidden bg-surface-200">
                              <Image
                                src={file.decryptedUrl || ""}
                                alt={file.filename || `Image ${index + 1}`}
                                width={800}
                                height={400}
                                className="w-full h-auto max-h-[400px] object-contain"
                              />
                            </div>
                          ) : (
                            <a
                              href={file.decryptedUrl || undefined}
                              download={file.filename}
                              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border/40 bg-surface-200 hover:bg-surface-300 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">View</span>
                            </a>
                          )}
                          {index <
                            (
                              nft.decryptedMetadata?.decryptedFiles ||
                              nft.decryptedMetadata?.files ||
                              []
                            ).length -
                              1 && <Separator className="bg-border/40" />}
                        </div>
                      );
                    }
                  )}
                  <p className="text-xs text-muted-foreground mt-4">
                    Accepted formats: JPG, PNG (Max 5MB)
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Transaction Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-surface-75 rounded-xl border-border/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-[#3ECF8E]" />
                NFT Lifecycle Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {timeline.map((event, index) => (
                  <div key={index} className="flex gap-4 pb-8 last:pb-0">
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                          event.status === "completed"
                            ? "bg-[#3ECF8E]/20 border-2 border-[#3ECF8E]"
                            : "bg-surface-300 border-2 border-border"
                        }`}
                      >
                        {event.status === "completed" && (
                          <CheckCircle2 className="w-4 h-4 text-[#3ECF8E]" />
                        )}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="absolute top-8 w-0.5 h-full bg-border/40" />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <h4 className="font-semibold text-sm">{event.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.date).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Image Modal/Fullscreen */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-7xl w-full">
            <Button
              onClick={() => setIsImageModalOpen(false)}
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 z-10"
            >
              Close
            </Button>
            <Image
              src={nft.imageUrl || ""}
              alt={nft.title}
              width={1200}
              height={800}
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Transfer NFT Modal */}
      {nft && (
        <TransferNFTModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          nft={nft}
        />
      )}
    </div>
  );
}
