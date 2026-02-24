"use client"

import * as React from "react"
import { IconMail, IconSearch } from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { PendingInvitesDialogSkeleton } from "@/components/skeletons/PendingInvitesDialogSkeleton"

interface PendingInvitesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cluster: any | null
}

type PendingInvite = {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
}

export function PendingInvitesDialog({
  open,
  onOpenChange,
  cluster,
}: PendingInvitesDialogProps) {
  const [pendingUsers, setPendingUsers] = React.useState<PendingInvite[]>([])
  const [loading, setLoading] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [reRequesting, setReRequesting] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchPending() {
      if (!cluster || !open) return

      const inviteIds = cluster.invites || []
      if (inviteIds.length === 0) {
        setPendingUsers([])
        return
      }

      try {
        setLoading(true)
        const idsParam = inviteIds.join(",")
        const res = await fetch(`/api/users/batch?ids=${idsParam}`)
        if (!res.ok) {
          setPendingUsers([])
          return
        }
        const data = await res.json()
        const users = (data.users || []) as { id: string; name?: string | null; email?: string | null; image?: string | null }[]
        const userMap = new Map(users.map((user) => [user.id, user]))

        const pending = inviteIds.map((id: string) => {
          const user = userMap.get(id)
          const name = user?.name || (user?.email ? user.email.split("@")[0] : null)
          return {
            id,
            email: user?.email || null,
            name,
            image: user?.image || null,
          }
        })

        setPendingUsers(pending)
      } finally {
        setLoading(false)
      }
    }

    fetchPending()
  }, [cluster, open])

  const filteredUsers = React.useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return pendingUsers
    return pendingUsers.filter((user) => {
      const name = user.name?.toLowerCase() || ""
      const email = user.email?.toLowerCase() || ""
      return name.includes(term) || email.includes(term)
    })
  }, [pendingUsers, query])

  const handleReRequest = async (userId: string) => {
    if (!cluster) return
    try {
      setReRequesting(userId)
      const res = await fetch(`/api/clusters/${cluster.id}/reinvite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to resend invitation")
      }

      toast.success("Invitation re-sent")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend invitation")
    } finally {
      setReRequesting(null)
    }
  }

  if (!cluster) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] p-4 sm:w-[420px] sm:max-w-[420px] sm:p-6">
        <DialogHeader className="text-left">
          <DialogTitle>Pending Invitations</DialogTitle>
          <DialogDescription>
            Invitations awaiting a response for {cluster.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3">
            <IconSearch className="size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or email"
              className="h-8 border-0 px-0 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
        <div className="max-h-[360px] overflow-y-auto mt-4">
          {loading ? (
            <PendingInvitesDialogSkeleton count={3} />
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No pending invitations found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const displayName = user.name || user.email || "Pending user"
                const initials = displayName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()

                return (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 rounded-lg border border-border/60 px-3 py-2 sm:flex-row sm:items-center"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.image || undefined} alt={displayName} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{displayName}</p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReRequest(user.id)}
                      disabled={reRequesting === user.id}
                      className="w-full shrink-0 sm:w-auto sm:self-center"
                    >
                      <IconMail className="size-4 mr-1" />
                      {reRequesting === user.id ? "Sending..." : "Re-request"}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
