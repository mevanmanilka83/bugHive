"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { IconUpload, IconX, IconPaperclip } from "@tabler/icons-react"
import { type SolutionDialogErrors } from "@/lib"

type AttachmentFile = {
  file: File
  id: string
  preview?: string
}

interface SolutionStep3DetailsProps {
  assignee: string
  estimatedHours: string
  links: string
  attachments: AttachmentFile[]
  errors: SolutionDialogErrors
  onChangeAssignee: (value: string) => void
  onChangeEstimatedHours: (value: string) => void
  onChangeLinks: (value: string) => void
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveAttachment: (id: string) => void
  formatFileSize: (bytes: number) => string
  onNext: () => void
  onBack: () => void
  onCancel: () => void
}

export default function SolutionStep3Details({
  assignee,
  estimatedHours,
  links,
  attachments,
  errors,
  onChangeAssignee,
  onChangeEstimatedHours,
  onChangeLinks,
  onUpload,
  onRemoveAttachment,
  formatFileSize,
  onNext,
  onBack,
  onCancel,
}: SolutionStep3DetailsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="assignee">Assignee</Label>
          <Input
            id="assignee"
            placeholder="Developer name or team"
            value={assignee}
            onChange={(e) => onChangeAssignee(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="estimated-hours">Estimated Hours</Label>
          <Input
            id="estimated-hours"
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g., 8.5"
            value={estimatedHours}
            onChange={(e) => onChangeEstimatedHours(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="links">Related Links</Label>
        <Input
          id="links"
          placeholder="Comma-separated URLs (PRs, docs, etc.)"
          value={links}
          onChange={(e) => onChangeLinks(e.target.value)}
          className={errors.links ? "border-red-500" : ""}
        />
        <p className="text-xs text-muted-foreground">
          Include references to pull requests, documentation, or related issues
        </p>
        {errors.links && <p className="text-sm text-red-500">{errors.links}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label className="flex items-center gap-2">
          <IconPaperclip className="size-4" /> Attachments
        </Label>
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
          <input
            type="file"
            id="file-upload"
            multiple
            accept="image/*,.txt,.csv,.json,.pdf,.zip"
            onChange={onUpload}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <IconUpload className="size-8" />
            <span className="text-sm">Click to upload files</span>
            <span className="text-xs">Images, logs, screenshots (max 10MB each)</span>
          </label>
        </div>

        {attachments.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Attached Files ({attachments.length})</div>
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-3 p-2 border rounded-md">
                  {attachment.preview ? (
                    <img
                      src={attachment.preview}
                      alt={attachment.file.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      <IconPaperclip className="size-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{attachment.file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.file.size)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveAttachment(attachment.id)}
                    className="h-8 w-8 p-0 rounded-full"
                  >
                    <IconX className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="rounded-full">Back</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="rounded-full">Cancel</Button>
          <Button onClick={onNext} className="rounded-full">Review</Button>
        </div>
      </div>
    </div>
  )
}
