import { Skeleton } from "@/components/ui/skeleton"

import { RotateCw } from "lucide-react"

export function RelatedBugsPanelSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-5 w-full" role="status" aria-label="Loading related bugs">
      <div className="flex flex-col items-center justify-center text-center py-4 text-muted-foreground">
        <RotateCw className="size-5 animate-spin mb-2 opacity-50" />
        <p className="text-sm font-medium">Loading...</p>
      </div>
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
