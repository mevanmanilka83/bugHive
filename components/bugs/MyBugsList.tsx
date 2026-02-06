"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BugDetailedList } from "@/components/bugs/BugDetailedList"
import { GraphDialog } from "@/components/bugs/GraphDialog"
import { ChartConfig } from "@/components/ui/chart"
import { getSolutionsByUser } from "@/app/actions/bug/BugSolution"

interface MyBugsListProps {
  userId: string
  currentUserName?: string
  currentUserImage?: string
}

export function MyBugsList({ userId, currentUserName, currentUserImage }: MyBugsListProps) {
  const router = useRouter()
  const [bugs, setBugs] = React.useState<any[]>([])
  const [graphOpen, setGraphOpen] = React.useState(false)
  const [chartData, setChartData] = React.useState<Array<{ date: string; count: number }>>([])
  const [loading, setLoading] = React.useState(false)

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
      setBugs(items)

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

  return (
    <div>
      <BugDetailedList
        userId={userId}
        bugs={bugs}
        onBugClick={openBugDetails}
        totalCount={bugs.length}
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

