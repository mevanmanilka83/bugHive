"use client"

import * as React from "react"
import { useReactFlow } from "@xyflow/react"
import type { PresenceUser } from "@/hooks/useWorkspaceRealtime"
import { cn } from "@/lib"

const CURSOR_COLORS = [
  "bg-rose-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-cyan-500",
]

function hashUserId(userId: string): number {
  let h = 0
  for (let i = 0; i < userId.length; i++) {
    h = (h << 5) - h + userId.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function WorkspacePresenceCursors({
  presence,
  viewportVersion = 0,
}: {
  presence: Map<string, PresenceUser>
  viewportVersion?: number
}) {
  const { flowToScreenPosition } = useReactFlow()
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [cursorPositions, setCursorPositions] = React.useState<Map<string, { x: number; y: number; userName: string; color: string }>>(new Map())

  React.useEffect(() => {
    if (presence.size === 0) {
      setCursorPositions(new Map())
      return
    }
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const next = new Map<string, { x: number; y: number; userName: string; color: string }>()

    presence.forEach((user, userId) => {
      if (!user.cursor) return
      const screen = flowToScreenPosition({ x: user.cursor.x, y: user.cursor.y })
      const x = screen.x - rect.left
      const y = screen.y - rect.top
      const color = CURSOR_COLORS[hashUserId(userId) % CURSOR_COLORS.length]
      next.set(userId, { x, y, userName: user.userName, color })
    })

    setCursorPositions(next)
  }, [presence, flowToScreenPosition, viewportVersion])

  if (cursorPositions.size === 0) return null

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-10"
      aria-hidden
    >
      {Array.from(cursorPositions.entries()).map(([userId, { x, y, userName, color }]) => (
        <div
          key={userId}
          className={cn(
            "absolute w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-75",
            color
          )}
          style={{
            left: x,
            top: y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <span
            className="absolute left-1/2 -translate-x-1/2 -top-6 whitespace-nowrap text-xs font-medium px-1.5 py-0.5 rounded bg-background/90 border shadow-sm"
            style={{ transform: "translate(-50%, 0)" }}
          >
            {userName}
          </span>
        </div>
      ))}
    </div>
  )
}
