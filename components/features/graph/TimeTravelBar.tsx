"use client"

import * as React from "react"
import { History, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib"

export type TimeTravelBarProps = {
  /** 0–100 */
  percent: number
  onPercentChange: (percent: number) => void
  /** Sorted timestamps (ms) for milestone markers */
  milestones: number[]
  /** Min timestamp (ms) */
  minTime: number
  /** Max timestamp (ms) */
  maxTime: number
  /** Whether playback is active */
  isPlaying: boolean
  onPlayPause: () => void
  /** Playback speed: 1 = real-time, 1 second of animation = 1 hour of real time */
  playbackSpeed?: number
  className?: string
}

const GHOST_OPACITY = 0.18
const FADE_DURATION_MS = 400

export function timeToOpacity(
  nodeOrEdgeTime: number | null,
  selectedTime: number,
  ghostOpacity = GHOST_OPACITY
): number {
  if (!nodeOrEdgeTime || nodeOrEdgeTime <= 0) return 1
  if (nodeOrEdgeTime <= selectedTime) return 1
  return ghostOpacity
}

/** Playback: speed = seconds to complete full timeline (default 10) */
export function useTimeTravelPlayback(
  percent: number,
  onPercentChange: (p: number) => void,
  minTime: number,
  maxTime: number,
  speedSeconds = 10
) {
  const [isPlaying, setIsPlaying] = React.useState(false)
  const rafRef = React.useRef<number | null>(null)
  const lastRef = React.useRef<number>(0)
  const percentRef = React.useRef(percent)
  percentRef.current = percent

  const toggle = React.useCallback(() => {
    setIsPlaying((p) => !p)
  }, [])

  React.useEffect(() => {
    if (!isPlaying || maxTime <= minTime) return

    const durationSec = Math.max(1, speedSeconds)
    const animate = (now: number) => {
      const dt = (now - lastRef.current) / 1000
      lastRef.current = now
      const current = percentRef.current
      const deltaPercent = (100 / durationSec) * dt
      const next = Math.min(100, current + deltaPercent)
      percentRef.current = next
      onPercentChange(next)
      if (next < 100) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setIsPlaying(false)
      }
    }

    lastRef.current = performance.now()
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, minTime, maxTime, speedSeconds, onPercentChange])

  return { isPlaying, toggle }
}

export function TimeTravelBar({
  percent,
  onPercentChange,
  milestones,
  minTime,
  maxTime,
  isPlaying,
  onPlayPause,
  className,
}: TimeTravelBarProps) {
  const range = Math.max(maxTime - minTime, 1)
  const selectedTime = minTime + range * (percent / 100)
  const asOfDate = milestones.length > 0 ? new Date(selectedTime) : null

  return (
    <div
      className={cn(
        "shrink-0 border-t border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl px-4 py-3 flex flex-wrap items-center gap-3",
        className
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <History className="h-4 w-4" />
        <span>Time travel</span>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={onPlayPause}
        disabled={milestones.length === 0}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>

      <div className="flex-1 min-w-[120px] max-w-[400px] relative flex items-center">
        <input
          type="range"
          min={0}
          max={100}
          value={percent}
          onChange={(e) => onPercentChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-muted accent-primary cursor-pointer"
          aria-label="Slide back in time to see how the graph grew"
        />
        {/* Milestone markers */}
        {milestones.length > 0 &&
          milestones.map((t) => {
            const p = ((t - minTime) / range) * 100
            if (p <= 0 || p >= 100) return null
            return (
              <div
                key={t}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/60 border border-primary pointer-events-none"
                style={{ left: `${p}%`, marginLeft: -4 }}
                title={new Date(t).toLocaleString()}
              />
            )
          })}
      </div>

      <span className="text-xs text-muted-foreground tabular-nums min-w-[140px]">
        {percent === 100
          ? "Now (full graph)"
          : asOfDate
            ? `As of ${asOfDate.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : `${Math.round(percent)}% of timeline`}
      </span>
    </div>
  )
}
