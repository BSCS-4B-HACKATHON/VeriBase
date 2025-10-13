import { RequestType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export default function getStatusBadge(status: RequestType["status"]) {
    const variants: Record<string, { className: string; label: string }> = {
        approved: {
            className:
                "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
            label: "Verified",
        },
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

    const v = variants[String(status)] ?? {
        className: "bg-muted/10",
        label: String(status),
    };
    return (
        <Badge variant="outline" className={v.className}>
            {v.label}
        </Badge>
    );
}
