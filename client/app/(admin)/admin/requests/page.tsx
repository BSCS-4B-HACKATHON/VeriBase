"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MoreHorizontal,
  Eye,
  Check,
  X,
  Filter,
  ArrowRight,
  User,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { format } from "date-fns";
import { toast } from "sonner";

type FilterTab = "all" | "pending" | "verified" | "rejected";

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

function AdminRequestCard({
  request,
  onClick,
  onApprove,
  onReject,
}: {
  request: VerificationRequest;
  onClick: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [copiedAssetId, setCopiedAssetId] = React.useState(false);
  const [copiedWallet, setCopiedWallet] = React.useState(false);

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
    <Card className="group rounded-2xl border-muted/40 bg-muted/40 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {request.assetType}
            </span>
          </div>
          {getStatusBadge(request.status)}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <User className="h-3 w-3" />
          <span>Submitted by {request.userName}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Asset ID</p>
          <div className="flex items-center gap-2 group/copy">
            <p className="font-mono text-sm font-medium text-foreground flex-1 truncate">
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

      <CardFooter className="pt-4 border-t border-border/40 flex flex-col gap-2">
        {request.status === "pending" ? (
          <>
            <div className="flex gap-2 w-full">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove();
                }}
                variant="default"
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onReject();
                }}
                variant="destructive"
                size="sm"
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
            <Button
              onClick={onClick}
              variant="outline"
              size="sm"
              className="w-full"
            >
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="flex gap-2 w-full">
            <Button
              onClick={onClick}
              variant="default"
              size="sm"
              className="flex-1 group-hover:bg-primary/90"
            >
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export default function AdminRequestsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<FilterTab>("all");

  const filteredRequests = React.useMemo(() => {
    let requests = mockRequests;

    // Apply status filter
    if (activeFilter !== "all") {
      requests = requests.filter((req) => req.status === activeFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      requests = requests.filter(
        (req) =>
          req.id.toLowerCase().includes(query) ||
          req.userName.toLowerCase().includes(query) ||
          req.assetId.toLowerCase().includes(query) ||
          req.assetType.toLowerCase().includes(query) ||
          req.walletAddress.toLowerCase().includes(query) ||
          req.description?.toLowerCase().includes(query)
      );
    }

    return requests;
  }, [searchQuery, activeFilter]);

  const statusCounts = React.useMemo(() => {
    return {
      all: mockRequests.length,
      pending: mockRequests.filter((r) => r.status === "pending").length,
      verified: mockRequests.filter((r) => r.status === "verified").length,
      rejected: mockRequests.filter((r) => r.status === "rejected").length,
    };
  }, []);

  const handleCardClick = (id: string) => {
    router.push(`/admin/requests/${id}`);
  };

  const handleApprove = (id: string) => {
    console.log("Approve request:", id);
    // TODO: Implement approve logic with toast notification
  };

  const handleReject = (id: string) => {
    console.log("Reject request:", id);
    // TODO: Implement reject logic with toast notification
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 lg:p-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Verification Requests
          </h1>
          <p className="text-muted-foreground">
            Review and manage all user verification requests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border-muted/40 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-medium">
                Total Requests
              </CardDescription>
              <CardTitle className="text-3xl font-bold">
                {statusCounts.all}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl border-muted/40 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-medium">
                Pending Review
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-amber-600 dark:text-amber-500">
                {statusCounts.pending}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl border-muted/40 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-medium">
                Verified
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">
                {statusCounts.verified}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-2xl border-muted/40 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-medium">
                Rejected
              </CardDescription>
              <CardTitle className="text-3xl font-bold text-red-600 dark:text-red-500">
                {statusCounts.rejected}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={activeFilter}
            onValueChange={(v) => setActiveFilter(v as FilterTab)}
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
              <p className="text-sm text-muted-foreground">
                Try adjusting your search terms or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRequests.map((request) => (
              <AdminRequestCard
                key={request.id}
                request={request}
                onClick={() => handleCardClick(request.id)}
                onApprove={() => handleApprove(request.id)}
                onReject={() => handleReject(request.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
