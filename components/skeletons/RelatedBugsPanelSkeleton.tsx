import { Skeleton } from "@/components/ui/skeleton"

export function RelatedBugsPanelSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading related bugs">
      {Array.from({ length: count }).map((i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  )
}
