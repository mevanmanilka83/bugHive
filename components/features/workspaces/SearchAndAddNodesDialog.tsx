"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Loader2, Bug, Users, Search } from "lucide-react"
import { cn } from "@/lib"

type BugResult = { id: string; title: string; description?: string | null }
type ClusterResult = { id: string; name: string; description?: string | null }

interface SearchAndAddNodesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddBug: (bug: BugResult) => void
  onAddCluster: (cluster: ClusterResult) => void
  existingNodeIds: Set<string>
}

export function SearchAndAddNodesDialog({
  open,
  onOpenChange,
  onAddBug,
  onAddCluster,
  existingNodeIds,
}: SearchAndAddNodesDialogProps) {
  const [query, setQuery] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [bugs, setBugs] = React.useState<BugResult[]>([])
  const [clusters, setClusters] = React.useState<ClusterResult[]>([])
  const [searchType, setSearchType] = React.useState<"all" | "bugs" | "clusters">("all")
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = React.useCallback(async (q: string) => {
    if (q.length < 2) {
      setBugs([])
      setClusters([])
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({ q, type: searchType })
      const res = await fetch(`/api/search?${params}`)
      if (!res.ok) throw new Error("Search failed")
      const data = await res.json()
      setBugs(data.bugs ?? [])
      setClusters(data.clusters ?? [])
    } catch {
      setBugs([])
      setClusters([])
    } finally {
      setLoading(false)
    }
  }, [searchType])

  React.useEffect(() => {
    if (!open) return
    setQuery("")
    setBugs([])
    setClusters([])
    setShowSuggestions(false)
  }, [open])

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) {
      setBugs([])
      setClusters([])
      return
    }
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  const handleAddBug = (bug: BugResult) => {
    if (existingNodeIds.has(bug.id)) return
    onAddBug(bug)
    onOpenChange(false)
  }

  const handleAddCluster = (cluster: ClusterResult) => {
    const nodeId = `cluster-${cluster.id}`
    if (existingNodeIds.has(nodeId)) return
    onAddCluster(cluster)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="size-5" />
            Add Bugs & Clusters
          </DialogTitle>
          <DialogDescription>
            Search and import existing bugs or clusters into your graph to build multi-bug relationship maps
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Search by title or name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 120)
              }}
              className="w-full"
              autoFocus
            />
            {showSuggestions && (
              <div className="absolute z-20 mt-1 w-full rounded-none border border-border bg-card shadow-sm max-h-48 overflow-y-auto">
                {query.length < 2 ? (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    Type at least 2 characters to search
                  </p>
                ) : loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {(searchType === "all" || searchType === "bugs") && bugs.length > 0 && (
                      <div className="p-2">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <Bug className="size-3.5" /> Bugs
                        </h3>
                        <ul className="space-y-0.5">
                          {bugs.map((bug) => {
                            const exists = existingNodeIds.has(bug.id)
                            return (
                              <li key={bug.id}>
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    if (!exists) handleAddBug(bug)
                                  }}
                                  disabled={exists}
                                  className={cn(
                                    "w-full text-left px-3 py-2 rounded-none border transition-colors",
                                    exists
                                      ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                                      : "hover:bg-rose-500/10 hover:border-rose-500/50"
                                  )}
                                >
                                  <div className="font-medium text-sm truncate">{bug.title}</div>
                                  {bug.description && (
                                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                                      {bug.description.slice(0, 80)}...
                                    </div>
                                  )}
                                  {exists && (
                                    <span className="text-[10px] text-muted-foreground">Already in graph</span>
                                  )}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    {(searchType === "all" || searchType === "clusters") && clusters.length > 0 && (
                      <div className="p-2">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <Users className="size-3.5" /> Clusters
                        </h3>
                        <ul className="space-y-0.5">
                          {clusters.map((cluster) => {
                            const nodeId = `cluster-${cluster.id}`
                            const exists = existingNodeIds.has(nodeId)
                            return (
                              <li key={cluster.id}>
                                <button
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    if (!exists) handleAddCluster(cluster)
                                  }}
                                  disabled={exists}
                                  className={cn(
                                    "w-full text-left px-3 py-2 rounded-none border transition-colors",
                                    exists
                                      ? "bg-muted/50 text-muted-foreground cursor-not-allowed"
                                      : "hover:bg-purple-500/10 hover:border-purple-500/50"
                                  )}
                                >
                                  <div className="font-medium text-sm truncate">{cluster.name}</div>
                                  {cluster.description && (
                                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                                      {cluster.description.slice(0, 80)}...
                                    </div>
                                  )}
                                  {exists && (
                                    <span className="text-[10px] text-muted-foreground">Already in graph</span>
                                  )}
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    {query.length >= 2 && !loading && bugs.length === 0 && clusters.length === 0 && (
                      <p className="px-3 py-4 text-sm text-muted-foreground text-center">
                        No bugs or clusters found
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as "all" | "bugs" | "clusters")}
            className="rounded-none border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="bugs">Bugs</option>
            <option value="clusters">Clusters</option>
          </select>
        </div>
      </DialogContent>
    </Dialog>
  )
}
