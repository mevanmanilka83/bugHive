"use client"

import * as React from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggleGroup"
import { WorkspaceGraphList } from "@/components/features/workspaces/WorkspaceGraphList"

type VisibilityFilter = "private" | "public" | "cluster-private" | "cluster-public"

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
  /** Action button shown when there are no saved graphs yet (e.g. 'Browse bugs') */
  myEmptyAction: React.ReactNode
}

export function WorkspaceGraphsPanel({
  myGraphs,
  publicGraphs,
  myEmptyAction,
}: WorkspaceGraphsPanelProps) {
  const [visibilityFilter, setVisibilityFilter] = React.useState<VisibilityFilter>("private")

  const filteredMyGraphs = React.useMemo(() => {
    const kindFor = (g: GraphItem): VisibilityFilter => {
      if (g.origin_cluster_id) {
        return g.is_public ? "cluster-public" : "cluster-private"
      }
      return g.is_public ? "public" : "private"
    }
    return myGraphs
      .map((g) => ({
        ...g,
        is_public: Boolean(g.is_public),
      }))
      .filter((g) => kindFor(g) === visibilityFilter)
  }, [myGraphs, visibilityFilter])

  const count = filteredMyGraphs.length

  const visibilityLabelMap: Record<VisibilityFilter, string> = {
    private: "private",
    public: "public",
    "cluster-private": "cluster private",
    "cluster-public": "cluster public",
  }

  return (
    <div className="rounded-none border border-border/40 bg-card p-6">
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground min-w-[160px]">
            {count === 0
              ? "No saved workspaces yet"
              : `${count.toLocaleString()} ${visibilityLabelMap[visibilityFilter]} workspace${count !== 1 ? "s" : ""}`}
          </p>
        </div>

        {(
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              View
            </span>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={visibilityFilter}
              onValueChange={(value) => {
                if (value === "public" || value === "private") {
                  setVisibilityFilter(value)
                }
              }}
              className="flex"
            >
              <ToggleGroupItem
                value="private"
                className="px-3 py-1 text-xs"
              >
                Private
              </ToggleGroupItem>
              <ToggleGroupItem
                value="public"
                className="px-3 py-1 text-xs"
              >
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
              value={visibilityFilter}
              onValueChange={(value) => {
                if (value === "cluster-public" || value === "cluster-private") {
                  setVisibilityFilter(value)
                }
              }}
              className="flex"
            >
              <ToggleGroupItem
                value="cluster-private"
                className="px-3 py-1 text-xs"
              >
                Private
              </ToggleGroupItem>
              <ToggleGroupItem
                value="cluster-public"
                className="px-3 py-1 text-xs"
              >
                Public
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}
      </div>

      <WorkspaceGraphList
        graphs={filteredMyGraphs}
        emptyMessage='No graphs yet. Open a bug, click the relationship graph icon, then "Save relationship diagram" (as private or public).'
        emptyAction={myEmptyAction}
      />
    </div>
  )
}

