"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BugDetailedList } from "@/components/features/bugs/BugDetailedList"
import { SavedBugsListSkeleton } from "@/components/features/skeletons/SavedBugsListSkeleton"

interface SavedBugsListProps {
  userId: string
}

export function SavedBugsList({ userId }: SavedBugsListProps) {
  const router = useRouter()
  const [bugs, setBugs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchSavedBugs = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/saved/bugs")
      if (!res.ok) {
        setBugs([])
        return
      }
      const data = await res.json()
      setBugs(Array.isArray(data?.bugs) ? data.bugs : [])
    } catch {
      setBugs([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchSavedBugs()
  }, [fetchSavedBugs])

  React.useEffect(() => {
    const onSavedChange = () => fetchSavedBugs()
    window.addEventListener("saved:changed", onSavedChange)
    return () => window.removeEventListener("saved:changed", onSavedChange)
  }, [fetchSavedBugs])

  const onBugClick = React.useCallback(
    (bugId: string) => {
      router.push(`/bugs/${bugId}`)
    },
    [router]
  )

  if (loading) {
    return <SavedBugsListSkeleton />
  }

  if (bugs.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        No saved bugs yet. Save bugs from the home page or explore to revisit them here.
      </div>
    )
  }

  return (
    <BugDetailedList
      userId={userId}
      bugs={bugs}
      onBugClick={onBugClick}
      totalCount={bugs.length}
      showTitle={false}
      showReportButton={false}
    />
  )
}
