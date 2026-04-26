"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Crosshair } from "lucide-react"
import { cn } from "@/lib"

export type PotentialDuplicateItem = {
  id: string
  title: string
  url: string
  snippet: string
  relevanceScore: number
  relevanceReasons: string[]
}

const DEBOUNCE_MS = 450
const MIN_TEXT_LENGTH = 4

type Props = {
  title: string
  description: string
  tags?: string[]
  className?: string
}

function toDashboardBugUrl(url: string) {
  if (typeof url !== "string") return "/dashboard/bugs"
  return url.startsWith("/bugs/") ? url.replace("/bugs/", "/dashboard/bugs/") : url
}

function toPublicBugUrl(url: string) {
  if (typeof url !== "string") return "/bugs"
  return url.startsWith("/dashboard/bugs/")
    ? url.replace("/dashboard/bugs/", "/bugs/")
    : url
}

export function DuplicateRadar({ title, description, tags = [], className }: Props) {
  const pathname = usePathname()
  const [duplicates, setDuplicates] = React.useState<PotentialDuplicateItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const abortRef = React.useRef<AbortController | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const plainDescription =
    typeof description === "string"
      ? description.replace(/<[^>]*>/g, "").trim()
      : ""

  const hasEnoughText =
    title.trim().length >= MIN_TEXT_LENGTH ||
    plainDescription.length >= MIN_TEXT_LENGTH

  React.useEffect(() => {
    if (!hasEnoughText) {
      setDuplicates([])
      return
    }

    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      fetch("/api/bugs/potential-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: plainDescription,
          tags: Array.isArray(tags) ? tags : [],
        }),
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) return { duplicates: [] }
          return res.json()
        })
        .then((data) => {
          const list = Array.isArray(data?.duplicates) ? data.duplicates : []
          setDuplicates(list)
        })
        .catch(() => setDuplicates([]))
        .finally(() => {
          setLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [title, plainDescription, hasEnoughText, tags])

  if (!hasEnoughText) return null

  return (
    <div
      className={cn(
        "flex min-w-0 flex-col rounded-lg border border-[#dbc9a6] bg-[#f7f2e9]",
        className
      )}
      aria-label="Potential duplicates"
    >
      <div className="flex items-center gap-2 border-b border-[#dbc9a6] px-3 py-2">
        <span
          className="flex size-8 items-center justify-center rounded-full bg-[#ecd8af] text-[#5c4f3e]"
          aria-hidden
        >
          <Crosshair className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#243148]">
            Duplicate radar
          </p>
        </div>
      </div>

      <div className="max-h-[280px] min-h-0 overflow-y-auto p-2">
        {loading && duplicates.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            Scanning…
          </div>
        ) : duplicates.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No similar reports found yet. Keep typing to check.
          </p>
        ) : (
          <ul className="space-y-2">
            {duplicates.map((item) => {
              const pct = Math.round(item.relevanceScore * 100)
              const duplicateUrl = pathname?.startsWith("/dashboard")
                ? toDashboardBugUrl(item.url)
                : toPublicBugUrl(item.url)
              return (
                <li
                  key={item.id}
                  className="rounded-md border border-[#dbc9a6] bg-[#faf7f1] p-2"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[10px] font-semibold text-[#445676]">
                      {pct}% match
                    </span>
                    <Link
                      href={duplicateUrl}
                      className="text-xs font-medium text-primary underline-offset-2 hover:underline truncate max-w-[70%]"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.title || "Untitled"}
                    </Link>
                  </div>
                  {item.snippet && (
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                      {item.snippet}
                    </p>
                  )}
                  {Array.isArray(item.relevanceReasons) && item.relevanceReasons.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 text-[10px] text-muted-foreground">
                      {item.relevanceReasons.slice(0, 4).map((reason, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="shrink-0 text-[#7a879b]">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
