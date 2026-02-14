"use client"

import * as React from "react"
import { addRecentlyViewedBug } from "@/lib/utils-client"

interface RecentlyViewedTrackerProps {
  bugId: string
  bugTitle: string
}

export function RecentlyViewedTracker({ bugId, bugTitle }: RecentlyViewedTrackerProps) {
  React.useEffect(() => {
    if (bugId && bugTitle !== undefined) {
      addRecentlyViewedBug({
        id: bugId,
        title: typeof bugTitle === "string" ? bugTitle.trim() || "Untitled bug" : "Untitled bug",
      })
    }
  }, [bugId, bugTitle])
  return null
}
