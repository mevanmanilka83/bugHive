"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BugDetailedList } from "@/components/bugs/BugDetailedList"

interface ClusterBugsListProps {
  clusterId: string
  userId: string
}

export function ClusterBugsList({ clusterId, userId }: ClusterBugsListProps) {
  const router = useRouter()
  const [bugs, setBugs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  const fetchBugs = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/bugs?cluster_id=${clusterId}&limit=200`)
      if (!res.ok) return
      const data = await res.json()
      const items: any[] = data?.bugs || []
      setBugs(items)
    } finally {
      setLoading(false)
    }
  }, [clusterId])

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
        showTitle={false}
        showReportButton={false}
      />

    </div>
  )
}


