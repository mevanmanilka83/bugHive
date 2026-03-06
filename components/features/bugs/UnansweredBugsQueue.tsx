"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SavedBugsListSkeleton } from "@/components/features/skeletons/SavedBugsListSkeleton"

type BugItem = {
  id: string
  title?: string | null
  description?: string | null
  status?: string | null
  priority?: string | null
  updated_at?: string | null
  created_at?: string | null
}

const PRIORITY_OPTIONS = ["all", "low", "medium", "high", "critical"]

function normalizePriority(priority?: string | null) {
  const value = (priority || "medium").toLowerCase()
  if (["low", "medium", "high", "critical"].includes(value)) {
    return value
  }
  return "medium"
}

function normalizeStatus(status?: string | null) {
  const value = (status || "open").toLowerCase()
  if (["open", "in_progress", "resolved", "reopened", "closed"].includes(value)) {
    return value
  }
  return "open"
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString()
}

export function UnansweredBugsQueue() {
  const router = useRouter()
  const [bugs, setBugs] = React.useState<BugItem[]>([])
  const [solutionCounts, setSolutionCounts] = React.useState<Record<string, number>>({})
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [priorityFilter, setPriorityFilter] = React.useState("all")

  const fetchBugs = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/bugs?limit=500")
      if (!response.ok) {
        setBugs([])
        setSolutionCounts({})
        return
      }

      const data = await response.json()
      const items: BugItem[] = Array.isArray(data?.bugs) ? data.bugs : []
      setBugs(items)

      const counts = await Promise.all(
        items.map(async (bug) => {
          try {
            const res = await fetch(`/api/bugs/${bug.id}/solutions`)
            if (!res.ok) return [bug.id, 0] as const
            const payload = await res.json()
            const total = Array.isArray(payload?.solutions) ? payload.solutions.length : 0
            return [bug.id, total] as const
          } catch {
            return [bug.id, 0] as const
          }
        })
      )

      const next: Record<string, number> = {}
      for (const [bugId, count] of counts) {
        next[bugId] = count
      }
      setSolutionCounts(next)
    } catch {
      setBugs([])
      setSolutionCounts({})
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchBugs()
  }, [fetchBugs])

  React.useEffect(() => {
    const onCreated = () => fetchBugs()
    const onUpdated = () => fetchBugs()
    window.addEventListener("bug:created", onCreated as EventListener)
    window.addEventListener("bug:updated", onUpdated as EventListener)
    return () => {
      window.removeEventListener("bug:created", onCreated as EventListener)
      window.removeEventListener("bug:updated", onUpdated as EventListener)
    }
  }, [fetchBugs])

  const unanswered = React.useMemo(() => {
    const query = search.trim().toLowerCase()

    return bugs
      .filter((bug) => (solutionCounts[bug.id] ?? 0) === 0)
      .filter((bug) => {
        if (priorityFilter !== "all" && normalizePriority(bug.priority) !== priorityFilter) {
          return false
        }
        if (!query) return true
        const title = (bug.title || "").toLowerCase()
        const description = (bug.description || "").toLowerCase()
        return title.includes(query) || description.includes(query)
      })
      .sort((a, b) => {
        const aPriorityScore = PRIORITY_OPTIONS.indexOf(normalizePriority(a.priority))
        const bPriorityScore = PRIORITY_OPTIONS.indexOf(normalizePriority(b.priority))
        if (aPriorityScore !== bPriorityScore) return bPriorityScore - aPriorityScore
        const aTime = new Date(a.updated_at || a.created_at || 0).getTime()
        const bTime = new Date(b.updated_at || b.created_at || 0).getTime()
        return bTime - aTime
      })
  }, [bugs, solutionCounts, search, priorityFilter])

  if (loading) {
    return <SavedBugsListSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="rounded-none border border-border/40 bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            {unanswered.length.toLocaleString()} unanswered bug{unanswered.length === 1 ? "" : "s"}
          </p>
          <div className="grid w-full gap-2 sm:grid-cols-2 md:w-auto">
            <div className="relative sm:min-w-[250px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Search unanswered bugs"
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((priority) => (
                  <SelectItem key={priority} value={priority} className="capitalize">
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Card className="gap-4 py-4">
        <CardHeader className="px-4 pb-0">
          <CardTitle className="text-base">Queue</CardTitle>
          <CardDescription>
            Bugs in this queue have no solutions yet and are sorted by urgency and recent activity.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 space-y-3">
          {unanswered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No unanswered bugs match your filters.</p>
          ) : (
            unanswered.map((bug) => (
              <button
                key={bug.id}
                type="button"
                onClick={() => router.push(`/bugs/${bug.id}`)}
                className="w-full rounded-none border p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <p className="line-clamp-2 text-sm font-medium">{bug.title || "Untitled bug"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="capitalize">
                    {normalizePriority(bug.priority)}
                  </Badge>
                  <span>•</span>
                  <span className="capitalize">{normalizeStatus(bug.status).replace(/_/g, " ")}</span>
                  <span>•</span>
                  <span>Updated {formatDate(bug.updated_at || bug.created_at)}</span>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
