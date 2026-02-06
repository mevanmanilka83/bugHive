"use client"

import { type BugDialogErrors } from "@/lib"
import { IconAlertTriangle, IconEye, IconLock } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Props = {
  priority: string
  visibility: string
  errors: BugDialogErrors
  onChangePriority: (value: string) => void
  onChangeVisibility: (value: string) => void
  canNext: boolean
  onNext: () => void
  onBack: () => void
  onCancel: () => void
  hideVisibility?: boolean
}

export function BugReportStep2Priority({
  priority,
  visibility,
  errors,
  onChangePriority,
  onChangeVisibility,
  canNext,
  onNext,
  onBack,
  onCancel,
  hideVisibility = false,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="bug-priority" className="flex items-center gap-2">
          <IconAlertTriangle className="size-4" /> Priority Level <span className="text-red-500">*</span>
        </Label>
        <Select value={priority} onValueChange={onChangePriority}>
          <SelectTrigger id="bug-priority" className={errors.priority ? "border-red-500" : ""}>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low - Minor issue</SelectItem>
            <SelectItem value="medium">Medium - Standard bug</SelectItem>
            <SelectItem value="high">High - Important issue</SelectItem>
            <SelectItem value="critical">Critical - Blocks functionality</SelectItem>
          </SelectContent>
        </Select>
        {errors.priority && <p className="text-sm text-red-500">{errors.priority}</p>}
      </div>
      {!hideVisibility && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="bug-visibility" className="flex items-center gap-2">
            <IconEye className="size-4" /> Visibility <span className="text-red-500">*</span>
          </Label>
          <Select value={visibility} onValueChange={onChangeVisibility}>
            <SelectTrigger id="bug-visibility" className={errors.visibility ? "border-red-500" : ""}>
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">
                <div className="flex items-center gap-2">
                  <IconLock className="size-4" />
                  Private - Only you can see this
                </div>
              </SelectItem>
              <SelectItem value="public">
                <div className="flex items-center gap-2">
                  <IconEye className="size-4" />
                  Public - Everyone can see this
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          {errors.visibility && <p className="text-sm text-red-500">{errors.visibility}</p>}
        </div>
      )}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="rounded-full px-4">Back</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="rounded-full px-4">Cancel</Button>
          <Button onClick={onNext} disabled={!canNext} className="rounded-full px-4">Next</Button>
        </div>
      </div>
    </div>
  )
}

export default BugReportStep2Priority



