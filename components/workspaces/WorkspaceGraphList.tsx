"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

type GraphItem = {
  id: string
  title?: string | null
  description?: string | null
  is_public?: boolean
  updated_at?: string | null
}

export function WorkspaceGraphList({
  graphs,
  emptyMessage,
  emptyAction,
}: {
  graphs: GraphItem[]
  emptyMessage: string
  emptyAction?: React.ReactNode
}) {
  if (graphs.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {emptyMessage}
        {emptyAction && <div className="mt-3">{emptyAction}</div>}
      </div>
    )
  }

  return (
    <div className="w-full p-2 sm:p-3 space-y-3">
      {graphs.map((g) => (
        <Link
          key={g.id}
          href={`/workspaces/${g.id}`}
          className="group flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background px-3 py-3 hover:border-primary/50 hover:bg-muted/40 shadow-sm transition-colors"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-blue-600 group-hover:text-blue-800 mb-1.5 line-clamp-2">
              {g.title || "Untitled graph"}
            </h3>
            {g.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {g.description}
              </p>
            )}
            <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <Badge
                variant={g.is_public ? "default" : "secondary"}
                className="text-[11px] px-2 py-0.5"
              >
                {g.is_public ? "Public" : "Private"}
              </Badge>
              <span className="text-muted-foreground/60">•</span>
              <span>
                Updated{" "}
                {g.updated_at ? new Date(g.updated_at).toLocaleDateString() : "—"}
              </span>
            </div>
          </div>
          <div className="hidden sm:flex shrink-0 items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Open workspace</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
