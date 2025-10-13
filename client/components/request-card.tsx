import { shorten } from "@/lib/helpers";
import { RequestType } from "@/lib/types";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@radix-ui/react-dropdown-menu";
import { Check, Copy, Loader, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/card";
import getStatusBadge from "./get-status-badge";

export default function RequestCard({
    request,
    onClick,
}: {
    request: RequestType;
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

    const handleDelete = async (e?: React.SyntheticEvent) => {
        e?.stopPropagation();
        if (!confirm("Are you sure you want to delete this request?")) return;
        try {
            setIsLoading(true);
            // replace with real API call to delete request
            // await fetch(`/api/requests/${request.requestId}`, { method: "DELETE" });
            toast.success("Request deleted");
        } catch (err) {
            console.error("delete failed", err);
            toast.error("Failed to delete request");
        } finally {
            setIsLoading(false);
        }
    };

    const isPending = String(request.status).toLowerCase() === "pending";
    const isRejected = String(request.status).toLowerCase() === "rejected";

    return (
        <Card className="group rounded-2xl border-muted/40 bg-muted/40 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden">
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

            <CardContent className="space-y-3 pb-4">
                <div>
                    <p className="text-xs text-muted-foreground mb-1">
                        Request ID
                    </p>
                    <div className="flex items-center gap-2 group/copy">
                        <p className="font-mono text-sm font-medium text-foreground truncate">
                            {request.requestId}
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
                    <p className="text-xs text-muted-foreground mb-1">
                        Wallet Address
                    </p>
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
                                copyToClipboard(
                                    request.requesterWallet,
                                    "wallet"
                                );
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
                    <p className="text-xs text-muted-foreground mb-1">
                        Date Submitted
                    </p>
                    <p className="text-sm text-foreground">
                        {format(new Date(request.createdAt), "MMM dd, yyyy")}
                    </p>
                </div>
            </CardContent>

            <CardFooter className="pt-4 border-t border-border/40 flex gap-2">
                {/* Pending: show Mint button + actions menu
                    Rejected: show only Delete
                    Others: show View button + actions menu (including delete) */}
                {isPending ? (
                    <>
                        <Button
                            onClick={onClick}
                            variant="default"
                            size="sm"
                            className="flex-1 group-hover:bg-primary/90"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                                "Mint"
                            )}
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger
                                asChild
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Button variant="outline" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-[160px]"
                            >
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(e);
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                ) : isRejected ? (
                    <Button
                        onClick={async (e) => {
                            e.stopPropagation();
                            await handleDelete(e);
                        }}
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                            "Delete"
                        )}
                    </Button>
                ) : (
                    <>
                        <Button
                            onClick={onClick}
                            variant="default"
                            size="sm"
                            className="flex-1"
                        >
                            View
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger
                                asChild
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Button variant="outline" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="w-[160px]"
                            >
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(e);
                                    }}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </>
                )}
            </CardFooter>
        </Card>
    );
}
