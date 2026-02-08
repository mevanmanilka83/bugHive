"use client"

import { Button } from "@/components/ui/button"
import { BugDescriptionContent } from "@/components/bugs/BugDescriptionContent"
import { IconAlertTriangle, IconDeviceDesktop, IconEye, IconLock, IconReport, IconTags, IconUsers } from "@tabler/icons-react"

type Props = {
  title: string
  description: string
  priority: string
  visibility: string
  environmentBrowser: string
  environmentOs: string[]
  environmentDevice: string
  environmentVersion: string
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
  hideVisibility?: boolean
}

export function BugReportStep5Review({
  title,
  description,
  priority,
  visibility,
  environmentBrowser,
  environmentOs,
  environmentDevice,
  environmentVersion,
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
  hideVisibility = false,
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
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded max-h-20 overflow-y-auto">
                <BugDescriptionContent content={description} fallback="(No description)" className="text-muted-foreground" />
              </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <IconAlertTriangle className="size-4" />
              {hideVisibility ? 'Priority' : 'Priority & Visibility'}
            </h3>
            <div className={hideVisibility ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-3"}>
              <div>
                <div className="font-medium text-sm">Priority</div>
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded capitalize">{priority}</div>
              </div>
              {!hideVisibility && (
                <div>
                  <div className="font-medium text-sm">Visibility</div>
                  <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded capitalize flex items-center gap-1">
                    {visibility === 'private' && <IconLock className="size-3" />}
                    {visibility === 'public' && <IconEye className="size-3" />}
                    {visibility}
                  </div>
                </div>
              )}
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
              {(environmentBrowser || environmentOs.length > 0 || environmentDevice || environmentVersion) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {environmentBrowser && (
                    <div>
                      <div className="font-medium text-sm">Browser</div>
                      <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{environmentBrowser}</div>
                    </div>
                  )}
                  {environmentOs.length > 0 && (
                    <div>
                      <div className="font-medium text-sm">Operating System</div>
                      <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        {environmentOs.join(", ")}
                      </div>
                    </div>
                  )}
                  {environmentDevice && (
                    <div>
                      <div className="font-medium text-sm">Device</div>
                      <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{environmentDevice}</div>
                    </div>
                  )}
                  {environmentVersion && (
                    <div>
                      <div className="font-medium text-sm">Version</div>
                      <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{environmentVersion}</div>
                    </div>
                  )}
                </div>
              )}
              {!environmentBrowser && environmentOs.length === 0 && !environmentDevice && !environmentVersion && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">No environment details provided</div>
              )}
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
        <Button variant="outline" onClick={onBack} className="rounded-full px-4">Back</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="rounded-full px-4">Cancel</Button>
          <Button onClick={onSubmit} disabled={isSubmitting} className="rounded-full px-4">
            {isSubmitting ? "Submitting..." : "Submit Bug Report"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BugReportStep5Review



