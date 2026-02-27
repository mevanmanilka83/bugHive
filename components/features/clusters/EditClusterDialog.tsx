"use client"

import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radioGroup"
import { RichTextEditor } from "@/components/ui/RichTextEditor"

function normalizeDescription(html: string) {
  const trimmed = html.trim()
  if (trimmed === "" || trimmed === "<p></p>" || trimmed === "<p><br></p>") return ""
  return html
}

interface EditClusterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cluster: any | null
  onSuccess?: (updated: {
    visibility: "private" | "public"; name: string; description: string | null
  }) => void
}

export function EditClusterDialog({ open, onOpenChange, cluster, onSuccess }: EditClusterDialogProps) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [visibility, setVisibility] = React.useState<"private" | "public">("private")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open && cluster) {
      setName(cluster.name || "")
      setDescription(cluster.description || "")
      setVisibility((cluster.visibility || "private").toLowerCase() === "public" ? "public" : "private")
    }
  }, [open, cluster])

  const handleSave = async () => {
    if (!cluster) return

    const trimmedName = name.trim()
    const normalizedDesc = normalizeDescription(description)

    if (!trimmedName) {
      toast.error("Cluster name is required")
      return
    }

    try {
      setSaving(true)
      const res = await fetch(`/api/clusters/${cluster.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          description: normalizedDesc.length > 0 ? normalizedDesc : null,
          visibility,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to update cluster")
      }

      toast.success("Cluster updated")
      onOpenChange(false)
      onSuccess?.({ visibility, name: trimmedName, description: normalizedDesc.length > 0 ? normalizedDesc : null })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update cluster")
    } finally {
      setSaving(false)
    }
  }

  if (!cluster) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Cluster</DialogTitle>
          <DialogDescription>Update the cluster name and description.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-cluster-name">
              Name
            </label>
            <input
              id="edit-cluster-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 w-full rounded-none border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="space-y-2 pt-1">
            <label className="text-sm font-medium">Visibility</label>
            <RadioGroup
              value={visibility}
              onValueChange={(value) => setVisibility(value === "public" ? "public" : "private")}
              className="grid gap-2"
            >
              <label className="flex items-start gap-3 rounded-none border bg-background p-3 hover:border-primary/40">
                <RadioGroupItem value="private" className="mt-0.5" />
                <span className="grid gap-1">
                  <span className="text-sm font-medium">Private</span>
                  <span className="text-xs text-muted-foreground">
                    Invite-only. Members must be invited by the owner.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-none border bg-background p-3 hover:border-primary/40">
                <RadioGroupItem value="public" className="mt-0.5" />
                <span className="grid gap-1">
                  <span className="text-sm font-medium">Public</span>
                  <span className="text-xs text-muted-foreground">
                    Anyone can request to join. Owner approves or declines.
                  </span>
                </span>
              </label>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-cluster-description">
              Description
            </label>
            <div className="rounded-none border border-input">
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Describe this cluster..."
                minHeight="140px"
                maxHeight="220px"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You can format text and add links. Keep it concise.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="px-5"
          >
            {saving ? "Saving..." : "Save & Exit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
