import { cn } from "@/lib/utils-client"

interface SettingsNoteProps {
  title?: string
  children: React.ReactNode
  className?: string
}

/**
 * Unified informational note for settings pages.
 * Spacing uses shared settings scale for consistent gaps.
 */
export function SettingsNote({ title, children, className }: SettingsNoteProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-muted/30 px-5 py-4 text-sm text-muted-foreground",
        className
      )}
    >
      {title && (
        <p className="font-medium text-foreground mb-5">{title}</p>
      )}
      <div className="[&_p]:mb-0 [&_p:last-child]:mb-0 [&_ul]:space-y-2 [&_ul]:mt-0">{children}</div>
    </div>
  )
}
