"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RichTextEditor } from "@/components/ui/RichTextEditor"

export type GraphIdeaKind = "idea" | "solution" | "fix"

type Props = {
  kind: GraphIdeaKind
  title: string
  description: string
  onChangeKind: (value: GraphIdeaKind) => void
  onChangeTitle: (value: string) => void
  onChangeDescription: (value: string) => void
  canNext: boolean
  onNext: () => void
  onCancel: () => void
}

export function GraphIdeaStep1Basics({
  kind,
  title,
  description,
  onChangeKind,
  onChangeTitle,
  onChangeDescription,
  canNext,
  onNext,
  onCancel,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Kind dropdown (Fix / Issue / Solution) */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="idea-kind">
          Type <span className="text-red-500">*</span>
        </Label>
        <Select
          value={kind}
          onValueChange={(v) => onChangeKind(v as GraphIdeaKind)}
        >
          <SelectTrigger id="idea-kind" className="capitalize">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="idea">Idea / Issue</SelectItem>
            <SelectItem value="solution">Solution</SelectItem>
            <SelectItem value="fix">Fix</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="idea-title">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="idea-title"
          placeholder="Short, descriptive title"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          autoComplete="on"
          autoCorrect="on"
          spellCheck
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="idea-desc">
          Description <span className="text-red-500">*</span>
        </Label>
        <RichTextEditor
          value={description}
          onChange={onChangeDescription}
          placeholder="What's the core idea or solution?"
          minHeight="160px"
        />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full rounded-full px-4 sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          onClick={onNext}
          disabled={!canNext}
          className="w-full rounded-full px-4 sm:w-auto"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
