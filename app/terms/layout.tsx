import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"
import { AppFooter } from "@/components/AppFooter"

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-muted/20 flex flex-col">
      <header className="border-b bg-background shrink-0">
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold">BugHive</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to home
          </Link>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <AppFooter />
    </main>
  )
}
