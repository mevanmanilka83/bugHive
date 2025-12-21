"use client"

import * as React from "react"
import { IconMail } from "@tabler/icons-react"
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
import { toast } from "sonner"

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cluster: any | null
  onSuccess?: () => void
}

export function InviteUserDialog({ open, onOpenChange, cluster, onSuccess }: InviteUserDialogProps) {
  const [email, setEmail] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setEmail("")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cluster || !email.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/clusters/${cluster.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      toast.success("Invitation sent successfully")
      setEmail("")
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invitation")
    } finally {
      setLoading(false)
    }
  }

  if (!cluster) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite User to {cluster.name}</DialogTitle>
            <DialogDescription>
              Enter the email address of the user you want to invite to this cluster.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !email.trim()}>
              <IconMail className="size-4 mr-2" />
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
