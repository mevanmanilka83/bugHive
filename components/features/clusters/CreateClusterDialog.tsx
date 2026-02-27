"use client"

import * as React from "react"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { createCluster } from "@/app/actions/cluster"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radioGroup"
import { RichTextEditor } from "@/components/ui/RichTextEditor"
import { toast } from "sonner"
import { getClusterDefaultVisibility, type ClusterVisibility } from "@/lib/utils-client"

interface CreateClusterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending}
      className="px-5"
    >
      {pending ? "Creating..." : "Create Cluster"}
    </Button>
  )
}

export function CreateClusterDialog({ open, onOpenChange, onSuccess }: CreateClusterDialogProps) {
  const [state, formAction] = useActionState(createCluster, null)
  const [description, setDescription] = React.useState("")
  const [visibility, setVisibility] = React.useState<ClusterVisibility>("private")
  const hasProcessedRef = React.useRef<string | null>(null)
  const onSuccessRef = React.useRef(onSuccess)

  // Keep ref updated
  React.useEffect(() => {
    onSuccessRef.current = onSuccess
  }, [onSuccess])

  // Reset when dialog closes
  React.useEffect(() => {
    if (!open) {
      hasProcessedRef.current = null
      setDescription("")
    }
  }, [open])

  React.useEffect(() => {
    // Create a unique key for this state to prevent duplicate processing
    const stateKey = state?.success ? 'success' : state?.error ? `error-${state.error}` : null

    if (stateKey && state && hasProcessedRef.current !== stateKey) {
      hasProcessedRef.current = stateKey

      if (state.success) {
        toast.success("Cluster created successfully")
        onSuccessRef.current?.()
      } else if (state.error) {
        toast.error(state.error)
      }
    }
  }, [state])

  React.useEffect(() => {
    setVisibility(getClusterDefaultVisibility())
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-hidden p-4 sm:p-6">
        <form action={formAction} className="flex h-full max-h-[85vh] flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Create New Cluster</DialogTitle>
            <DialogDescription>
              Create a new team cluster to collaborate on bugs and projects.
            </DialogDescription>
          </DialogHeader>
          <div className="grid flex-1 min-h-0 gap-4 overflow-y-auto py-3 pr-1 sm:py-5">
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
            <div className="grid gap-2 rounded-none border bg-muted/20 p-2 sm:gap-3 sm:p-3">
              <div className="flex items-center justify-between">
                <Label>Visibility</Label>
                <span className="text-xs text-muted-foreground">Required</span>
              </div>
              <RadioGroup
                name="visibility"
                value={visibility}
                onValueChange={(value) => {
                  if (value === "public" || value === "private") {
                    setVisibility(value)
                  }
                }}
                className="grid gap-2"
              >
                <label className="flex items-start gap-3 rounded-none border bg-background p-2 hover:border-primary/40">
                  <RadioGroupItem value="private" className="mt-0.5" />
                  <span className="grid gap-1">
                    <span className="text-sm font-medium">Private</span>
                    <span className="text-xs text-muted-foreground">
                      Invite-only. Members must be invited by the owner.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 rounded-none border bg-background p-2 hover:border-primary/40">
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
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <div className="rounded-none border border-input">
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Optional description for this cluster"
                  minHeight="120px"
                  maxHeight="120px"
                  className="h-[220px] max-h-[220px] overflow-hidden"
                />
              </div>
              <input type="hidden" name="description" value={description} />
              <p className="text-xs text-muted-foreground">
                You can format text and add links. Keep it concise.
              </p>
            </div>
          </div>
          <DialogFooter className="shrink-0 flex items-center justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur mt-auto">
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4"
            >
              Cancel
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
