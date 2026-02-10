"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BugDetailedList } from "@/components/bugs/BugDetailedList"
import { GraphDialog } from "@/components/bugs/GraphDialog"
import { ChartConfig } from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggleGroup"
import { getSolutionsByUser } from "@/app/actions/bug/BugSolution"

interface MyBugsListProps {
  userId: string
  currentUserName?: string
  currentUserImage?: string
  showReportButton?: boolean
  visibilityFilter?: "private" | "public"
  onVisibilityChange?: (value: "private" | "public") => void
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
  const [internalVisibilityFilter, setInternalVisibilityFilter] = React.useState<"private" | "public">("private")

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

      const clusterNameMap = new Map<string, string>()
      if (clusterIds.length > 0) {
        await Promise.all(
          clusterIds.map(async (clusterId) => {
            try {
              const clusterRes = await fetch(`/api/clusters/${clusterId}`)
              if (!clusterRes.ok) return
              const clusterData = await clusterRes.json()
              const name = clusterData?.cluster?.name
              if (typeof name === "string" && name.trim()) {
                clusterNameMap.set(clusterId, name.trim())
              }
            } catch {
              // Ignore cluster lookup failures
            }
          })
        )
      }

      const enriched = items.map((bug) => {
        if (bug.cluster_id && clusterNameMap.has(bug.cluster_id)) {
          return { ...bug, cluster_name: clusterNameMap.get(bug.cluster_id) }
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
      const rawVisibility = (bug.visibility || "").toString().toLowerCase()
      const visibility = rawVisibility === "public" || rawVisibility === "private"
        ? rawVisibility
        : bug.cluster_id
          ? "private"
          : "public"
      return visibility === activeVisibilityFilter
    })
  }, [bugs, activeVisibilityFilter])

  const handleVisibilityChange = React.useCallback((value: "private" | "public") => {
    if (onVisibilityChange) {
      onVisibilityChange(value)
      return
    }
    setInternalVisibilityFilter(value)
  }, [onVisibilityChange])

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredBugs.length} {activeVisibilityFilter} bug{filteredBugs.length !== 1 ? "s" : ""}
        </p>
        {showVisibilityToggle && (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={activeVisibilityFilter}
            onValueChange={(value) => {
              if (value === "public" || value === "private") handleVisibilityChange(value)
            }}
            className="w-full sm:w-auto"
          >
            <ToggleGroupItem
              value="private"
              className="flex-1 px-3 py-1 text-xs data-[state=on]:bg-foreground data-[state=on]:text-background"
            >
              Private
            </ToggleGroupItem>
            <ToggleGroupItem
              value="public"
              className="flex-1 px-3 py-1 text-xs data-[state=on]:bg-foreground data-[state=on]:text-background"
            >
              Public
            </ToggleGroupItem>
          </ToggleGroup>
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

