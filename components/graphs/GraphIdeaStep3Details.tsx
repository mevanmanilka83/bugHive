"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/ui/RichTextEditor"

export function GraphIdeaStep3Details({
  details,
  onDetailsChange,
  onNext,
  onBack,
}: {
  details: string
  onDetailsChange: (d: string) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Details / Steps</Label>
        <RichTextEditor
          value={details}
          onChange={onDetailsChange}
          placeholder="Add implementation steps, notes, or details..."
          minHeight="160px"
        />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="w-full rounded-full px-4 sm:w-auto"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onNext}
          className="w-full rounded-full px-4 sm:w-auto"
        >
          Next
        </Button>
      </div>
    </div>
  )
}
