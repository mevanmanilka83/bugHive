"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { BugDescriptionContent } from "@/components/bugs/BugDescriptionContent"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export interface SolutionDetailsFormProps {
  solution: {
    id: string
    title?: string
    description?: string
    solution_type?: string
    priority?: string
    status?: string
    assignee?: string
    estimated_hours?: number | string | null
    links?: unknown
    attachment_urls?: unknown
    created_by?: string
    created_at?: string
    [key: string]: unknown
  }
  userId?: string
}

export function SolutionDetailsForm({ solution, userId }: SolutionDetailsFormProps) {
  const solutionType = (solution.solution_type || "bug_fix") as string
  const priority = (solution.priority || "medium") as string
  const status = (solution.status || "draft") as string

  const attachments = (() => {
    let att = solution.attachment_urls
    if (typeof att === "string") {
      try {
        att = JSON.parse(att)
      } catch {
        att = null
      }
    }
    return Array.isArray(att) ? att : []
  })()

  const links = (() => {
    let lnks = solution.links
    if (typeof lnks === "string") {
      try {
        lnks = JSON.parse(lnks)
      } catch {
        lnks = null
      }
    }
    return Array.isArray(lnks) ? lnks : []
  })()

  const linksDisplay = links.length ? links.join(", ") : "—"

  const isImageUrl = (url: string): boolean => {
    if (!url) return false
    const cleanUrl = url.split("?")[0].split("#")[0]
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(cleanUrl)
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Solution Type</Label>
          <Input value={solutionType.replace(/_/g, " ")} disabled className="capitalize" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <Input value={status.replace(/_/g, " ")} disabled className="capitalize" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Priority</Label>
          <Input value={priority} disabled className="capitalize" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Estimated Hours</Label>
          <Input value={solution.estimated_hours ?? "—"} disabled />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Title</Label>
        <Input value={solution.title || ""} disabled />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Description</Label>
        <div className="rounded-md border border-input bg-background px-3 py-2 min-h-[100px] opacity-50 cursor-not-allowed">
          <BugDescriptionContent content={solution.description ?? ""} fallback="—" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Assignee</Label>
        <Input value={solution.assignee || "—"} disabled />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Links</Label>
        <div className="grid gap-2">
          {links.length > 0 ? (
            links.map((link: unknown, idx: number) => {
              const linkStr = String(link)
              return (
                <a
                  key={idx}
                  className="underline underline-offset-4 break-all text-blue-600 hover:text-blue-800"
                  href={linkStr}
                  target="_blank"
                  rel="noreferrer"
                >
                  {linkStr}
                </a>
              )
            })
          ) : (
            <Input value="—" disabled />
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
                          className="underline underline-offset-4 break-all text-blue-600 hover:text-blue-800"
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
                          className="max-h-20 max-w-[120px] rounded-sm object-contain"
                        />
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <a
                      className="underline underline-offset-4 break-all text-blue-600 hover:text-blue-800"
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
