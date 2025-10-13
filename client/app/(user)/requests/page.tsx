"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestType } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import { getAllUsersMintRequests, shorten } from "@/lib/helpers";
import { useWallet } from "@/app/context/walletContext";
import RequestCard from "@/components/request-card";
import RequestCardSkeleton from "@/components/request-card-skeleton";

export default function RequestsPage() {
    const { address } = useWallet();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [requests, setRequests] = useState<RequestType[]>([]);

    useEffect(() => {
        async function fetchUserMintRequests() {
            setIsLoading(true);
            try {
                const mintRequests = await getAllUsersMintRequests(
                    address || ""
                );
                setRequests(mintRequests);
            } catch (error) {
                console.error("Error fetching user mint requests:", error);
            } finally {
                setIsLoading(false);
            }
        }
        setRequests([]);
        if (address) fetchUserMintRequests();
    }, [address]);

    const filteredRequests = useMemo(() => {
        // Prefer real backend requests; fall back to mockRequests only if empty
        let base: RequestType[] = requests && requests.length ? requests : [];

        // map UI status filter to backend status (treat "verified" and "approved" as same)
        const statusToMatch =
            statusFilter === "all"
                ? null
                : statusFilter === "verified"
                ? ["approved", "verified"]
                : [statusFilter];

        if (statusToMatch) {
            base = base.filter((req) =>
                statusToMatch.includes(String(req.status))
            );
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            base = base.filter((req) => {
                if (
                    String(req.requestId ?? "")
                        .toLowerCase()
                        .includes(q)
                )
                    return true;
                if (
                    String(req.requesterWallet ?? "")
                        .toLowerCase()
                        .includes(q)
                )
                    return true;
                if (
                    String(req.requestType ?? "")
                        .toLowerCase()
                        .includes(q)
                )
                    return true;
                if (
                    String(req.minimalPublicLabel ?? "")
                        .toLowerCase()
                        .includes(q)
                )
                    return true;
                if (
                    String(req.metadataCid ?? "")
                        .toLowerCase()
                        .includes(q)
                )
                    return true;
                if (Array.isArray(req.files)) {
                    for (const f of req.files) {
                        if (
                            String(f.filename ?? "")
                                .toLowerCase()
                                .includes(q)
                        )
                            return true;
                        if (
                            String(f.cid ?? "")
                                .toLowerCase()
                                .includes(q)
                        )
                            return true;
                    }
                }
                return false;
            });
        }

        return base;
    }, [searchQuery, statusFilter, requests]);

    const handleCardClick = (id: string) => {
        router.push(`/requests/${id}`);
    };

    const statusCounts = useMemo(() => {
        const source = requests && requests.length ? requests : [];
        const all = source.length;
        const pending = source.filter((r) => r.status === "pending").length;
        // treat approved === verified
        const verified = source.filter((r) => r.status === "verified").length;
        const rejected = source.filter((r) => r.status === "rejected").length;
        return { all, pending, verified, rejected };
    }, [requests]);

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
                            Track and manage all your ownership verification
                            requests
                        </p>
                    </div>
                    <Button
                        asChild
                        size="lg"
                        className="w-full sm:w-auto shadow-sm"
                    >
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
                            <TabsTrigger
                                value="all"
                                className="text-xs sm:text-sm"
                            >
                                All ({statusCounts.all})
                            </TabsTrigger>
                            <TabsTrigger
                                value="pending"
                                className="text-xs sm:text-sm"
                            >
                                Pending ({statusCounts.pending})
                            </TabsTrigger>
                            <TabsTrigger
                                value="verified"
                                className="text-xs sm:text-sm"
                            >
                                Verified ({statusCounts.verified})
                            </TabsTrigger>
                            <TabsTrigger
                                value="rejected"
                                className="text-xs sm:text-sm"
                            >
                                Rejected ({statusCounts.rejected})
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search requests..."
                            value={searchQuery}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                            ) => setSearchQuery(e.target.value)}
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
                    (() => {
                        const filter = statusFilter;
                        let title = "No requests found";
                        let message = searchQuery
                            ? "Try adjusting your search terms"
                            : "You have no requests.";
                        // customize per filter
                        if (filter === "verified") {
                            title = "No verified requests";
                            message = searchQuery
                                ? "No verified requests match your search."
                                : "You have no verified requests yet.";
                        } else if (filter === "pending") {
                            title = "No pending requests";
                            message = searchQuery
                                ? "No pending requests match your search."
                                : "You have no pending requests.";
                        } else if (filter === "rejected") {
                            title = "No rejected requests";
                            message = searchQuery
                                ? "No rejected requests match your search."
                                : "You have no rejected requests.";
                        }

                        return (
                            <Card className="rounded-2xl border-muted/40">
                                <CardContent className="py-16 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-4">
                                        <Search className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">
                                        {title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-6">
                                        {message}
                                    </p>

                                    {/* show New Request CTA when not searching; keep UI consistent */}
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
                        );
                    })()
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredRequests.map((request, i) => (
                            <RequestCard
                                key={i}
                                request={request}
                                onClick={() =>
                                    handleCardClick(request.requestId)
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
