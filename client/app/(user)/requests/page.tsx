"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Filter,
  ArrowRight,
  Loader2,
  Loader,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockRequests } from "@/lib/mock-data";
import type { VerificationStatus, VerificationRequest } from "@/lib/types";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

function getStatusBadge(status: VerificationStatus) {
  const variants: Record<
    VerificationStatus,
    { className: string; label: string }
  > = {
    verified: {
      className:
        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
      label: "Verified",
    },
    pending: {
      className:
        "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
      label: "Pending",
    },
    rejected: {
      className:
        "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 hover:bg-red-500/20",
      label: "Rejected",
    },
  };

  return (
    <Badge variant="outline" className={variants[status].className}>
      {variants[status].label}
    </Badge>
  );
}

function shortenAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function RequestCardSkeleton() {
  return (
    <Card className="rounded-2xl border-muted/40">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
      <CardFooter className="pt-4 border-t border-border/40">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}

function RequestCard({
  request,
  onClick,
}: {
  request: VerificationRequest;
  onClick: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [copiedAssetId, setCopiedAssetId] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);

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

  return (
    <Card className="group rounded-2xl border-muted/40 bg-muted/40 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {request.assetType}
            </span>
          </div>
          {getStatusBadge(request.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Asset ID</p>
          <div className="flex items-center gap-2 group/copy">
            <p className="font-mono text-sm font-medium text-foreground truncate">
              {request.assetId}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover/copy:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(request.assetId, "asset");
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
              {shortenAddress(request.walletAddress)}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover/copy:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(request.walletAddress, "wallet");
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
            {format(new Date(request.createdAt), "MMM dd, yyyy")}
          </p>
        </div>

        {request.description && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm text-foreground line-clamp-2">
              {request.description}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 border-t border-border/40 flex gap-2">
        <Button
          onClick={onClick}
          variant="default"
          size="sm"
          className="flex-1 group-hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : "Mint"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}

export default function RequestsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const filteredRequests = React.useMemo(() => {
    let filtered = mockRequests;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.id.toLowerCase().includes(query) ||
          req.assetId.toLowerCase().includes(query) ||
          req.assetType.toLowerCase().includes(query) ||
          req.walletAddress.toLowerCase().includes(query) ||
          req.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, statusFilter]);

  const handleCardClick = (id: string) => {
    router.push(`/requests/${id}`);
  };

  const statusCounts = React.useMemo(() => {
    return {
      all: mockRequests.length,
      pending: mockRequests.filter((r) => r.status === "pending").length,
      verified: mockRequests.filter((r) => r.status === "verified").length,
      rejected: mockRequests.filter((r) => r.status === "rejected").length,
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 lg:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Verification Requests
            </h1>
            <p className="text-muted-foreground">
              Track and manage all your ownership verification requests
            </p>
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto shadow-sm">
            <Link href="/requests/new">
              <Plus className="mr-2 h-5 w-5" />
              New Request
            </Link>
          </Button>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-4 sm:w-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                All ({statusCounts.all})
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm">
                Pending ({statusCounts.pending})
              </TabsTrigger>
              <TabsTrigger value="verified" className="text-xs sm:text-sm">
                Verified ({statusCounts.verified})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs sm:text-sm">
                Rejected ({statusCounts.rejected})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              className="pl-10 shadow-sm"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>
            Showing {filteredRequests.length}{" "}
            {filteredRequests.length === 1 ? "request" : "requests"}
          </span>
        </div>

        {/* Cards Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <RequestCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="rounded-2xl border-muted/40">
            <CardContent className="py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No requests found</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Get started by creating your first verification request"}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/requests/new">
                    <Plus className="mr-2 h-4 w-4" />
                    New Request
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onClick={() => handleCardClick(request.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
