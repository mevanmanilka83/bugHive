"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { cn } from "@/lib"
import { TagsListSkeleton } from "@/components/features/skeletons/TagsListSkeleton"

interface Tag {
  tag: string
  count: number
}

export function TagsList() {
  const [tags, setTags] = React.useState<Tag[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")

  React.useEffect(() => {
    async function fetchTags() {
      try {
        setLoading(true)
        const res = await fetch("/api/tags")
        if (!res.ok) return
        const data = await res.json()
        setTags(data?.tags || [])
      } catch (error) {
        console.error("Failed to fetch tags:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [])

  const filteredTags = React.useMemo(() => {
    if (!searchQuery.trim()) return tags
    const query = searchQuery.toLowerCase().trim()
    return tags.filter((t) => t.tag.toLowerCase().trim().includes(query))
  }, [tags, searchQuery])

  if (loading) {
    return <TagsListSkeleton />
  }

  if (tags.length === 0) {
    return (
      <div className="rounded-none border border-border/40 bg-card p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-foreground mb-1">No tags found</p>
          <p className="text-xs text-muted-foreground">
            Tags will appear here as bugs are reported.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          type="text"
          placeholder="Search by tag name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
          aria-label="Search tags"
        />
        {searchQuery.trim() ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {/* Tags Grid */}
      <div className="rounded-none border border-border/40 bg-card p-6">
        {filteredTags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-foreground mb-1">No tags match &quot;{searchQuery.trim()}&quot;</p>
            <p className="text-xs text-muted-foreground">
              Try a different search or clear the search box.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {filteredTags.map(({ tag, count }) => {
              const slug = (tag || "").trim() || tag
              return (
                <Link
                  key={tag}
                  href={`/?tag=${encodeURIComponent(slug)}`}
                  className={cn(
                    "inline-flex items-center gap-2 !rounded-none border px-3 py-1.5 text-sm",
                    "transition-colors hover:bg-muted hover:border-primary/50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  )}
                >
                  <span className="font-medium">{tag}</span>
                  <Badge variant="secondary" className="text-xs">
                    {count}
                  </Badge>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="rounded-none border border-border/40 bg-card p-4">
        <p className="text-xs text-muted-foreground">
          Showing {filteredTags.length} of {tags.length} tags
        </p>
      </div>
    </div>
  )
}
