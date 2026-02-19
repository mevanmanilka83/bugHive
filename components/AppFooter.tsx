import Link from "next/link"

export function AppFooter() {
  return (
    <footer className="mt-auto border-t bg-background">
      <div className="flex min-w-0 flex-col gap-2 px-3 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-0 sm:text-left">
        <span className="min-w-0 break-words">
          © {new Date().getFullYear()} BugHive. All rights reserved.
        </span>
        <span className="min-w-0 break-words flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:justify-end">
          <Link href="/terms" className="hover:text-foreground underline">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-foreground underline">
            Privacy Policy
          </Link>
          <span className="hidden sm:inline">·</span>
          <span>Built for sharing and solving real-world bugs.</span>
        </span>
      </div>
    </footer>
  )
}
