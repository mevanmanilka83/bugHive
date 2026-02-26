"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"

interface NotificationBadgeProps {
  count: number
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  if (count === 0) return null

  return (
    <Badge 
      variant="destructive" 
      className="ml-auto h-5 min-w-5 px-1.5 text-xs"
    >
      {count > 99 ? '99+' : count}
    </Badge>
  )
}
