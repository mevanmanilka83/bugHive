"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  getEmailInvitesEnabled,
  setEmailInvitesEnabled,
  getEmailJoinRequestsEnabled,
  setEmailJoinRequestsEnabled,
  getEmailMentionsEnabled,
  setEmailMentionsEnabled,
} from "@/lib/utils-client"
import { cn } from "@/lib/utils-client"

const rowClass =
  "flex items-center justify-between gap-4 py-3 px-0 border-b border-border/60 last:border-b-0"

export function EmailNotificationPrefs() {
  const [invites, setInvites] = React.useState(true)
  const [joinRequests, setJoinRequests] = React.useState(true)
  const [mentions, setMentions] = React.useState(true)

  React.useEffect(() => {
    setInvites(getEmailInvitesEnabled())
    setJoinRequests(getEmailJoinRequestsEnabled())
    setMentions(getEmailMentionsEnabled())
  }, [])

  React.useEffect(() => {
    const onSync = () => {
      setInvites(getEmailInvitesEnabled())
      setJoinRequests(getEmailJoinRequestsEnabled())
      setMentions(getEmailMentionsEnabled())
    }
    window.addEventListener("settings:notifications", onSync)
    return () => window.removeEventListener("settings:notifications", onSync)
  }, [])

  return (
    <div className="max-w-md">
      <div className={cn(rowClass)}>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">Cluster invites</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Email when someone invites you to a cluster
          </div>
        </div>
        <Checkbox
          checked={invites}
          onCheckedChange={(v) => {
            const next = !!v
            setInvites(next)
            setEmailInvitesEnabled(next)
          }}
          aria-label="Cluster invites"
        />
      </div>
      <div className={cn(rowClass)}>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">Join requests</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Email when someone requests to join your cluster
          </div>
        </div>
        <Checkbox
          checked={joinRequests}
          onCheckedChange={(v) => {
            const next = !!v
            setJoinRequests(next)
            setEmailJoinRequestsEnabled(next)
          }}
          aria-label="Join requests"
        />
      </div>
      <div className={cn(rowClass)}>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">Mentions</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Email when someone mentions you on a bug or solution
          </div>
        </div>
        <Checkbox
          checked={mentions}
          onCheckedChange={(v) => {
            const next = !!v
            setMentions(next)
            setEmailMentionsEnabled(next)
          }}
          aria-label="Mentions"
        />
      </div>
    </div>
  )
}
