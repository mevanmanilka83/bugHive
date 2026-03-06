"use client"

import { Button } from "@/components/ui/button"
import { BugDescriptionContent } from "@/components/features/bugs/BugDescriptionContent"
import { ArrowLeftIcon } from "@/components/ui/arrow-left"
import { GitForkIcon } from "@/components/ui/git-fork"
import { IconAlertTriangle, IconDeviceDesktop, IconEye, IconLock, IconTags, IconUsers } from "@tabler/icons-react"
import { cn } from "@/lib/utils-client"

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
  aiTagValidity?: Record<string, { valid: boolean; reason?: string }>
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
  aiTagValidity = {},
}: Props) {
  const parsedTags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm font-medium text-muted-foreground mb-2">Review your bug report before submitting:</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <GitForkIcon size={16} className="size-4" />
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
                  {parsedTags.length === 0 ? (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                      —
                    </div>
                  ) : (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {parsedTags.map((tag) => {
                        const valid =
                          tag.length > 0 &&
                          tag.length <= 50 &&
                          /^[a-z0-9][a-z0-9-]*$/i.test(tag)

                        const ai = aiTagValidity[tag]
                        const combinedValid = valid && (ai ? ai.valid : true)

                        return (
                          <span
                            key={tag}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              valid
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300"
                                : "border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300"
                            )}
                          >
                            <span className="truncate max-w-[140px]">
                              {tag}
                            </span>
                            {!combinedValid && (
                              <span className="text-[9px] font-semibold uppercase tracking-wide">
                                Invalid tag
                              </span>
                            )}
                          </span>
                        )
                      })}
                    </div>
                  )}
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

      <div className="flex flex-col-reverse gap-2 pt-4 border-t sm:flex-row sm:justify-between">
        <Button onClick={onBack} className="w-full px-4 sm:w-auto"><ArrowLeftIcon size={16} className="size-4 mr-2" />Back</Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-2">
          <Button  onClick={onCancel} disabled={isSubmitting} className="w-full px-4 sm:w-auto">Cancel</Button>
          <Button onClick={onSubmit} disabled={isSubmitting} className="w-full px-4 sm:w-auto">
            {isSubmitting ? "Submitting..." : "Submit Bug Report"}
          </Button>
        </div>
      </div>
    </div>
  )
}
export default BugReportStep5Review;

