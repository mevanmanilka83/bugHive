"use client"

import * as React from "react"
import { IconMail, IconUser } from "@tabler/icons-react"
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
import { inviteUserToCluster } from "@/app/actions/cluster"

interface InviteUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cluster: any | null
  onSuccess?: () => void
}

export function InviteUserDialog({ open, onOpenChange, cluster, onSuccess }: InviteUserDialogProps) {
  const [email, setEmail] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setEmail("")
      setUsername("")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cluster || (!email.trim() && !username.trim())) return

    setLoading(true)
    try {
      const result = await inviteUserToCluster(
        cluster.id,
        email.trim() || undefined,
        username.trim() || undefined
      )

      if (!result.success) {
        throw new Error(result.error || 'Failed to send invitation')
      }

      toast.success(result.message || "Invitation sent successfully")
      setEmail("")
      setUsername("")
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invitation")
    } finally {
      setLoading(false)
    }
  }

  if (!cluster) return null

  const hasInput = email.trim() || username.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite User to {cluster.name}</DialogTitle>
            <DialogDescription>
              Enter the email address or username of the user you want to invite to this cluster.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Provide either an email address or username (or both).
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !hasInput} className="rounded-full">
              <IconMail className="size-4 mr-2" />
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
