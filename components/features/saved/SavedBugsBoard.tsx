"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SavedBugsListSkeleton } from "@/components/features/skeletons/SavedBugsListSkeleton"

type SavedBug = {
  id: string
  title?: string | null
  status?: string | null
  priority?: string | null
  description?: string | null
  updated_at?: string | null
}

const BOARD_COLUMNS = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
  { key: "reopened", label: "Reopened" },
  { key: "closed", label: "Closed" },
] as const

function normalizeStatus(status?: string | null): (typeof BOARD_COLUMNS)[number]["key"] {
  const value = (status || "open").toLowerCase()
  if (value === "open" || value === "in_progress" || value === "resolved" || value === "closed" || value === "reopened") {
    return value
  }
  return "open"
}

function formatUpdated(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString()
}

export function SavedBugsBoard() {
  const router = useRouter()
  const [bugs, setBugs] = React.useState<SavedBug[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")

  const fetchSavedBugs = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/saved/bugs")
      if (!response.ok) {
        setBugs([])
        return
      }
      const data = await response.json()
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

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return bugs
    return bugs.filter((bug) => {
      const title = (bug.title || "").toLowerCase()
      const description = (bug.description || "").toLowerCase()
      return title.includes(query) || description.includes(query)
    })
  }, [bugs, search])

  const grouped = React.useMemo(() => {
    const byStatus: Record<string, SavedBug[]> = {
      open: [],
      in_progress: [],
      resolved: [],
      reopened: [],
      closed: [],
    }

    for (const bug of filtered) {
      byStatus[normalizeStatus(bug.status)].push(bug)
    }

    Object.keys(byStatus).forEach((status) => {
      byStatus[status] = byStatus[status].slice().sort((a, b) => {
        const aTime = new Date(a.updated_at || 0).getTime()
        const bTime = new Date(b.updated_at || 0).getTime()
        return bTime - aTime
      })
    })

    return byStatus
  }, [filtered])

  if (loading) {
    return <SavedBugsListSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="rounded-none border border-border/40 bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {filtered.length.toLocaleString()} bug{filtered.length === 1 ? "" : "s"} in board
          </p>
          <div className="relative w-full sm:w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search saved bugs"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {BOARD_COLUMNS.map((column) => {
          const items = grouped[column.key] || []

          return (
            <Card key={column.key} className="py-4 gap-4">
              <CardHeader className="px-4 pb-0">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm">{column.label}</CardTitle>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
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
                      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">{(bug.priority || "medium").replace(/_/g, " ")}</span>
                        <span>{formatUpdated(bug.updated_at)}</span>
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
