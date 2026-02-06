"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { BugDescriptionContent } from "@/components/bugs/BugDescriptionContent"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
    [key: string]: unknown
  }
  userId?: string
  onStatusChange?: (bugId: string, newStatus: string) => void | Promise<void>
}

export function BugDetailsForm({ bug, userId, onStatusChange }: BugDetailsFormProps) {
  const status = (bug.status || "open") as string
  const canEditStatus = Boolean(userId && bug.created_by === userId && onStatusChange)

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

  const tagsDisplay = Array.isArray(bug.tags) && bug.tags.length ? bug.tags.join(", ") : "—"
  const sourcesDisplay =
    Array.isArray(bug.sources) && bug.sources.length
      ? (bug.sources as unknown[]).map((s: unknown) => (typeof s === "object" && s && "url" in s ? (s as { url: string }).url : String(s))).join(", ")
      : "—"

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
      <div className="flex flex-col gap-1.5">
        <Label>Title</Label>
        <Input value={bug.title || ""} disabled />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Description</Label>
        <div className="rounded-md border border-input bg-background px-3 py-2 min-h-[100px] opacity-50 cursor-not-allowed">
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
          <Input value={tagsDisplay} disabled />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Sources</Label>
          <Input value={sourcesDisplay} disabled />
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
              return (
                <a
                  key={idx}
                  className="underline underline-offset-4 break-all text-blue-600 hover:text-blue-800"
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {String(filename)}
                </a>
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
