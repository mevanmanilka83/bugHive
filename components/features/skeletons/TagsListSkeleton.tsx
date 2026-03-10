import { Skeleton } from "@/components/ui/skeleton"

export function TagsListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search skeleton */}
      <div className="relative">
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Tags grid skeleton */}
      <div className="rounded-none border border-border/40 bg-card p-6">
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2 rounded-none border px-3 py-1.5"
            >
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer stats skeleton */}
      <div className="rounded-none border border-border/40 bg-card p-4">
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  )
}

