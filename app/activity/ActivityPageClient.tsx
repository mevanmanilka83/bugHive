"use client"

import { useEffect, useState } from "react"
import { ActivitySummary } from "@/components/features/activity/ActivitySummary"
import { ActivityPageSkeleton } from "@/components/features/skeletons/ActivityPageSkeleton"
import type { ActivitySummaryData } from "@/app/actions/activity"

type ActivityPageClientProps = {
  initialSummary:
    | { success: true; data: ActivitySummaryData }
    | { success: false; error: string }
    | null
}

export function ActivityPageClient({ initialSummary }: ActivityPageClientProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  const summaryData =
    initialSummary?.success === true ? initialSummary.data : null
  const summaryError =
    initialSummary?.success === false ? initialSummary.error : null

  if (isLoading) {
    return <ActivityPageSkeleton />
  }

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
          <ActivitySummary data={summaryData} error={summaryError} />
        </div>
      </div>
    </div>
  )
}
