"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { cn } from "@/lib"
import { TagsListSkeleton } from "@/components/features/skeletons/TagsListSkeleton"
import AnimatedTags from "@/components/features/tags/AnimatedTags"

interface Tag {
  tag: string
  count: number
}

export function TagsList() {
  const router = useRouter()
  const [tags, setTags] = React.useState<Tag[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const selectedTags = React.useMemo(() => {
    return Array.from(
      new Set(
        searchQuery
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      )
    )
  }, [searchQuery])

  const filterToken = React.useMemo(() => {
    const parts = searchQuery.split(",")
    return (parts[parts.length - 1] || "").trim()
  }, [searchQuery])

  const handleSearchBugs = React.useCallback(() => {
    if (selectedTags.length === 0) return
    if (selectedTags.length === 1) {
      router.push(`/?tag=${encodeURIComponent(selectedTags[0])}`)
      return
    }
    const encoded = selectedTags.map((t) => encodeURIComponent(t)).join(",")
    router.push(`/?tags=${encoded}`)
  }, [router, selectedTags])

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
    if (!filterToken) return tags
    const query = filterToken.toLowerCase().trim()
    return tags.filter((t) => t.tag.toLowerCase().trim().includes(query))
  }, [tags, filterToken])

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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSearchBugs()
            }
          }}
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
          <>
            <AnimatedTags
              initialTags={filteredTags.map((t) => t.tag)}
              showSelected={false}
              counts={Object.fromEntries(tags.map((t) => [t.tag, t.count]))}
              onAddTag={(tag) => {
                setSearchQuery((prev) => {
                  const existing = prev
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)

                  if (existing.includes(tag)) return prev

                  const next = [...existing, tag]
                  // Keep a trailing comma + space so the last token is empty,
                  // which shows all tags again and lets the user type a new filter.
                  return `${next.join(", ")}, `
                })
              }}
            />
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                size="sm"
                className="rounded-none px-4"
                disabled={selectedTags.length === 0}
                onClick={handleSearchBugs}
              >
                Search bugs
              </Button>
            </div>
          </>
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
