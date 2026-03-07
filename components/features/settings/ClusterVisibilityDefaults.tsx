"use client"

import * as React from "react"
import { IconEye, IconEyeOff, IconCheck } from "@tabler/icons-react"
import {
  getClusterDefaultVisibility,
  setClusterDefaultVisibility,
  type ClusterVisibility,
  cn,
} from "@/lib"

const OPTIONS = [
  {
    value: "private" as const,
    icon: IconEyeOff,
    label: "Private by default",
    description: "New clusters are invite-only unless you change visibility",
  },
  {
    value: "public" as const,
    icon: IconEye,
    label: "Public by default",
    description: "New clusters allow join requests unless you change visibility",
  },
]

export function ClusterVisibilityDefaults() {
  const [selected, setSelected] = React.useState<ClusterVisibility>("private")

  React.useEffect(() => {
    setSelected(getClusterDefaultVisibility())
  }, [])

  React.useEffect(() => {
    const onSync = () => setSelected(getClusterDefaultVisibility())
    window.addEventListener("settings:clusters", onSync)
    return () => window.removeEventListener("settings:clusters", onSync)
  }, [])

  const handleSelect = (value: ClusterVisibility) => {
    setSelected(value)
    setClusterDefaultVisibility(value)
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border/60 bg-card p-1 max-w-md">
        <ul className="space-y-1">
          {OPTIONS.map(({ value, icon: Icon, label, description }) => {
            const isSelected = selected === value
            return (
              <li key={value}>
                <button
                  type="button"
                  onClick={() => handleSelect(value)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md px-4 py-3 text-left text-sm transition-all",
                    "hover:bg-muted/70",
                    isSelected
                      ? "bg-primary/10 font-medium shadow-sm border border-primary/20"
                      : "border border-transparent"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={cn("size-4.5", isSelected ? "text-primary" : "text-muted-foreground")} />
                    <span className="grid gap-1">
                      <span>{label}</span>
                      <span className="text-xs text-muted-foreground">{description}</span>
                    </span>
                  </span>
                  {isSelected && <IconCheck className="size-5 text-primary shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="rounded-lg border border-border/60 bg-muted/30 px-5 py-4 text-sm text-muted-foreground max-w-md">
        <p>This will be used as the default for new clusters you create.</p>
      </div>
    </div>
  )
}
