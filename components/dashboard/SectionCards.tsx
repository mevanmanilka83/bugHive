"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BugDetailedList } from "@/components/features/bugs/BugDetailedList"
import { HomeBugsListSkeleton } from "@/components/features/skeletons/HomeBugsListSkeleton"

interface SectionCardsProps {
  userId: string
}

export function SectionCards({ userId }: SectionCardsProps) {
  const router = useRouter()
  const [bugs, setBugs] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  async function fetchBugs(showLoading = false) {
    if (showLoading) {
      setIsLoading(true)
    }
    try {
      const res = await fetch(`/api/bugs?created_by=${encodeURIComponent(userId)}&limit=200`)
      if (!res.ok) return
      const data = await res.json()
      const items: any[] = data?.bugs || []
      setBugs(items)
    } catch (error) {
      console.error("Failed to fetch bugs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    const onCreated = () => {
      fetchBugs()
    }
    const onSolutionCreated = () => {
      fetchBugs()
    }
    window.addEventListener("bug:created", onCreated as EventListener)
    window.addEventListener("solution:created", onSolutionCreated as EventListener)
    fetchBugs(true)
    return () => {
      window.removeEventListener("bug:created", onCreated as EventListener)
      window.removeEventListener("solution:created", onSolutionCreated as EventListener)
    }
  }, [userId])

  function openBugDetails(bugId: string) {
    router.push(`/bugs/${bugId}`)
  }

  return (
    <>
    {/* Separate grid for individual bug cards to avoid colliding with summary cards */}
    <div className="px-4 lg:px-6 mt-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">My Recent Bugs</h3>
      </div>
      {isLoading ? (
        <HomeBugsListSkeleton />
      ) : (
        <BugDetailedList
          userId={userId}
          bugs={bugs}
          onBugClick={(bugId) => openBugDetails(bugId)}
          totalCount={bugs.length}
        />
      )}
    </div>
    </>
  )
}
