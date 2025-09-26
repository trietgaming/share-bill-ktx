import { Skeleton } from "@/components/ui/skeleton";

export function InvoiceSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header with Summary and Add Button Skeletons */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="p-4 border rounded-lg bg-background space-y-2"
                        >
                            <div className="flex flex-row items-center justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-4" />
                            </div>
                            <Skeleton className="h-8 w-32" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Personal Invoices Skeleton */}
            <div className="border rounded-lg bg-background">
                <div className="p-4 border-b">
                    <Skeleton className="h-6 w-40" />
                </div>
                <div className="p-4">
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-4 w-32 flex-1" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Shared Invoices Skeleton */}
            <div className="border rounded-lg bg-background">
                <div className="p-4 border-b">
                    <Skeleton className="h-6 w-40" />
                </div>
                <div className="p-4">
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-4 w-32 flex-1" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
