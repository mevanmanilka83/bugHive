"use client"

import * as React from "react"
import { IconLayoutGrid, IconList, IconLayoutRows, IconCheck } from "@tabler/icons-react"
import {
  getClusterViewMode,
  setClusterViewMode,
  type ClusterViewMode,
  cn,
} from "@/lib"

const VIEW_MODE_LABELS: Record<ClusterViewMode, string> = {
  grid: "Grid",
  list: "List",
  compact: "Compact",
}

export function ClusterViewPicker() {
  const [clusterViewMode, setStateViewMode] = React.useState<ClusterViewMode>("list")

  React.useEffect(() => {
    setStateViewMode(getClusterViewMode())
  }, [])

  React.useEffect(() => {
    const onSync = () => setStateViewMode(getClusterViewMode())
    window.addEventListener("settings:clusterViewMode", onSync)
    return () => window.removeEventListener("settings:clusterViewMode", onSync)
  }, [])

  const handleSelect = (mode: ClusterViewMode) => {
    setStateViewMode(mode)
    setClusterViewMode(mode)
  }

  return (
    <ul className="space-y-2 max-w-md">
      {(["grid", "list", "compact"] as const).map((mode) => (
        <li key={mode}>
          <button
            type="button"
            onClick={() => handleSelect(mode)}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-md px-4 py-3.5 text-left text-sm transition-colors border",
              "hover:bg-muted/70 hover:border-muted-foreground/20",
              clusterViewMode === mode 
                ? "bg-muted/50 font-medium border-muted-foreground/30" 
                : "border-border/60"
            )}
          >
            <span className="flex items-center gap-2.5">
              {mode === "grid" && <IconLayoutGrid className="size-4 text-muted-foreground" />}
              {mode === "list" && <IconList className="size-4 text-muted-foreground" />}
              {mode === "compact" && <IconLayoutRows className="size-4 text-muted-foreground" />}
              {VIEW_MODE_LABELS[mode]}
            </span>
            {clusterViewMode === mode && (
              <IconCheck className="size-4 text-primary shrink-0" />
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}
