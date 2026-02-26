import { ActivitySummarySkeleton } from "./ActivitySummarySkeleton"

export function ActivityPageSkeleton() {
  return (
    <div className="max-w-4xl">
      <div className="rounded-lg border border-border/40 bg-card p-6 mb-6">
        <h1 className="mb-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Activity
        </h1>
        <p className="text-sm text-muted-foreground">
          Your contributions and activity on bugs and clusters.
        </p>
      </div>
      <div className="rounded-lg border border-border/40 bg-card">
        <div className="p-6">
          <ActivitySummarySkeleton />
        </div>
      </div>
    </div>
  )
}
