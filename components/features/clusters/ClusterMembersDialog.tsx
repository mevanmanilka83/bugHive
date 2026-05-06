"use client"

import * as React from "react"
import { IconUsers, IconCrown } from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ClusterMembersDialogSkeleton } from "@/components/features/skeletons/ClusterMembersDialogSkeleton"

interface ClusterMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cluster: any | null
}

interface MemberInfo {
  id: string
  email?: string
  name?: string
  image?: string
  isOwner: boolean
}

export function ClusterMembersDialog({ open, onOpenChange, cluster }: ClusterMembersDialogProps) {
  const [members, setMembers] = React.useState<MemberInfo[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    async function fetchMembers() {
      if (!cluster || !open) return

      try {
        setLoading(true)
        const memberIds = cluster.members || []
        const memberUsernames = cluster.members_usernames || []
        const ownerId = cluster.owner_id
        const ownerUsername = cluster.owner_username

        if (memberIds.length === 0) {
          setMembers([])
          return
        }

        try {
          await fetch(`/api/clusters/${cluster.id}/ensure-members`, {
            method: 'POST',
          })
        } catch (ensureError) {
        }

        try {
          const idsParam = memberIds.join(',')
          const res = await fetch(`/api/users/batch?ids=${idsParam}`)
          
          if (res.ok) {
            const data = await res.json()
            const users = data.users || []
            
            const userMap = new Map<string, { id: string; email?: string | null; name?: string | null; image?: string | null }>(
              users.map((u: any) => [u.id, u])
            )
            
            const memberData = memberIds.map((memberId: string, index: number) => {
              const user = userMap.get(memberId)
              const storedUsername = memberUsernames[index] || user?.name || (user?.email ? user.email.split('@')[0] : null) || null
              
              return {
                id: memberId,
                email: user?.email || null,
                name: storedUsername,
                image: user?.image || null,
                isOwner: memberId === ownerId,
              }
            })
            
            setMembers(memberData)
            return
          }
        } catch (batchError) {
        }

        const memberData = memberIds.map((memberId: string, index: number) => {
          const storedUsername = memberUsernames[index] || null
            return {
              id: memberId,
              email: null,
            name: storedUsername,
              image: null,
              isOwner: memberId === ownerId,
          }
        })

        setMembers(memberData)
      } catch (error) {
        setMembers([])
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [cluster, open])

  if (!cluster) return null

  const memberCount = cluster.members?.length || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconUsers className="size-5" />
            Cluster Members
          </DialogTitle>
          <DialogDescription>
            {memberCount} member{memberCount !== 1 ? 's' : ''} in {cluster.name}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <ClusterMembersDialogSkeleton count={3} />
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IconUsers className="size-12 mx-auto mb-2 opacity-50" />
              <p>No members found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const displayName = member.name || (member.email ? member.email.split('@')[0] : null) || "Pending User"
                
                let initials = 'U'
                if (member.name) {
                  const nameParts = member.name.split(' ')
                  if (nameParts.length > 1) {
                    initials = nameParts
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                  } else {
                    initials = member.name.slice(0, 2).toUpperCase()
                  }
                } else if (member.email) {
                  initials = member.email
                    .split('@')[0]
                    .slice(0, 2)
                    .toUpperCase()
                } else {
                  initials = member.id.replace(/-/g, '').slice(0, 2).toUpperCase()
                }

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.image || undefined} alt={displayName} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{displayName}</p>
                        {member.isOwner && (
                          <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <IconCrown className="size-3" />
                            Owner
                          </Badge>
                        )}
                      </div>
                    </div>
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

