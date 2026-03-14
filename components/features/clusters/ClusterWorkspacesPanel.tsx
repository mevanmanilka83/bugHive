"use client"

import * as React from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggleGroup"
import { WorkspaceGraphList } from "@/components/features/workspaces/WorkspaceGraphList"

type VisibilityFilter = "cluster-private" | "cluster-public"

type GraphItem = {
  id: string
  title?: string | null
  description?: string | null
  is_public?: boolean
  updated_at?: string | null
  origin_cluster_id?: string | null
}

interface ClusterWorkspacesPanelProps {
  clusterId: string
}

export function ClusterWorkspacesPanel({ clusterId }: ClusterWorkspacesPanelProps) {
  const [graphs, setGraphs] = React.useState<GraphItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [visibilityFilter, setVisibilityFilter] = React.useState<VisibilityFilter>("cluster-private")

  React.useEffect(() => {
    let cancelled = false
    const fetchWorkspaces = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/workspaces?clusterId=${encodeURIComponent(clusterId)}`)
        if (!res.ok) {
          setGraphs([])
          return
        }
        const data = await res.json().catch(() => ({}))
        if (!cancelled) {
          setGraphs(Array.isArray(data?.graphs) ? data.graphs : [])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchWorkspaces()
    return () => {
      cancelled = true
    }
  }, [clusterId])

  const filteredGraphs = React.useMemo(() => {
    return graphs
      .filter((g) => g.origin_cluster_id === clusterId)
      .filter((g) => {
        const isClusterPublic = Boolean(g.is_public)
        return visibilityFilter === "cluster-public" ? isClusterPublic : !isClusterPublic
      })
  }, [graphs, clusterId, visibilityFilter])

  const count = filteredGraphs.length

  return (
    <div className="mb-4 rounded-lg border bg-background/80 p-4">
      <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Relationship workspaces for this cluster</h2>
          <p className="text-xs text-muted-foreground">
            Graph workspaces saved from bugs in this cluster, filtered by cluster visibility.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="text-[11px] font-semibold uppercase tracking-wide">
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
      </div>

      {loading ? (
        <div className="py-4 text-xs text-muted-foreground">
          Loading workspaces…
        </div>
      ) : count === 0 ? (
        <div className="py-4 text-xs text-muted-foreground">
          No {visibilityFilter === "cluster-public" ? "public" : "private"} workspaces for this cluster yet.
        </div>
      ) : (
        <WorkspaceGraphList
          graphs={filteredGraphs}
          emptyMessage=""
        />
      )}
    </div>
  )
}

