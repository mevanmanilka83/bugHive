"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/RichTextEditor"
import { type BugDialogErrors } from "@/lib"

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
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="bug-title">Title <span className="text-red-500">*</span></Label>
        <Input
          id="bug-title"
          placeholder="Short, descriptive title"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="bug-desc">Description <span className="text-red-500">*</span></Label>
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
        <Button variant="outline" onClick={onCancel} className="w-full rounded-full px-4 sm:w-auto">Cancel</Button>
        <Button onClick={onNext} disabled={!canNext} className="w-full rounded-full px-4 sm:w-auto">Next</Button>
      </div>
    </div>
  )
}

export default BugReportStep1Basic



