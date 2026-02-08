export function AppFooter() {
  return (
    <footer className="mt-auto border-t bg-background">
      <div className="flex min-w-0 flex-col gap-2 px-3 py-4 text-center text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-0 sm:text-left">
        <span className="min-w-0 break-words">
          © {new Date().getFullYear()} BugHive. All rights reserved.
        </span>
        <span className="min-w-0 break-words">
          Built for sharing and solving real-world bugs.
        </span>
      </div>
    </footer>
  )
}
