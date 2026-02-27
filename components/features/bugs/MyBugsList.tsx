"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BugDetailedList } from "@/components/features/bugs/BugDetailedList"
import { GraphDialog } from "@/components/features/bugs/GraphDialog"
import { ChartConfig } from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggleGroup"
import { getSolutionsByUser } from "@/app/actions/bug/BugSolution"

interface MyBugsListProps {
  userId: string
  currentUserName?: string
  currentUserImage?: string
  showReportButton?: boolean
  visibilityFilter?: "private" | "public" | "cluster-private" | "cluster-public"
  onVisibilityChange?: (value: "private" | "public" | "cluster-private" | "cluster-public") => void
  showVisibilityToggle?: boolean
}

export function MyBugsList({
  userId,
  currentUserName,
  currentUserImage,
  showReportButton = true,
  visibilityFilter,
  onVisibilityChange,
  showVisibilityToggle = true,
}: MyBugsListProps) {
  const router = useRouter()
  const [bugs, setBugs] = React.useState<any[]>([])
  const [graphOpen, setGraphOpen] = React.useState(false)
  const [chartData, setChartData] = React.useState<Array<{ date: string; count: number }>>([])
  const [loading, setLoading] = React.useState(false)
  const [internalVisibilityFilter, setInternalVisibilityFilter] = React.useState<"private" | "public" | "cluster-private" | "cluster-public">("private")

  const chartConfig: ChartConfig = {
    count: {
      label: "Solutions",
      color: "var(--primary)",
    },
  }

  const fetchBugs = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/bugs?created_by=${userId}&limit=200`)
      if (!res.ok) return
      const data = await res.json()
      const items: any[] = data?.bugs || []

      const clusterIds = Array.from(
        new Set(
          items
            .map((bug) => bug.cluster_id)
            .filter((id) => typeof id === "string" && id.length > 0)
        )
      )

      const clusterMetaMap = new Map<string, { name?: string; visibility?: string }>()
      if (clusterIds.length > 0) {
        await Promise.all(
          clusterIds.map(async (clusterId) => {
            try {
              const clusterRes = await fetch(`/api/clusters/${clusterId}`)
              if (!clusterRes.ok) return
              const clusterData = await clusterRes.json()
              const name = clusterData?.cluster?.name
              const visibility = (clusterData?.cluster?.visibility || "").toString().toLowerCase()
              const trimmedName = typeof name === "string" ? name.trim() : ""
              const meta: { name?: string; visibility?: string } = {}
              if (trimmedName) meta.name = trimmedName
              if (visibility === "public" || visibility === "private") meta.visibility = visibility
              if (meta.name || meta.visibility) clusterMetaMap.set(clusterId, meta)
            } catch {
              // Ignore cluster lookup failures
            }
          })
        )
      }

      const enriched = items.map((bug) => {
        if (bug.cluster_id && clusterMetaMap.has(bug.cluster_id)) {
          const meta = clusterMetaMap.get(bug.cluster_id)
          return { ...bug, cluster_name: meta?.name, cluster_visibility: meta?.visibility }
        }
        return bug
      })

      setBugs(enriched)

      // Fetch solutions for bugs created by this user and build chart data
      const solutionsResult = await getSolutionsByUser(userId)
      const solutions: any[] = solutionsResult?.solutions || []

      // Build chart data from solutions and convert to cumulative
      const byDay = new Map<string, number>()
      for (const solution of solutions) {
        const createdAt = solution.created_at || solution.createdAt || solution.createdat
        const d = createdAt ? new Date(createdAt) : new Date()
        const key = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10)
        byDay.set(key, (byDay.get(key) || 0) + 1)
      }
      const sorted = Array.from(byDay.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))

      // Convert to cumulative (running total) - starts from flow (low) to high
      let cumulative = 0
      const cumulativeData = sorted.map(([date, count]) => {
        cumulative += count
        return { date, count: cumulative }
      })

      setChartData(cumulativeData)
    } finally {
      setLoading(false)
    }
  }, [userId])

  React.useEffect(() => {
    fetchBugs()
  }, [fetchBugs])

  React.useEffect(() => {
    const onCreated = () => fetchBugs()
    const onUpdated = () => fetchBugs()
    const onSolutionCreated = () => fetchBugs()
    window.addEventListener("bug:created", onCreated as EventListener)
    window.addEventListener("bug:updated", onUpdated as EventListener)
    window.addEventListener("solution:created", onSolutionCreated as EventListener)
    return () => {
      window.removeEventListener("bug:created", onCreated as EventListener)
      window.removeEventListener("bug:updated", onUpdated as EventListener)
      window.removeEventListener("solution:created", onSolutionCreated as EventListener)
    }
  }, [fetchBugs])

  function openBugDetails(bugId: string) {
    router.push(`/bugs/${bugId}`)
  }

  const activeVisibilityFilter = visibilityFilter ?? internalVisibilityFilter

  const filteredBugs = React.useMemo(() => {
    return bugs.filter((bug) => {
      if (bug.cluster_id) {
        const rawClusterVisibility = (bug.cluster_visibility || "").toString().toLowerCase()
        const clusterVisibility = rawClusterVisibility === "public" ? "cluster-public" : "cluster-private"
        return clusterVisibility === activeVisibilityFilter
      }

      const rawVisibility = (bug.visibility || "").toString().toLowerCase()
      const visibility = rawVisibility === "public" || rawVisibility === "private"
        ? rawVisibility
        : "public"
      return visibility === activeVisibilityFilter
    })
  }, [bugs, activeVisibilityFilter])

  const handleVisibilityChange = React.useCallback((value: "private" | "public" | "cluster-private" | "cluster-public") => {
    if (onVisibilityChange) {
      onVisibilityChange(value)
      return
    }
    setInternalVisibilityFilter(value)
  }, [onVisibilityChange])

  const visibilityLabelMap: Record<"private" | "public" | "cluster-private" | "cluster-public", string> = {
    private: "private",
    public: "public",
    "cluster-private": "cluster private",
    "cluster-public": "cluster public",
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:items-start">
        <p className="text-sm text-muted-foreground">
          {filteredBugs.length} {visibilityLabelMap[activeVisibilityFilter]} bug{filteredBugs.length !== 1 ? "s" : ""}
        </p>
        {showVisibilityToggle && (
          <div className="grid w-full gap-2 sm:max-w-xl">
            <div className="rounded-none border border-muted/60 bg-muted/30 p-2">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                View Filters
              </div>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={activeVisibilityFilter}
                onValueChange={(value) => {
                  if (value === "public" || value === "private") handleVisibilityChange(value)
                }}
                className="flex w-full"
              >
                <ToggleGroupItem
                  value="private"
                  className="flex-1 px-3 py-1 text-xs"
                >
                  Private
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="public"
                  className="flex-1 px-3 py-1 text-xs"
                >
                  Public
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="rounded-none border border-muted/60 bg-muted/30 p-2">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Cluster Actions
              </div>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={activeVisibilityFilter}
                onValueChange={(value) => {
                  if (value === "cluster-public" || value === "cluster-private") handleVisibilityChange(value)
                }}
                className="flex w-full"
              >
                <ToggleGroupItem
                  value="cluster-private"
                  className="flex-1 px-3 py-1 text-xs"
                >
                  Cluster Private
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="cluster-public"
                  className="flex-1 px-3 py-1 text-xs"
                >
                  Cluster Public
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        )}
      </div>
      <BugDetailedList
        userId={userId}
        bugs={filteredBugs}
        onBugClick={openBugDetails}
        totalCount={filteredBugs.length}
        showTitle={false}
        showReportButton={showReportButton}
        currentUserName={currentUserName}
        currentUserImage={currentUserImage}
      />

      <GraphDialog
        open={graphOpen}
        onOpenChange={setGraphOpen}
        chartData={chartData}
        chartConfig={chartConfig}
      />
    </div>
  )
}

