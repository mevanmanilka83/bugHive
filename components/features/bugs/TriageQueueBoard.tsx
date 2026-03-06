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

type GroupKey = "needs_attention" | "in_progress" | "done"

const GROUP_META: Record<GroupKey, { title: string; description: string }> = {
  needs_attention: {
    title: "Needs attention",
    description: "Open and reopened bugs to prioritize.",
  },
  in_progress: {
    title: "In progress",
    description: "Bugs currently being handled.",
  },
  done: {
    title: "Done",
    description: "Resolved and closed bugs.",
  },
}

const STATUS_OPTIONS = ["all", "open", "in_progress", "resolved", "reopened", "closed"]
const PRIORITY_OPTIONS = ["all", "low", "medium", "high", "critical"]

function normalizeStatus(status?: string | null) {
  const value = (status || "open").toLowerCase()
  if (["open", "in_progress", "resolved", "reopened", "closed"].includes(value)) {
    return value
  }
  return "open"
}

function normalizePriority(priority?: string | null) {
  const value = (priority || "medium").toLowerCase()
  if (["low", "medium", "high", "critical"].includes(value)) {
    return value
  }
  return "medium"
}

function getGroupKey(status?: string | null): GroupKey {
  const normalized = normalizeStatus(status)
  if (normalized === "in_progress") return "in_progress"
  if (normalized === "resolved" || normalized === "closed") return "done"
  return "needs_attention"
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString()
}

export function TriageQueueBoard() {
  const router = useRouter()
  const [bugs, setBugs] = React.useState<BugItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [priorityFilter, setPriorityFilter] = React.useState("all")

  const fetchBugs = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/bugs?limit=500")
      if (!response.ok) {
        setBugs([])
        return
      }
      const data = await response.json()
      const items: BugItem[] = Array.isArray(data?.bugs) ? data.bugs : []
      setBugs(items)
    } catch {
      setBugs([])
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

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase()

    return bugs
      .filter((bug) => {
        if (statusFilter !== "all" && normalizeStatus(bug.status) !== statusFilter) {
          return false
        }
        if (priorityFilter !== "all" && normalizePriority(bug.priority) !== priorityFilter) {
          return false
        }
        if (!query) return true
        const title = (bug.title || "").toLowerCase()
        const description = (bug.description || "").toLowerCase()
        return title.includes(query) || description.includes(query)
      })
      .sort((a, b) => {
        const aTime = new Date(a.updated_at || a.created_at || 0).getTime()
        const bTime = new Date(b.updated_at || b.created_at || 0).getTime()
        return bTime - aTime
      })
  }, [bugs, search, statusFilter, priorityFilter])

  const grouped = React.useMemo(() => {
    const map: Record<GroupKey, BugItem[]> = {
      needs_attention: [],
      in_progress: [],
      done: [],
    }
    for (const bug of filtered) {
      map[getGroupKey(bug.status)].push(bug)
    }
    return map
  }, [filtered])

  if (loading) {
    return <SavedBugsListSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="rounded-none border border-border/40 bg-card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            {filtered.length.toLocaleString()} bug{filtered.length === 1 ? "" : "s"} in triage queue
          </p>
          <div className="grid w-full gap-2 sm:grid-cols-3 md:w-auto">
            <div className="relative sm:min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Search bugs"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status} className="capitalize">
                    {status.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      <div className="grid gap-4 lg:grid-cols-3">
        {(Object.keys(GROUP_META) as GroupKey[]).map((groupKey) => {
          const group = GROUP_META[groupKey]
          const items = grouped[groupKey]

          return (
            <Card key={groupKey} className="gap-4 py-4">
              <CardHeader className="px-4 pb-0">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm">{group.title}</CardTitle>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent className="px-4 space-y-3">
                {items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No bugs</p>
                ) : (
                  items.map((bug) => (
                    <button
                      key={bug.id}
                      type="button"
                      onClick={() => router.push(`/bugs/${bug.id}`)}
                      className="w-full rounded-none border p-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <p className="line-clamp-2 text-sm font-medium">{bug.title || "Untitled bug"}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{normalizeStatus(bug.status).replace(/_/g, " ")}</span>
                        <span>•</span>
                        <span className="capitalize">{normalizePriority(bug.priority)}</span>
                        <span>•</span>
                        <span>Updated {formatDate(bug.updated_at || bug.created_at)}</span>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
