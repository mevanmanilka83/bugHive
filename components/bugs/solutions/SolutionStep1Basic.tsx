"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { type SolutionDialogErrors } from "@/lib/types/bugSolution"

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
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="solution-description">Solution Description <span className="text-red-500">*</span></Label>
        <Textarea
          id="solution-description"
          placeholder="Detailed description of the solution, including implementation steps, technical details, and any considerations..."
          value={description}
          onChange={(e) => onChangeDescription(e.target.value)}
          rows={6}
          className={errors.description ? "border-red-500" : ""}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onNext} disabled={!canNext}>Next</Button>
      </div>
    </div>
  )
}
