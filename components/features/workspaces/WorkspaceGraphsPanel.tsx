"use client"

import * as React from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggleGroup"
import { WorkspaceGraphList } from "@/components/features/workspaces/WorkspaceGraphList"

type GraphItem = {
  id: string
  title?: string | null
  description?: string | null
  is_public?: boolean
  updated_at?: string | null
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
  const [view, setView] = React.useState<"mine" | "public">("mine")

  const currentGraphs =
    view === "mine"
      ? myGraphs
      : publicGraphs.map((g) => ({
        ...g,
        is_public: true,
      }))

  const count = currentGraphs.length
  const label =
    view === "mine"
      ? count === 1
        ? "saved graph"
        : "saved graphs"
      : count === 1
        ? "public graph"
        : "public graphs"

  return (
    <div className="rounded-none border border-border/40 bg-card p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <p className="text-sm text-muted-foreground min-w-[160px]">
          {count === 0
            ? view === "mine"
              ? "No saved graphs yet"
              : "No public graphs yet"
            : `${count.toLocaleString()} ${label}`}
        </p>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={view}
          onValueChange={(value) => {
            if (value === "mine" || value === "public") {
              setView(value)
            }
          }}
          className="w-full sm:w-auto"
        >
          <ToggleGroupItem
            value="mine"
            className="flex-1 px-3 py-1 text-xs"
          >
            My graphs
          </ToggleGroupItem>
          <ToggleGroupItem
            value="public"
            className="flex-1 px-3 py-1 text-xs"
          >
            Public graphs
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {view === "mine" ? (
        <WorkspaceGraphList
          graphs={myGraphs}
          emptyMessage='No graphs yet. Open a bug, click the relationship graph icon, then "Save relationship diagram" (as private or public).'
          emptyAction={myEmptyAction}
        />
      ) : publicGraphs.length === 0 ? (
        <div className="py-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">No public graphs yet</p>
          <p className="max-w-md">
            When a relationship graph is shared publicly, it will appear here so you
            can open it, explore, and copy it into your own workspace.
          </p>
        </div>
      ) : (
        <WorkspaceGraphList
          graphs={publicGraphs.map((g) => ({ ...g, is_public: true }))}
          emptyMessage=""
        />
      )}
    </div>
  )
}

