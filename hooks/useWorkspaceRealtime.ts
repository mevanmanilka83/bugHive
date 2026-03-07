"use client"

import * as React from "react"
import type { Node, Edge } from "@xyflow/react"
import { getSupabaseBrowser } from "@/lib/realtime/supabaseBrowser"

export type PresenceUser = {
  userId: string
  userName: string
  cursor: { x: number; y: number } | null
}

type UseWorkspaceRealtimeOptions = {
  workspaceId: string
  userId: string
  userName: string
  nodes: Node[]
  edges: Edge[]
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
  enabled?: boolean
}

const CHANNEL_PREFIX = "workspace"
const BROADCAST_EVENT = "graph_sync"
const PRESENCE_KEY = "cursor"
const CURSOR_THROTTLE_MS = 80
const BROADCAST_DEBOUNCE_MS = 400

export function useWorkspaceRealtime({
  workspaceId,
  userId,
  userName,
  nodes,
  edges,
  setNodes,
  setEdges,
  enabled = true,
}: UseWorkspaceRealtimeOptions) {
  const [presence, setPresence] = React.useState<Map<string, PresenceUser>>(new Map())
  const channelRef = React.useRef<ReturnType<ReturnType<typeof getSupabaseBrowser>["channel"]> | null>(null)
  const lastBroadcastRef = React.useRef<string>("")
  const lastReceivedRef = React.useRef<string>("")
  const cursorThrottleRef = React.useRef<number | null>(null)
  const broadcastDebounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const trackCursor = React.useCallback(
    (x: number, y: number) => {
      if (!enabled || !channelRef.current) return
      const ch = channelRef.current
      ch.track({
        [PRESENCE_KEY]: { x, y },
        userId,
        userName,
      })
    },
    [enabled, userId, userName]
  )

  const trackCursorThrottled = React.useCallback(
    (x: number, y: number) => {
      if (!enabled) return
      if (cursorThrottleRef.current !== null) return
      cursorThrottleRef.current = window.setTimeout(() => {
        cursorThrottleRef.current = null
        trackCursor(x, y)
      }, CURSOR_THROTTLE_MS)
    },
    [enabled, trackCursor]
  )

  React.useEffect(() => {
    if (!enabled || !workspaceId) return

    const supabase = getSupabaseBrowser()
    if (!supabase) return

    const channelName = `${CHANNEL_PREFIX}:${workspaceId}`
    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    })

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        const next = new Map<string, PresenceUser>()
        for (const [key, presences] of Object.entries(state)) {
          const arr = presences as Array<{ userId?: string; userName?: string; cursor?: { x: number; y: number } }>
          const p = arr[0]
          if (p && p.userId && p.userId !== userId) {
            next.set(p.userId, {
              userId: p.userId,
              userName: p.userName || "Anonymous",
              cursor: p.cursor || null,
            })
          }
        }
        setPresence(next)
      })
      .on("broadcast", { event: BROADCAST_EVENT }, ({ payload }) => {
        const { nodes: remoteNodes, edges: remoteEdges, fromUserId } = payload as {
          nodes: Node[]
          edges: Edge[]
          fromUserId: string
        }
        if (fromUserId === userId) return
        const payloadStr = JSON.stringify({ nodes: remoteNodes, edges: remoteEdges })
        lastReceivedRef.current = payloadStr
        setNodes(remoteNodes)
        setEdges(remoteEdges)
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            [PRESENCE_KEY]: null,
            userId,
            userName,
          })
        }
      })

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [enabled, workspaceId, userId, userName, setNodes, setEdges])

  React.useEffect(() => {
    if (!enabled || !channelRef.current) return

    const payloadStr = JSON.stringify({ nodes, edges })
    if (payloadStr === lastReceivedRef.current) return
    if (payloadStr === lastBroadcastRef.current) return

    if (broadcastDebounceRef.current) {
      clearTimeout(broadcastDebounceRef.current)
    }

    broadcastDebounceRef.current = window.setTimeout(() => {
      broadcastDebounceRef.current = null
      if (!channelRef.current) return
      lastBroadcastRef.current = payloadStr
      channelRef.current.send({
        type: "broadcast",
        event: BROADCAST_EVENT,
        payload: { nodes, edges, fromUserId: userId },
      })
    }, BROADCAST_DEBOUNCE_MS)

    return () => {
      if (broadcastDebounceRef.current) {
        clearTimeout(broadcastDebounceRef.current)
      }
    }
  }, [enabled, nodes, edges, userId])

  return { presence, trackCursorThrottled }
}
