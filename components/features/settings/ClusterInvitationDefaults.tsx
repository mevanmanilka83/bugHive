"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  getClusterInviteAllowAnyone,
  setClusterInviteAllowAnyone,
  getClusterInviteAutoAccept,
  setClusterInviteAutoAccept,
  cn,
} from "@/lib"

const rowClass =
  "flex items-center justify-between gap-4 py-3 px-0 border-b border-border/60 last:border-b-0"

export function ClusterInvitationDefaults() {
  const [allowAnyone, setAllowAnyone] = React.useState(true)
  const [autoAccept, setAutoAccept] = React.useState(false)

  React.useEffect(() => {
    setAllowAnyone(getClusterInviteAllowAnyone())
    setAutoAccept(getClusterInviteAutoAccept())
  }, [])

  React.useEffect(() => {
    const onSync = () => {
      setAllowAnyone(getClusterInviteAllowAnyone())
      setAutoAccept(getClusterInviteAutoAccept())
    }
    window.addEventListener("settings:clusters", onSync)
    return () => window.removeEventListener("settings:clusters", onSync)
  }, [])

  return (
    <div className="max-w-md">
      <div className={cn(rowClass)}>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">Allow invites from anyone</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Let any cluster owner invite you to their cluster
          </div>
        </div>
        <Checkbox
          checked={allowAnyone}
          onCheckedChange={(value) => {
            const next = !!value
            setAllowAnyone(next)
            setClusterInviteAllowAnyone(next)
          }}
          aria-label="Allow invites from anyone"
        />
      </div>
      <div className={cn(rowClass)}>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">Auto-accept invites</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Join clusters automatically when invited
          </div>
        </div>
        <Checkbox
          checked={autoAccept}
          onCheckedChange={(value) => {
            const next = !!value
            setAutoAccept(next)
            setClusterInviteAutoAccept(next)
          }}
          aria-label="Auto-accept invites"
        />
      </div>
    </div>
  )
}
