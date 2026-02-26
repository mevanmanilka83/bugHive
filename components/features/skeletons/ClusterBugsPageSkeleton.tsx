import { Skeleton } from "@/components/ui/skeleton"

export function ClusterBugsPageSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-64 mb-4" />
      <Skeleton className="h-10 w-full mb-4" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
