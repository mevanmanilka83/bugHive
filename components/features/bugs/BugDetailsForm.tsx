"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { BugDescriptionContent } from "@/components/features/bugs/BugDescriptionContent"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib"

export interface BugDetailsFormProps {
  bug: {
    id: string
    title?: string
    description?: string
    status?: string
    priority?: string
    visibility?: string
    environment?: string
    expected_behavior?: string
    actual_behavior?: string
    steps_to_reproduce?: string
    tags?: string[] | null
    sources?: unknown
    attachments?: unknown
    created_by?: string
    assigned_to?: string | null
    [key: string]: unknown
  }
  userId?: string
  assigneeDisplayName?: string | null
  onStatusChange?: (bugId: string, newStatus: string) => void | Promise<void>
  onAssigneeChange?: (bugId: string, assignedTo: string | null) => void | Promise<void>
}

export function BugDetailsForm({
  bug,
  userId,
  assigneeDisplayName,
  onStatusChange,
  onAssigneeChange,
}: BugDetailsFormProps) {
  const status = (bug.status || "open") as string
  const canEditStatus = Boolean(userId && bug.created_by === userId && onStatusChange)
  const canEditAssignee = Boolean(userId && bug.created_by === userId && onAssigneeChange)
  const assignedTo = bug.assigned_to ?? null
  const isAssignedToMe = Boolean(userId && assignedTo === userId)

  const attachments = (() => {
    let att = bug.attachments
    if (typeof att === "string") {
      try {
        att = JSON.parse(att)
      } catch {
        att = null
      }
    }
    return Array.isArray(att) ? att : []
  })()

  const tagsArray = Array.isArray(bug.tags) ? bug.tags : []
  const sourceUrls: string[] =
    Array.isArray(bug.sources) && bug.sources.length
      ? (bug.sources as unknown[])
        .map((s: unknown) => (typeof s === "object" && s && "url" in s ? (s as { url: string }).url : String(s)))
        .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
      : []

  const [linkValidity, setLinkValidity] = React.useState<Record<string, boolean | null>>({})
  React.useEffect(() => {
    if (sourceUrls.length === 0) return
    const allowed = (u: string) => {
      try {
        const parsed = new URL(u)
        return parsed.protocol === "http:" || parsed.protocol === "https:"
      } catch {
        return false
      }
    }
    sourceUrls.forEach((url) => {
      if (!allowed(url.trim())) {
        setLinkValidity((prev) => ({ ...prev, [url]: false }))
        return
      }
      fetch(`/api/validate-link?url=${encodeURIComponent(url.trim())}`)
        .then((res) => res.json().catch(() => ({ valid: false })))
        .then((data) => setLinkValidity((prev) => ({ ...prev, [url]: data.valid === true })))
        .catch(() => setLinkValidity((prev) => ({ ...prev, [url]: false })))
    })
  }, [sourceUrls.join("\n")])

  const isImageUrl = (url: string): boolean => {
    if (!url) return false
    const cleanUrl = url.split("?")[0].split("#")[0]
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(cleanUrl)
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          {canEditStatus ? (
            <Select
              value={status}
              onValueChange={(value) => onStatusChange?.(bug.id, value)}
            >
              <SelectTrigger className="capitalize w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="reopened">Reopened</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input value={status.replace(/_/g, " ")} disabled className="capitalize" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Priority</Label>
          <Input value={(bug.priority || "medium") as string} disabled className="capitalize" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Assignee</Label>
          {canEditAssignee ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground min-w-[100px]">
                {assigneeDisplayName || (assignedTo ? "—" : "Unassigned")}
              </span>
              {!isAssignedToMe && userId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onAssigneeChange?.(bug.id, userId)}
                >
                  Assign to me
                </Button>
              )}
              {assignedTo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onAssigneeChange?.(bug.id, null)}
                >
                  Unassign
                </Button>
              )}
            </div>
          ) : (
            <Input
              value={assigneeDisplayName || (assignedTo ? "—" : "Unassigned")}
              disabled
            />
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Title</Label>
        <Input value={bug.title || ""} disabled />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Description</Label>
        <div className="rounded-none border border-input bg-background px-3 py-2 min-h-[100px] opacity-50 cursor-not-allowed">
          <BugDescriptionContent content={bug.description ?? ""} fallback="—" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Environment</Label>
          <Input value={bug.environment || "—"} disabled />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Visibility</Label>
          <Input value={(bug.visibility || "public") as string} disabled className="capitalize" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Expected behavior</Label>
          <Textarea value={bug.expected_behavior || "—"} disabled rows={3} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Actual behavior</Label>
          <Textarea value={bug.actual_behavior || "—"} disabled rows={3} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Steps to reproduce</Label>
        <Textarea value={bug.steps_to_reproduce || "—"} disabled rows={4} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Tags</Label>
          {tagsArray.length === 0 ? (
            <Input value="—" disabled />
          ) : (
            <div className="flex flex-wrap gap-1.5 !rounded-none border border-input bg-muted/30 px-3 py-2 min-h-[40px]">
              {tagsArray.map((tag) => {
                const value = String(tag || "").trim()
                const valid =
                  value.length > 0 &&
                  value.length <= 50 &&
                  /^[a-z0-9][a-z0-9-]*$/i.test(value)

                return (
                  <Badge
                    key={value}
                    variant="outline"
                    className={cn(
                      "inline-flex items-center gap-1 !rounded-none border px-2 py-0.5 text-[11px] font-medium",
                      valid
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300"
                        : "border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300"
                    )}
                  >
                    <span className="truncate max-w-[140px]">
                      {value}
                    </span>
                    {!valid && (
                      <span className="text-[9px] font-semibold uppercase tracking-wide">
                        Invalid tag
                      </span>
                    )}
                  </Badge>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Sources</Label>
          {sourceUrls.length === 0 ? (
            <Input value="—" disabled />
          ) : (
            <div className="flex flex-col gap-2 !rounded-none border border-input bg-muted/30 px-3 py-2 min-h-[40px]">
              {sourceUrls.map((url) => {
                const valid = linkValidity[url]
                const isValid = valid === true
                const isInvalid = valid === false
                const isPending = valid === undefined || valid === null
                return (
                  <div key={url} className="flex items-center flex-wrap gap-2">
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "inline-flex items-center gap-2 break-all text-sm underline underline-offset-2",
                        isPending && "text-muted-foreground",
                        isValid && "text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400",
                        isInvalid && "text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 ",
                          isPending && "bg-muted-foreground/50",
                          isValid && "bg-green-500",
                          isInvalid && "bg-red-500"
                        )}
                        aria-hidden
                      />
                      {url}
                    </a>
                    {isInvalid && (
                      <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase font-bold tracking-wider !rounded-none">
                        Invalid source
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Attachments</Label>
        <div className="grid gap-2">
          {attachments.length ? (
            attachments.map((att: unknown, idx: number) => {
              const url = typeof att === "string" ? att : (att as { url?: string })?.url ?? ""
              const filename =
                typeof att === "string"
                  ? att.split("/").pop() || att
                  : (att as { name?: string; filename?: string })?.name ||
                  (att as { name?: string; filename?: string })?.filename ||
                  url?.split("/").pop() ||
                  url
              const showPreview = isImageUrl(url)
              return (
                <div key={idx} className="inline-flex">
                  {showPreview ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          className="underline underline-offset-4 break-all text-brand-blue transition-all"
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {String(filename)}
                        </a>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        sideOffset={8}
                        className="bg-background text-foreground border border-input p-2 shadow-md max-w-[140px]"
                      >
                        <img
                          src={url}
                          alt={String(filename)}
                          className="max-h-20 max-w-[120px] rounded-none object-contain"
                        />
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <a
                      className="underline underline-offset-4 break-all text-brand-blue transition-all"
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {String(filename)}
                    </a>
                  )}
                </div>
              )
            })
          ) : (
            <Input value="—" disabled />
          )}
        </div>
      </div>
    </div>
  )
}
