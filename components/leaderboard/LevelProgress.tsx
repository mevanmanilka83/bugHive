"use client"

import * as React from "react"
import { getProgressToNextRank, cn } from "@/lib"

interface LevelProgressProps {
  points: number
  size?: number
  strokeWidth?: number
  className?: string
  showLabel?: boolean
}

export function LevelProgress({
  points,
  size = 36,
  strokeWidth = 3,
  className,
  showLabel = false,
}: LevelProgressProps) {
  const { percent, rankLabel } = getProgressToNextRank(points)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--icon-orange)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground"
          style={{ fontSize: Math.max(8, size / 4) }}
        >
          {percent}%
        </div>
      </div>
      {showLabel && (
        <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[60px]">
          {rankLabel}
        </span>
      )}
    </div>
  )
}
