"use client"

import * as React from "react"
import Link from "next/link"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggleGroup"
import { WorkspaceGraphList } from "@/components/features/workspaces/WorkspaceGraphList"
import { CopyGraphButton } from "@/components/features/workspaces/CopyGraphButton"
import { Badge } from "@/components/ui/badge"

type VisibilityFilter =
  | "all"
  | "private"
  | "public"
  | "cluster-private"
  | "cluster-public"

type GraphItem = {
  id: string
  title?: string | null
  description?: string | null
  is_public?: boolean
  updated_at?: string | null
  origin_cluster_id?: string | null
}

interface WorkspaceGraphsPanelProps {
  myGraphs: GraphItem[]
  publicGraphs: GraphItem[]
  myEmptyAction: React.ReactNode
  detailBasePath?: string
}

const WORKSPACE_VISIBILITY_BADGE_CLASS =
  "text-[11px] px-2 py-0.5 bg-[#ddd0b2] text-[#5b4a2d] hover:bg-[#ddd0b2] border border-[#d4c39d]"

export function WorkspaceGraphsPanel({
  myGraphs,
  publicGraphs,
  myEmptyAction,
  detailBasePath = "/workspaces",
}: WorkspaceGraphsPanelProps) {
  const [myGraphItems, setMyGraphItems] = React.useState<GraphItem[]>(myGraphs)
  const [visibilityFilter, setVisibilityFilter] = React.useState<VisibilityFilter>("all")

  React.useEffect(() => {
    setMyGraphItems(myGraphs)
  }, [myGraphs])

  const filteredMyGraphs = React.useMemo(() => {
    const kindFor = (g: GraphItem): Exclude<VisibilityFilter, "all"> => {
      if (g.origin_cluster_id) {
        return g.is_public ? "cluster-public" : "cluster-private"
      }
      return g.is_public ? "public" : "private"
    }
    return myGraphItems
      .map((g) => ({
        ...g,
        is_public: Boolean(g.is_public),
      }))
      .filter(
        (g) =>
          visibilityFilter === "all" || kindFor(g) === visibilityFilter
      )
  }, [myGraphItems, visibilityFilter])

  const count = filteredMyGraphs.length

  const visibilityLabelMap: Record<VisibilityFilter, string> = {
    all: "saved",
    private: "private",
    public: "public",
    "cluster-private": "cluster private",
    "cluster-public": "cluster public",
  }

  const viewToggleValue =
    visibilityFilter === "all" ||
    visibilityFilter === "private" ||
    visibilityFilter === "public"
      ? visibilityFilter
      : undefined

  const clusterToggleValue =
    visibilityFilter === "cluster-private" ||
    visibilityFilter === "cluster-public"
      ? visibilityFilter
      : undefined

  return (
    <div className="rounded-none border border-border/40 bg-card p-6">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground min-w-[160px]">
            {count === 0
              ? "No saved workspaces yet"
              : visibilityFilter === "all"
                ? `${count.toLocaleString()} saved workspace${count !== 1 ? "s" : ""}`
                : `${count.toLocaleString()} ${visibilityLabelMap[visibilityFilter]} workspace${count !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wide">
            View
          </span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={viewToggleValue}
            onValueChange={(value) => {
              if (value === "all" || value === "public" || value === "private") {
                setVisibilityFilter(value)
              }
            }}
            className="flex"
          >
            <ToggleGroupItem value="all" className="px-3 py-1 text-xs">
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="private" className="px-3 py-1 text-xs">
              Private
            </ToggleGroupItem>
            <ToggleGroupItem value="public" className="px-3 py-1 text-xs">
              Public
            </ToggleGroupItem>
          </ToggleGroup>

          <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide">
            Cluster
          </span>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={clusterToggleValue}
            onValueChange={(value) => {
              if (value === "cluster-public" || value === "cluster-private") {
                setVisibilityFilter(value)
              }
            }}
            className="flex"
          >
            <ToggleGroupItem value="cluster-private" className="px-3 py-1 text-xs">
              Private
            </ToggleGroupItem>
            <ToggleGroupItem value="cluster-public" className="px-3 py-1 text-xs">
              Public
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <WorkspaceGraphList
        graphs={filteredMyGraphs}
        emptyMessage='No graphs yet. Open a bug, click the relationship graph icon, then "Save relationship diagram" (as private or public).'
        emptyAction={myEmptyAction}
        detailBasePath={detailBasePath}
        onGraphRenamed={(id, title) => {
          setMyGraphItems((prev) =>
            prev.map((g) => (g.id === id ? { ...g, title, updated_at: new Date().toISOString() } : g))
          )
        }}
        onGraphDeleted={(id) => {
          setMyGraphItems((prev) => prev.filter((g) => g.id !== id))
        }}
      />

      <div className="mt-8">
        <div className="mb-3">
          <h2 className="text-base font-semibold">Discover public workspaces</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Public graphs from other users — open to explore or save a copy to your own list.
          </p>
        </div>
        {publicGraphs.length > 0 ? (
          <div className="rounded-none border border-border/40 bg-card divide-y divide-border/40">
            {publicGraphs.map((g) => (
              <div
                key={g.id}
                className="group flex items-center justify-between gap-3 py-3 px-4 hover:bg-muted/40 transition-colors sm:gap-3"
              >
                <Link
                  href={`${detailBasePath}/${g.id}`}
                  className="flex-1 min-w-0"
                >
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
                      Public
                    </Badge>
                    <span className="text-muted-foreground/60">•</span>
                    <span>
                      Updated {g.updated_at ? new Date(g.updated_at).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </Link>
                <div className="flex flex-col items-end gap-2 min-w-[80px] flex-shrink-0 sm:min-w-[120px]">
                  <div className="text-muted-foreground text-right text-xs">
                    {g.updated_at ? new Date(g.updated_at).toLocaleDateString() : "—"}
                  </div>
                  <CopyGraphButton workspaceId={g.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-none border border-border/40 bg-card px-4 py-6 text-sm text-muted-foreground">
            No public workspaces to discover yet.
          </div>
        )}
      </div>
    </div>
  )
}

