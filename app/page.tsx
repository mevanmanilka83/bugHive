import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"
import { auth } from "@/lib"
import { BugExploreList } from "@/components/bugs/BugExploreList"
import { Button } from "@/components/ui/button"
import { BugReportDialog } from "@/components/bugs/reports/BugReportDialog"
import { HomeHeaderUser } from "@/components/HomeHeaderUser"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { SidebarPublicNav } from "@/components/SidebarPublicNav"

export default async function Home() {
  const session = await auth()
  const userId = session?.user?.id ?? ""

  return (
    <main className="min-h-screen bg-muted/20 flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 pb-20 sm:px-4 md:pb-0">
        {/* Top navigation – simple, public-friendly */}
        <header className="border-b bg-background">
          <div className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold leading-tight">BugHive</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <HomeHeaderUser session={session} />
          </div>
          </div>
        </header>

        {/* Main content – StackOverflow-like public bug list with left sidebar */}
        <div className="flex flex-1 gap-6 py-6">
          {/* Left sidebar (public navigation) */}
          <SidebarPublicNav
            active="public"
            isAuthenticated={!!session}
            useAuthFallback
            className="hidden md:flex"
          />

          {/* Main list column */}
          <section className="flex-1 min-w-0">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="mb-1 text-xl font-semibold sm:text-2xl">Newest Bugs</h1>
                <p className="text-sm text-muted-foreground">
                  Discover real bugs reported by the BugHive community.
                </p>
              </div>
              <div className="flex w-full justify-end sm:w-auto">
                {session ? (
                  <BugReportDialog />
                ) : (
                  <Button asChild className="rounded-full px-4 sm:w-auto">
                    <Link href="/auth/signin">
                      Report Bug
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <BugExploreList
              userId={userId}
              showTitle={false}
              showReportButton={false}
              currentUserName={session?.user?.name ?? session?.user?.email ?? undefined}
              currentUserImage={session?.user?.image ?? undefined}
            />
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t bg-background">
          <div className="flex flex-col gap-2 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} BugHive. All rights reserved.</span>
            <span>Built for sharing and solving real-world bugs.</span>
          </div>
        </footer>
      </div>
      <MobileBottomNav active="public" isAuthenticated={!!session} useAuthFallback />
    </main>
  )
}
