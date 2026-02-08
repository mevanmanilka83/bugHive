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
  onSuccess?: (updated: { name: string; description: string | null }) => void
}

export function EditClusterDialog({ open, onOpenChange, cluster, onSuccess }: EditClusterDialogProps) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open && cluster) {
      setName(cluster.name || "")
      setDescription(cluster.description || "")
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
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to update cluster")
      }

      toast.success("Cluster updated")
      onOpenChange(false)
      onSuccess?.({ name: trimmedName, description: normalizedDesc.length > 0 ? normalizedDesc : null })
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
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-cluster-name">
              Name
            </label>
            <input
              id="edit-cluster-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="edit-cluster-description">
              Description
            </label>
            <div className="rounded-md border border-input">
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Describe this cluster..."
                minHeight="140px"
                maxHeight="220px"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-full">
            {saving ? "Saving..." : "Save & Exit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
