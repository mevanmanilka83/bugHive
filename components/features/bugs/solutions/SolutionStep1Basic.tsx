"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/ui/RichTextEditor"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { SolutionDialogErrors } from "@/lib/schemas/types"

interface SolutionStep1BasicProps {
  title: string
  description: string
  errors: SolutionDialogErrors
  onChangeTitle: (value: string) => void
  onChangeDescription: (value: string) => void
  canNext: boolean
  onNext: () => void
  onCancel: () => void
  /** Bug context for AI suggestions */
  bugTitle?: string
  bugDescription?: string
}

export default function SolutionStep1Basic({
  title,
  description,
  errors,
  onChangeTitle,
  onChangeDescription,
  canNext,
  onNext,
  onCancel,
  bugTitle,
  bugDescription,
}: SolutionStep1BasicProps) {
  const [suggesting, setSuggesting] = React.useState(false)

  const handleSuggestWithAI = async () => {
    if (!bugTitle?.trim()) {
      toast.error("Bug title is required for AI suggestions")
      return
    }
    setSuggesting(true)
    try {
      const res = await fetch("/api/ai-suggest-solutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bugTitle: bugTitle.trim(),
          bugDescription: bugDescription?.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to get suggestions")
      }
      const { suggestions } = await res.json()
      if (!suggestions?.length) {
        toast.error("No suggestions returned")
        return
      }
      const first = suggestions[0]
      onChangeTitle(first.title)
      onChangeDescription(first.description)
      toast.success("AI suggestion applied")
    } catch (err: any) {
      toast.error(err?.message || "Failed to get AI suggestions")
    } finally {
      setSuggesting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {bugTitle && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSuggestWithAI}
          disabled={suggesting}
          className="w-fit"
        >
          {suggesting ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="size-4 mr-2" />
          )}
          Suggest with AI
        </Button>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="solution-title">Solution Title <span className="text-red-500">*</span></Label>
        <Input
          id="solution-title"
          placeholder="Brief, descriptive title for the solution"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          className={errors.title ? "border-red-500" : ""}
          autoComplete="on"
          autoCorrect="on"
          spellCheck
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="solution-description">Solution Description <span className="text-red-500">*</span></Label>
        <RichTextEditor
          value={description}
          onChange={onChangeDescription}
          placeholder="Detailed description of the solution, including implementation steps, technical details, and any considerations..."
          hasError={!!errors.description}
          minHeight="180px"
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button  onClick={onCancel} className="w-full  sm:w-auto">Cancel</Button>
        <Button onClick={onNext} disabled={!canNext} className="w-full  sm:w-auto">Next</Button>
      </div>
    </div>
  )
}
