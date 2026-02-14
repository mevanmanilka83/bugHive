"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { IconSun, IconMoon, IconDeviceDesktop, IconCheck } from "@tabler/icons-react"
import { cn } from "@/lib/utils-client"

type ThemeOption = "light" | "dark" | "system"

const THEME_LABELS: Record<ThemeOption, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
}

export function ThemePicker() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = (theme === "light" || theme === "dark" || theme === "system" ? theme : "light") as ThemeOption

  const handleSelect = (option: ThemeOption) => {
    setTheme(option)
  }

  if (!mounted) {
    return (
      <ul className="space-y-2 max-w-md">
        {(["light", "dark", "system"] as const).map((option) => (
          <li key={option}>
            <div className="flex w-full items-center justify-between gap-3 rounded-md px-4 py-3.5 border border-border/60 bg-muted/30 animate-pulse">
              <span className="text-sm text-muted-foreground">{THEME_LABELS[option]}</span>
            </div>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <ul className="space-y-2 max-w-md">
      {(["light", "dark", "system"] as const).map((option) => (
        <li key={option}>
          <button
            type="button"
            onClick={() => handleSelect(option)}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-md px-4 py-3.5 text-left text-sm transition-colors border",
              "hover:bg-muted/70 hover:border-muted-foreground/20",
              currentTheme === option
                ? "bg-muted/50 font-medium border-muted-foreground/30"
                : "border-border/60"
            )}
          >
            <span className="flex items-center gap-2.5">
              {option === "light" && <IconSun className="size-4 text-muted-foreground" />}
              {option === "dark" && <IconMoon className="size-4 text-muted-foreground" />}
              {option === "system" && <IconDeviceDesktop className="size-4 text-muted-foreground" />}
              {THEME_LABELS[option]}
            </span>
            {currentTheme === option && (
              <IconCheck className="size-4 text-primary shrink-0" />
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}
