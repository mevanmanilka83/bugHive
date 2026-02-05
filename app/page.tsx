import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"
import { auth } from "@/lib"
import { BugExploreList } from "@/components/bugs/BugExploreList"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const session = await auth()
  const userId = session?.user.id ?? ""

  return (
    <main className="min-h-screen bg-muted/20 flex flex-col">
      {/* Top navigation – simple, public-friendly */}
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold leading-tight">BugHive</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {session && (
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href="/auth/signin">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content – StackOverflow-like public bug list */}
      <section className="flex-1 mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-1 text-2xl font-semibold">Newest Bugs</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Discover real bugs reported by the BugHive community.
        </p>

        <BugExploreList userId={userId} showTitle={false} />
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} BugHive. All rights reserved.</span>
          <span>Built for sharing and solving real-world bugs.</span>
        </div>
      </footer>
    </main>
  )
}
