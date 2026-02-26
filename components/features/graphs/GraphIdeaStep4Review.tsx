"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

export function GraphIdeaStep4Review({
  kind,
  title,
  description,
  summary,
  details,
  onBack,
  onSave,
  submitting,
}: {
  kind: string
  title: string
  description: string
  summary: string
  details: string
  onBack: () => void
  onSave: () => void
  submitting: boolean
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3 text-sm rounded-lg border p-4">
        <div>
          <div className="font-medium text-sm">Type</div>
          <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded capitalize">
            {kind || "—"}
          </div>
        </div>
        <div>
          <div className="font-medium text-sm">Title</div>
          <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
            {title || "(No title)"}
          </div>
        </div>
        <div>
          <div className="font-medium text-sm">Description</div>
          <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded whitespace-pre-wrap max-h-24 overflow-y-auto">
            {description || "—"}
          </div>
        </div>
        <div>
          <div className="font-medium text-sm">Summary</div>
          <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded whitespace-pre-wrap max-h-24 overflow-y-auto">
            {summary || "—"}
          </div>
        </div>
        <div>
          <div className="font-medium text-sm">Details / Steps</div>
          <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded whitespace-pre-wrap max-h-32 overflow-y-auto">
            {details || "—"}
          </div>
        </div>
      </div>
      <div className="flex flex-col-reverse gap-2 pt-4 border-t sm:flex-row sm:justify-end">
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
          onClick={onSave}
          disabled={submitting}
          className="w-full rounded-full px-4 sm:w-auto"
        >
          {submitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}
