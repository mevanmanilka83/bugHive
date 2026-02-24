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
  const count = graphs.length

  if (count === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {emptyMessage}
        {emptyAction && <div className="mt-3">{emptyAction}</div>}
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Count + tabs — same pattern as Saved/BugDetailedList */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center border-b px-2 py-3 sm:px-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <p className="shrink-0 text-sm text-muted-foreground">
            {count.toLocaleString()} {count === 1 ? "graph" : "graphs"}
          </p>
          <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
            <div className="inline-flex flex-nowrap items-center gap-1 rounded-md border bg-background px-1 py-1 min-w-0">
              <span className="px-3 py-1.5 text-sm font-semibold rounded-md bg-muted">
                Newest
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* List — same row style as BugDetailedList */}
      <div className="space-y-0">
        {graphs.map((g) => (
          <Link
            key={g.id}
            href={`/workspaces/${g.id}`}
            className="flex gap-2 py-2 px-2 border-b hover:bg-muted/50 transition-colors sm:gap-3 sm:py-3 sm:px-3"
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-blue-600 hover:text-blue-800 mb-1.5 line-clamp-2">
                {g.title || "Untitled graph"}
              </h3>
              {g.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {g.description}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Badge
                  variant={g.is_public ? "default" : "secondary"}
                  className="text-xs"
                >
                  {g.is_public ? "Public" : "Private"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Updated {g.updated_at ? new Date(g.updated_at).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
