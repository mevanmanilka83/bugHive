import { Skeleton } from "@/components/ui/skeleton"

function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40 bg-muted/20">
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="p-3">
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1 p-3 rounded-lg bg-muted/40 border border-border/40">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-12 mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ListCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40 bg-muted/20">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="p-3 space-y-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-muted/30 border border-border/30" />
        ))}
      </div>
      <div className="px-3 pb-3">
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export function HomeHeaderStatsDialogSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="flex flex-col gap-5">
        <StatsCardSkeleton />
        <ListCardSkeleton />
      </div>
      <div className="flex flex-col gap-5">
        <ListCardSkeleton />
        <ListCardSkeleton />
      </div>
    </div>
  )
}
