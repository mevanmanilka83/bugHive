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
          <IconSearch className="absolute left-4 top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search graphs by title or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-full pl-11 pr-4 text-sm bg-background border border-border/60 placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all shadow-sm"
          />
        </div>
        {/* Tabs group */}
        <div className="mt-3 inline-flex items-center gap-1 rounded-full border bg-background px-1 py-1 text-xs">
          <button
            className={`px-3 py-1.5 rounded-full transition-colors ${sortBy === "newest" ? "bg-foreground text-background font-semibold" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setSortBy("newest")}
          >
            Newest
          </button>
          <button
            className={`px-3 py-1.5 rounded-full transition-colors ${sortBy === "oldest" ? "bg-foreground text-background font-semibold" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setSortBy("oldest")}
          >
            Oldest
          </button>
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
