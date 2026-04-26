"use client"

import * as React from "react"
import { LevelProgress } from "@/components/leaderboard/LevelProgress"

interface HunterLevelProgressProps {
  points?: number | null
  size?: number
  className?: string
}

export function HunterLevelProgress({ points: initialPoints, size = 32, className }: HunterLevelProgressProps) {
  const [points, setPoints] = React.useState<number | null>(initialPoints ?? null)

  const fetchPoints = React.useCallback(() => {
    fetch("/api/users/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.user?.points != null && setPoints(data.user.points))
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    if (initialPoints != null) {
      setPoints(initialPoints)
      return
    }
    fetchPoints()
  }, [initialPoints, fetchPoints])

  React.useEffect(() => {
    const onXp = () => fetchPoints()
    window.addEventListener("hunter:xp", onXp)
    return () => window.removeEventListener("hunter:xp", onXp)
  }, [fetchPoints])

  if (points == null) return null

  return (
    <LevelProgress
      points={points}
      size={size}
      strokeWidth={2.5}
      className={className}
      showLabel={false}
    />
  )
}
