"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "@/lib/realtime/supabaseBrowser"

export function WorkspacesRealtimeSync({ userId }: { userId: string }) {
  const router = useRouter()

  React.useEffect(() => {
    const supabase = getSupabaseBrowser()
    if (!supabase || !userId) return

    const channel = supabase
      .channel("workspaces-list-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "saved_graphs",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, router])

  return null
}
