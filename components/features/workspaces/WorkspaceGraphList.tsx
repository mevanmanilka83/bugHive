"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconSearch } from "@tabler/icons-react"
import { Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog"

type GraphItem = {
  id: string
  title?: string | null
  description?: string | null
  is_public?: boolean
  updated_at?: string | null
  origin_cluster_id?: string | null
}

const WORKSPACE_VISIBILITY_BADGE_CLASS =
  "text-[11px] px-2 py-0.5 bg-[#ddd0b2] text-[#5b4a2d] hover:bg-[#ddd0b2] border border-[#d4c39d]"

export function WorkspaceGraphList({
  graphs,
  emptyMessage,
  emptyAction,
  detailBasePath = "/workspaces",
  onGraphRenamed,
  onGraphDeleted,
}: {
  graphs: GraphItem[]
  emptyMessage: string
  emptyAction?: React.ReactNode
  detailBasePath?: string
  onGraphRenamed?: (id: string, title: string) => void
  onGraphDeleted?: (id: string) => void
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortBy, setSortBy] = React.useState("newest")
  const [renameOpen, setRenameOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [pendingGraph, setPendingGraph] = React.useState<GraphItem | null>(null)
  const [renameTitle, setRenameTitle] = React.useState("")
  const [actionLoading, setActionLoading] = React.useState(false)

  const openRenameDialog = React.useCallback((graph: GraphItem) => {
    setPendingGraph(graph)
    setRenameTitle(graph.title || "Untitled graph")
    setRenameOpen(true)
  }, [])

  const openDeleteDialog = React.useCallback((graph: GraphItem) => {
    setPendingGraph(graph)
    setDeleteOpen(true)
  }, [])

  const handleRename = React.useCallback(async () => {
    if (!pendingGraph?.id) return
    const nextTitle = renameTitle.trim()
    if (!nextTitle) {
      toast.error("Title is required")
      return
    }
    if (nextTitle === (pendingGraph.title || "Untitled graph")) {
      setRenameOpen(false)
      return
    }
    try {
      setActionLoading(true)
      const res = await fetch(`/api/workspaces/${pendingGraph.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to rename workspace")
      onGraphRenamed?.(pendingGraph.id, nextTitle)
      setRenameOpen(false)
      toast.success("Workspace renamed")
      router.refresh()
    } catch (e: any) {
      toast.error(e?.message || "Failed to rename workspace")
    } finally {
      setActionLoading(false)
    }
  }, [onGraphRenamed, pendingGraph, renameTitle, router])

  const handleDelete = React.useCallback(async () => {
    if (!pendingGraph?.id) return
    try {
      setActionLoading(true)
      const res = await fetch(`/api/workspaces/${pendingGraph.id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to delete workspace")
      onGraphDeleted?.(pendingGraph.id)
      setDeleteOpen(false)
      toast.success("Workspace deleted")
      router.refresh()
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete workspace")
    } finally {
      setActionLoading(false)
    }
  }, [onGraphDeleted, pendingGraph, router])
  const filteredGraphs = React.useMemo(() => {
    if (!searchQuery.trim()) return graphs;
    const query = searchQuery.toLowerCase();
    return graphs.filter(g =>
      (g.title || "").toLowerCase().includes(query) ||
      (g.description || "").toLowerCase().includes(query)
    );
  }, [searchQuery, graphs]);

  const searchSuggestions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    const titles = new Set<string>()
    graphs.forEach((g) => {
      const t = (g.title || "").toString().trim()
      if (t && t.toLowerCase().includes(q)) {
        titles.add(t)
      }
    })
    return Array.from(titles).slice(0, 6)
  }, [searchQuery, graphs])

  if (graphs.length === 0) {
    return (
      <div className="p-8 text-sm text-muted-foreground flex flex-col items-center justify-center text-center">
        <p>{emptyMessage}</p>
        {emptyAction && (
          <div className="mt-4">
            {emptyAction}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="px-4 pt-3 pb-2 border-b">
        <div className="relative w-full">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search graphs by title or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-10 w-full pl-10"
          />
          {searchSuggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-none border border-border bg-card shadow-sm max-h-48 overflow-y-auto">
              {searchSuggestions.map((title) => (
                <button
                  key={title}
                  type="button"
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setSearchQuery(title)
                  }}
                >
                  {title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-0">
        {filteredGraphs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No graphs found
          </div>
        ) : (
          filteredGraphs
            .slice()
            .sort((a, b) => {
              if (sortBy === "newest") {
                return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
              } else {
                return new Date(a.updated_at || 0).getTime() - new Date(b.updated_at || 0).getTime();
              }
            })
            .map((g) => (
              <div
                key={g.id}
                className="group flex items-center justify-between gap-3 py-3 px-4 border-b hover:bg-muted/40 transition-colors sm:gap-3"
              >
                <Link href={`${detailBasePath}/${g.id}`} className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-brand-blue group-hover:underline mb-1.5 line-clamp-2 transition-all">
                    {g.title || "Untitled graph"}
                  </h3>
                  {g.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {g.description}
                    </p>
                  )}
                  <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                    <Badge className={WORKSPACE_VISIBILITY_BADGE_CLASS}>
                      {g.is_public ? "Public" : "Private"}
                    </Badge>
                    <span className="text-muted-foreground/60">•</span>
                    <span>
                      Updated {g.updated_at ? new Date(g.updated_at).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </Link>
                <div className="flex flex-col items-end gap-0.5 min-w-[80px] flex-shrink-0 text-xs sm:min-w-[120px]">
                  <div className="mb-2 flex items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
                      aria-label="Rename workspace"
                      title="Rename workspace"
                      onClick={() => openRenameDialog(g)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-background text-muted-foreground hover:text-red-600 hover:bg-red-50"
                      aria-label="Delete workspace"
                      title="Delete workspace"
                      onClick={() => openDeleteDialog(g)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-auto text-muted-foreground text-right text-xs">
                    {g.updated_at ? new Date(g.updated_at).toLocaleDateString() : "—"}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
      <Dialog
        open={renameOpen}
        onOpenChange={(open) => {
          if (!actionLoading) setRenameOpen(open)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename workspace</DialogTitle>
            <DialogDescription>
              Update the diagram name shown in your workspace list.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            placeholder="Workspace title"
            disabled={actionLoading}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setRenameOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={actionLoading}>
              {actionLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!actionLoading) setDeleteOpen(open)
        }}
        onConfirm={handleDelete}
        title="Delete workspace?"
        description="This permanently deletes the diagram and cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={actionLoading}
      />
    </div>
  );
}
