"use client"

import * as React from "react"
import { IconCheck } from "@tabler/icons-react"
import {
  getAppLocale,
  setAppLocale,
  getLocaleLabel,
  type AppLocale,
  cn,
} from "@/lib"

const LOCALES: AppLocale[] = ["en", "es", "fr", "de"]

export function LanguagePicker() {
  const [locale, setStateLocale] = React.useState<AppLocale>("en")

  React.useEffect(() => {
    setStateLocale(getAppLocale())
  }, [])

  React.useEffect(() => {
    const onSync = () => setStateLocale(getAppLocale())
    window.addEventListener("settings:locale", onSync)
    return () => window.removeEventListener("settings:locale", onSync)
  }, [])

  const handleSelect = (value: AppLocale) => {
    setStateLocale(value)
    setAppLocale(value)
  }

  return (
    <ul className="space-y-2 max-w-md">
      {LOCALES.map((option) => (
        <li key={option}>
          <button
            type="button"
            onClick={() => handleSelect(option)}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-md px-4 py-3.5 text-left text-sm transition-colors border",
              "hover:bg-muted/70 hover:border-muted-foreground/20",
              locale === option
                ? "bg-muted/50 font-medium border-muted-foreground/30"
                : "border-border/60"
            )}
          >
            <span>{getLocaleLabel(option)}</span>
            {locale === option && (
              <IconCheck className="size-4 text-primary shrink-0" />
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}
