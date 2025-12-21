"use client"

import { Button } from "@/components/ui/button"
import { IconAlertTriangle, IconDeviceDesktop, IconEye, IconLock, IconReport, IconTags, IconUsers } from "@tabler/icons-react"

type Props = {
  title: string
  description: string
  priority: string
  visibility: string
  environment: string
  expectedBehavior: string
  actualBehavior: string
  stepsToReproduce: string
  tagsInput: string
  sourcesInput: string
  attachmentsCount: number
  isSubmitting: boolean
  onBack: () => void
  onCancel: () => void
  onSubmit: () => void
}

export function BugReportStep5Review({
  title,
  description,
  priority,
  visibility,
  environment,
  expectedBehavior,
  actualBehavior,
  stepsToReproduce,
  tagsInput,
  sourcesInput,
  attachmentsCount,
  isSubmitting,
  onBack,
  onCancel,
  onSubmit,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm font-medium text-muted-foreground mb-2">Review your bug report before submitting:</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <IconReport className="size-4" />
              Basic Information
            </h3>
            <div className="space-y-3">
              <div>
                <div className="font-medium text-sm">Title</div>
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{title || "(No title)"}</div>
              </div>
              <div>
                <div className="font-medium text-sm">Description</div>
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded whitespace-pre-wrap max-h-20 overflow-y-auto">{description || "(No description)"}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <IconAlertTriangle className="size-4" />
              Priority & Visibility
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="font-medium text-sm">Priority</div>
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded capitalize">{priority}</div>
              </div>
              <div>
                <div className="font-medium text-sm">Visibility</div>
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded capitalize flex items-center gap-1">
                  {visibility === 'private' && <IconLock className="size-3" />}
                  {visibility === 'team' && <IconUsers className="size-3" />}
                  {visibility === 'public' && <IconEye className="size-3" />}
                  {visibility}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <IconDeviceDesktop className="size-4" />
              Environment & Behavior
            </h3>
            <div className="space-y-3">
              <div>
                <div className="font-medium text-sm">Environment</div>
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{environment || "—"}</div>
              </div>
              <div>
                <div className="font-medium text-sm">Expected Behavior</div>
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded whitespace-pre-wrap max-h-16 overflow-y-auto">{expectedBehavior || "—"}</div>
              </div>
              <div>
                <div className="font-medium text-sm">Actual Behavior</div>
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded whitespace-pre-wrap max-h-16 overflow-y-auto">{actualBehavior || "—"}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <IconTags className="size-4" />
              Additional Details
            </h3>
            <div className="space-y-3">
              {stepsToReproduce && (
                <div>
                  <div className="font-medium text-sm">Steps to Reproduce</div>
                  <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded whitespace-pre-wrap max-h-20 overflow-y-auto">{stepsToReproduce}</div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <div className="font-medium text-sm">Tags</div>
                  <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{tagsInput || "—"}</div>
                </div>
                <div>
                  <div className="font-medium text-sm">Sources</div>
                  <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{sourcesInput || "—"}</div>
                </div>
              </div>
              {attachmentsCount > 0 && (
                <div>
                  <div className="font-medium text-sm">Attachments ({attachmentsCount})</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Bug Report"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BugReportStep5Review



