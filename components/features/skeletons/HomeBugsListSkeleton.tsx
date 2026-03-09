import { Skeleton } from "@/components/ui/skeleton"

export function HomeBugsListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border bg-card px-4 py-3 sm:px-5 sm:py-4"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="mb-4 space-y-2">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-10" />
              <Skeleton className="h-6 w-10" />
              <Skeleton className="h-6 w-10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}