import { Skeleton } from "@/components/ui/skeleton"

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/30">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-12 mt-1" />
        </div>
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 rounded-md border border-transparent bg-muted/20" />
      ))}
    </div>
  )
}

function SectionSkeleton() {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="size-1 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <ListSkeleton />
      <Skeleton className="h-3 w-20 mt-2" />
    </section>
  )
}

export function HomeHeaderStatsDialogSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-8">
      {/* Left column */}
      <div className="flex flex-col gap-8">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="size-1 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <StatsSkeleton />
        </section>
        <SectionSkeleton />
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-8">
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    </div>
  )
}
