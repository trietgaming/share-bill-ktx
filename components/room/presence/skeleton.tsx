import { Skeleton } from "@/components/ui/skeleton";

export function PresenceSkeleton() {
    return (
        <div className="space-y-6">
          {/* Header Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg bg-background space-y-2">
            <div className="flex flex-row items-center justify-between pb-2">
              <div className="w-24 h-4">
                <Skeleton className="w-full h-full" />
              </div>
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="h-8 w-20">
              <Skeleton className="w-full h-full" />
            </div>
            <div className="h-4 w-28">
              <Skeleton className="w-full h-full" />
            </div>
              </div>
            ))}
          </div>

          {/* Calendar Skeleton */}
          <div className="border rounded-lg bg-background">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-6 w-24 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
              </div>
            </div>
            <div className="p-4">
              {/* Legend Skeleton */}
              <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
              </div>
              {/* Calendar Grid Skeleton */}
              <div className="overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <div className="grid grid-cols-7 gap-1 min-w-[500px]">
              {/* Day headers */}
              {[...Array(7)].map((_, i) => (
                <div key={i} className="p-2 text-center text-sm font-medium text-muted-foreground sticky top-0 bg-background z-10 border-b">
                  <Skeleton className="h-4 w-10 mx-auto" />
                </div>
              ))}
              {/* Calendar days skeleton */}
              {[...Array(35)].map((_, i) => (
                <div key={i} className="p-2 h-20">
                  <Skeleton className="w-full h-full rounded-lg" />
                </div>
              ))}
            </div>
              </div>
              {/* Instructions Skeleton */}
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
        </div>
    )
}