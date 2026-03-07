import Link from "next/link"
import { cn } from "@/lib"

interface SettingsSubpageProps {
  /** Link text and destination for back navigation */
  backHref?: string
  backLabel?: string
  /** When false, the "Back to Settings" link is hidden (e.g. for FAQ page) */
  showBackLink?: boolean
  /** Page title (e.g. "Profile", "Password") */
  title: string
  /** Short description under the title */
  description: string
  children: React.ReactNode
}

const defaultBack = { href: "/settings", label: "Settings" }

export function SettingsSubpage({
  backHref = defaultBack.href,
  backLabel = defaultBack.label,
  showBackLink = true,
  title,
  description,
  children,
}: SettingsSubpageProps) {
  return (
    <div className="max-w-2xl">
      {showBackLink && (
        <nav className="mb-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span aria-hidden>←</span>
            <span>Back to {backLabel}</span>
          </Link>
        </nav>
      )}
      <header className="rounded-lg border border-border/40 bg-card p-6 mb-6">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </header>
      <div className="rounded-lg border border-border/40 bg-card p-6">
        {children}
      </div>
    </div>
  )
}
