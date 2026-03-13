"use client"

import * as React from "react"
import Link from "next/link"
import { IconSearch } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

type GraphItem = {
  id: string
  title?: string | null
  description?: string | null
  is_public?: boolean
  updated_at?: string | null
  origin_cluster_id?: string | null
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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState("newest");
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
      <div className="p-6 text-sm text-muted-foreground">
        {emptyMessage}
        {emptyAction && <div className="mt-3">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Search Bar */}
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

      {/* Graph List */}
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
              <Link
                key={g.id}
                href={`/workspaces/${g.id}`}
                className="group flex items-center justify-between gap-3 py-3 px-4 border-b hover:bg-muted/40 transition-colors sm:gap-3"
              >
                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-brand-blue group-hover:underline mb-1.5 line-clamp-2 transition-all">
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
                      Updated {g.updated_at ? new Date(g.updated_at).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
                {/* Right Column - Metadata */}
                <div className="flex flex-col items-end gap-0.5 min-w-[80px] flex-shrink-0 text-xs sm:min-w-[120px]">
                  <div className="mt-auto text-muted-foreground text-right text-xs">
                    {g.updated_at ? new Date(g.updated_at).toLocaleDateString() : "—"}
                  </div>
                </div>
              </Link>
            ))
        )}
      </div>
    </div>
  );
}
