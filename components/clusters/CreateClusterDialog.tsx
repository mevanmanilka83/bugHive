"use client"

import * as React from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { createCluster } from "@/app/actions/Cluster"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface CreateClusterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating..." : "Create Cluster"}
    </Button>
  )
}

export function CreateClusterDialog({ open, onOpenChange, onSuccess }: CreateClusterDialogProps) {
  const [state, formAction] = useActionState(createCluster, null)
  const [hasShownSuccess, setHasShownSuccess] = React.useState(false)
  const onSuccessRef = React.useRef(onSuccess)

  // Keep ref updated
  React.useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      setHasShownSuccess(false)
    }
  }, [open])

  React.useEffect(() => {
    if (state?.success && !hasShownSuccess) {
      toast.success("Cluster created successfully")
      setHasShownSuccess(true)
      onSuccessRef.current?.()
    } else if (state?.error && !hasShownSuccess) {
      toast.error(state.error)
      setHasShownSuccess(true)
    }
  }, [state, hasShownSuccess])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Create New Cluster</DialogTitle>
            <DialogDescription>
              Create a new team cluster to collaborate on bugs and projects.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Cluster Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="My Team Cluster"
                required
                minLength={3}
                maxLength={100}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Optional description for this cluster"
                rows={3}
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
