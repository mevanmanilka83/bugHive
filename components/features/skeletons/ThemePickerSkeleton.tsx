const THEME_LABELS: Record<"light" | "dark" | "system", string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
}

export function ThemePickerSkeleton() {
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
