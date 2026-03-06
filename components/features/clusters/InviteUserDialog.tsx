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

  const parseEmailList = React.useCallback((value: string) => {
    return Array.from(
      new Set(
        value
          .split(/[\n,;]+/)
          .map((item) => item.trim())
          .filter(Boolean)
      )
    )
  }, [])

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
      const inviteTasks: Array<() => Promise<{ success: boolean; error?: string }>> = []

      const trimmedUsername = username.trim()
      if (trimmedUsername) {
        inviteTasks.push(async () => {
          const result = await inviteUserToCluster(cluster.id, undefined, trimmedUsername)
          return { success: !!result.success, error: result.success ? undefined : result.error }
        })
      }

      const emails = parseEmailList(email)
      emails.forEach((address) => {
        inviteTasks.push(async () => {
          const result = await inviteUserToCluster(cluster.id, address, undefined)
          return { success: !!result.success, error: result.success ? undefined : result.error }
        })
      })

      if (inviteTasks.length === 0) {
        throw new Error("Enter at least one email or username")
      }

      let successCount = 0
      const failures: string[] = []

      for (const task of inviteTasks) {
        const outcome = await task()
        if (outcome.success) {
          successCount += 1
        } else if (outcome.error) {
          failures.push(outcome.error)
        }
      }

      if (successCount === 0) {
        throw new Error(failures[0] || "Failed to send invitations")
      }

      if (successCount === 1) {
        toast.success("Invitation sent successfully")
      } else {
        toast.success(`${successCount} invitations sent successfully`)
      }

      if (failures.length > 0) {
        toast.error(`${failures.length} invite${failures.length > 1 ? "s" : ""} failed. ${failures[0]}`)
      }

      setEmail("")
      setUsername("")
      onSuccess?.()
      if (failures.length === 0) {
        onOpenChange(false)
      }
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
                type="text"
                placeholder="user1@example.com, user2@example.com"
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
              Provide one username and/or multiple emails separated by commas.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !hasInput}>
              <IconMail className="size-4 mr-2" />
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
