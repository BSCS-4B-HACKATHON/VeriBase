import { Card, CardHeader, CardContent, CardFooter } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export default function RequestCardSkeleton() {
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
