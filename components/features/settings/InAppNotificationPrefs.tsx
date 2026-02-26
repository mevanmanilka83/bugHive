"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  getInAppBadgeEnabled,
  setInAppBadgeEnabled,
  getInAppCenterEnabled,
  setInAppCenterEnabled,
} from "@/lib/utils-client"
import { cn } from "@/lib/utils-client"

const rowClass =
  "flex items-center justify-between gap-4 py-3 px-0 border-b border-border/60 last:border-b-0"

export function InAppNotificationPrefs() {
  const [badge, setBadge] = React.useState(true)
  const [center, setCenter] = React.useState(true)

  React.useEffect(() => {
    setBadge(getInAppBadgeEnabled())
    setCenter(getInAppCenterEnabled())
  }, [])

  React.useEffect(() => {
    const onSync = () => {
      setBadge(getInAppBadgeEnabled())
      setCenter(getInAppCenterEnabled())
    }
    window.addEventListener("settings:notifications", onSync)
    return () => window.removeEventListener("settings:notifications", onSync)
  }, [])

  return (
    <div className="max-w-md">
      <div className={cn(rowClass)}>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">Badge count</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Show unread count on the notifications icon
          </div>
        </div>
        <Checkbox
          checked={badge}
          onCheckedChange={(v) => {
            const next = !!v
            setBadge(next)
            setInAppBadgeEnabled(next)
          }}
          aria-label="Badge count"
        />
      </div>
      <div className={cn(rowClass)}>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">Notification center</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Show in-app notifications in the notification center
          </div>
        </div>
        <Checkbox
          checked={center}
          onCheckedChange={(v) => {
            const next = !!v
            setCenter(next)
            setInAppCenterEnabled(next)
          }}
          aria-label="Notification center"
        />
      </div>
    </div>
  )
}
