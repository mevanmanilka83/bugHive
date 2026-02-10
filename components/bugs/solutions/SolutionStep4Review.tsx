"use client"

import * as React from "react"
import { BugDescriptionContent } from "@/components/bugs/BugDescriptionContent"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface SolutionStep4ReviewProps {
  title: string
  description: string
  solutionType: string
  priority: string
  status: string
  assignee: string
  estimatedHours: string
  links: string
  attachmentsCount: number
  isSubmitting: boolean
  onSubmit: () => void
  onBack: () => void
  onCancel: () => void
}

export default function SolutionStep4Review({
  title,
  description,
  solutionType,
  priority,
  status,
  assignee,
  estimatedHours,
  links,
  attachmentsCount,
  isSubmitting,
  onSubmit,
  onBack,
  onCancel,
}: SolutionStep4ReviewProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Title</Label>
            <p className="text-sm">{title || "—"}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Type</Label>
            <p className="text-sm capitalize">{solutionType || "—"}</p>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Description</Label>
          <div className="text-sm">
            <BugDescriptionContent content={description} fallback="—" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
            <p className="text-sm capitalize">{priority || "—"}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Status</Label>
            <p className="text-sm capitalize">{status || "—"}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Assignee</Label>
            <p className="text-sm">{assignee || "—"}</p>
          </div>
        </div>
        {estimatedHours && (
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Estimated Hours</Label>
            <p className="text-sm">{estimatedHours}</p>
          </div>
        )}
        {links && (
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Related Links</Label>
            <p className="text-sm">{links}</p>
          </div>
        )}
        {attachmentsCount > 0 && (
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Attachments</Label>
            <p className="text-sm">{attachmentsCount} file(s) attached</p>
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={onBack} className="w-full rounded-full sm:w-auto">Back</Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full rounded-full sm:w-auto">Cancel</Button>
          <Button onClick={onSubmit} disabled={isSubmitting || !title.trim() || !description.trim() || !solutionType} className="w-full rounded-full sm:w-auto">
            {isSubmitting ? "Submitting..." : "Submit Solution"}
          </Button>
        </div>
      </div>
    </div>
  )
}
