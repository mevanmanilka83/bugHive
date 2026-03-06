"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/ui/RichTextEditor"
import { type SolutionDialogErrors } from "@/lib"

interface SolutionStep1BasicProps {
  title: string
  description: string
  errors: SolutionDialogErrors
  onChangeTitle: (value: string) => void
  onChangeDescription: (value: string) => void
  canNext: boolean
  onNext: () => void
  onCancel: () => void
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
}: SolutionStep1BasicProps) {
  return (
    <div className="flex flex-col gap-4">
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
