"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/RichTextEditor"
import type { BugDialogErrors } from "@/lib/schemas/types"

type Props = {
  title: string
  description: string
  errors: BugDialogErrors
  onChangeTitle: (value: string) => void
  onChangeDescription: (value: string) => void
  canNext: boolean
  onNext: () => void
  onCancel: () => void
}

export function BugReportStep1Basic({
  title,
  description,
  errors,
  onChangeTitle,
  onChangeDescription,
  canNext,
  onNext,
  onCancel,
}: Props) {
  const [allTitles, setAllTitles] = React.useState<string[]>([])
  const [showTitleSuggestions, setShowTitleSuggestions] = React.useState(false)
  const [isLoadingTitles, setIsLoadingTitles] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    async function loadTitles() {
      try {
        setIsLoadingTitles(true)
        const res = await fetch("/api/bugs?limit=200")
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        const bugs: any[] = Array.isArray(data?.bugs) ? data.bugs : []
        const titles = Array.from(
          new Set(
            bugs
              .map((b) => (b.title || "").toString().trim())
              .filter((t) => t.length > 0)
          )
        )
        if (!cancelled) setAllTitles(titles)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setIsLoadingTitles(false)
      }
    }
    loadTitles()
    return () => {
      cancelled = true
    }
  }, [])

  const titleSuggestions = React.useMemo(() => {
    const q = title.trim().toLowerCase()
    if (!q) return []
    return allTitles
      .filter((t) => t.toLowerCase().includes(q) && t.toLowerCase() !== q)
      .slice(0, 6)
  }, [title, allTitles])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="bug-title">
          Title <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <Input
            id="bug-title"
            placeholder="Short, descriptive title"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            onFocus={() => setShowTitleSuggestions(true)}
            onBlur={() => {
              // small delay so click on suggestion still registers
              setTimeout(() => setShowTitleSuggestions(false), 120)
            }}
            className={errors.title ? "border-red-500" : ""}
            autoComplete="on"
            autoCorrect="on"
            spellCheck
          />
          {showTitleSuggestions && titleSuggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-none border border-border bg-card shadow-sm max-h-48 overflow-y-auto">
              {titleSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    onChangeTitle(suggestion)
                    setShowTitleSuggestions(false)
                  }}
                >
                  {suggestion}
                </button>
              ))}
              {isLoadingTitles && (
                <div className="px-3 py-1.5 text-xs text-muted-foreground">
                  Loading titles…
                </div>
              )}
            </div>
          )}
        </div>
        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="bug-desc">
          Description <span className="text-red-500">*</span>
        </Label>
        <RichTextEditor
          value={description}
          onChange={onChangeDescription}
          placeholder="What's happening? Brief overview of the issue."
          hasError={!!errors.description}
          minHeight="160px"
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button onClick={onCancel} className="w-full px-4 sm:w-auto">
          Cancel
        </Button>
        <Button onClick={onNext} disabled={!canNext} className="w-full px-4 sm:w-auto">
          Next
        </Button>
      </div>
    </div>
  )
}

export default BugReportStep1Basic



