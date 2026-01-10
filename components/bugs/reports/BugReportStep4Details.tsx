"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconPaperclip, IconUpload, IconX, IconDeviceDesktop } from "@tabler/icons-react"
import { Separator } from "@/components/ui/separator"

type AttachmentFile = {
  file: File
  id: string
  preview?: string
}

type Props = {
  stepsToReproduce: string
  tagsInput: string
  sourcesInput: string
  attachments: AttachmentFile[]
  environmentBrowser: string
  environmentOs: string
  environmentDevice: string
  environmentVersion: string
  onChangeSteps: (value: string) => void
  onChangeTags: (value: string) => void
  onChangeSources: (value: string) => void
  onChangeEnvironmentBrowser: (value: string) => void
  onChangeEnvironmentOs: (value: string) => void
  onChangeEnvironmentDevice: (value: string) => void
  onChangeEnvironmentVersion: (value: string) => void
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (id: string) => void
  formatFileSize: (bytes: number) => string
  onReview: () => void
  onBack: () => void
  onCancel: () => void
}

export function BugReportStep4Details({
  stepsToReproduce,
  tagsInput,
  sourcesInput,
  attachments,
  environmentBrowser,
  environmentOs,
  environmentDevice,
  environmentVersion,
  onChangeSteps,
  onChangeTags,
  onChangeSources,
  onChangeEnvironmentBrowser,
  onChangeEnvironmentOs,
  onChangeEnvironmentDevice,
  onChangeEnvironmentVersion,
  onUpload,
  onRemove,
  formatFileSize,
  onReview,
  onBack,
  onCancel,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border p-4 space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <IconDeviceDesktop className="size-4" />
          Environment
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="env-browser">Browser</Label>
            <Select value={environmentBrowser || undefined} onValueChange={onChangeEnvironmentBrowser}>
              <SelectTrigger id="env-browser">
                <SelectValue placeholder="Select browser (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Chrome">Chrome</SelectItem>
                <SelectItem value="Firefox">Firefox</SelectItem>
                <SelectItem value="Safari">Safari</SelectItem>
                <SelectItem value="Edge">Edge</SelectItem>
                <SelectItem value="Opera">Opera</SelectItem>
                <SelectItem value="Brave">Brave</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="env-os">Operating System</Label>
            <Select value={environmentOs || undefined} onValueChange={onChangeEnvironmentOs}>
              <SelectTrigger id="env-os">
                <SelectValue placeholder="Select OS (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Windows">Windows</SelectItem>
                <SelectItem value="macOS">macOS</SelectItem>
                <SelectItem value="Linux">Linux</SelectItem>
                <SelectItem value="iOS">iOS</SelectItem>
                <SelectItem value="Android">Android</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="env-device">Device</Label>
            <Input
              id="env-device"
              placeholder="e.g., iPhone 15, Desktop, etc."
              value={environmentDevice}
              onChange={(e) => onChangeEnvironmentDevice(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="env-version">Version</Label>
            <Input
              id="env-version"
              placeholder="e.g., 1.2.3, Chrome 120, etc."
              value={environmentVersion}
              onChange={(e) => onChangeEnvironmentVersion(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <Label htmlFor="bug-steps">Steps to Reproduce</Label>
        <Textarea
          id="bug-steps"
          placeholder={"1) Go to ...\n2) Click ...\n3) Observe ..."}
          value={stepsToReproduce}
          onChange={(e) => onChangeSteps(e.target.value)}
          rows={5}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="bug-tags" className="flex items-center gap-2">
            Tags (comma separated)
          </Label>
          <Input
            id="bug-tags"
            placeholder="ui, performance, api"
            value={tagsInput}
            onChange={(e) => onChangeTags(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="bug-sources" className="flex items-center gap-2">
            Sources/links (comma separated)
          </Label>
          <Input
            id="bug-sources"
            placeholder="URL, file path, reference"
            value={sourcesInput}
            onChange={(e) => onChangeSources(e.target.value)}
          />
        </div>
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
                    onClick={() => onRemove(attachment.id)}
                    className="h-8 w-8 p-0"
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
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onReview}>Review</Button>
        </div>
      </div>
    </div>
  )
}

export default BugReportStep4Details



