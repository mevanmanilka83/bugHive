import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"
import { IconBell, IconBug, IconHome2, IconSettings, IconTag, IconUsersGroup } from "@tabler/icons-react"
import { auth } from "@/lib"
import { BugExploreList } from "@/components/bugs/BugExploreList"
import { Button } from "@/components/ui/button"
import { BugReportDialog } from "@/components/bugs/reports/BugReportDialog"
import { HomeHeaderUser } from "@/components/HomeHeaderUser"
import { SidebarDashboardActions } from "@/components/SidebarDashboardActions"

export default async function Home() {
  const session = await auth()
  const userId = session?.user.id ?? ""

  return (
    <main className="min-h-screen bg-muted/20 flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4">
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
          <aside className="hidden w-52 shrink-0 flex-col justify-between text-sm text-muted-foreground md:flex">
            <nav className="space-y-1">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm hover:bg-muted"
              >
                <IconHome2 className="size-4" />
                <span>Home</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm font-medium text-foreground"
              >
                <IconBug className="size-4" />
                <span>Public bugs</span>
              </Link>
              <Link
                href={session ? "/mybugs" : "/auth/signin"}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm hover:bg-muted"
              >
                <IconBug className="size-4" />
                <span>My bugs</span>
              </Link>
              <Link
                href={session ? "/dashboard/bugs" : "/auth/signin"}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm hover:bg-muted"
              >
                <IconTag className="size-4" />
                <span>Tags</span>
              </Link>
              <Link
                href={session ? "/clusters" : "/auth/signin"}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm hover:bg-muted"
              >
                <IconUsersGroup className="size-4" />
                <span>Teams & clusters</span>
              </Link>
            </nav>
            <div className="mt-6">
              <nav className="space-y-1 mb-4">
                <Link
                  href={session ? "/notifications" : "/auth/signin"}
                  className="flex items-center gap-2 rounded-full px-3 py-2 text-sm hover:bg-muted"
                >
                  <IconBell className="size-4" />
                  <span>Notifications</span>
                </Link>
                <Link
                  href={session ? "/settings" : "/auth/signin"}
                  className="flex items-center gap-2 rounded-full px-3 py-2 text-sm hover:bg-muted"
                >
                  <IconSettings className="size-4" />
                  <span>Settings</span>
                </Link>
              </nav>
              <div className="border-t pt-4">
                <SidebarDashboardActions isAuthenticated={!!session} />
              </div>
            </div>
          </aside>

          {/* Main list column */}
          <section className="flex-1">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h1 className="mb-1 text-2xl font-semibold">Newest Bugs</h1>
                <p className="text-sm text-muted-foreground">
                  Discover real bugs reported by the BugHive community.
                </p>
              </div>
              <div className="hidden sm:block">
                {session ? (
                  <BugReportDialog />
                ) : (
                  <Button asChild className="rounded-full px-4">
                    <Link href="/auth/signin">
                      Report Bug
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <BugExploreList
              userId={userId}
              showTitle={false}
              currentUserName={session?.user?.name ?? session?.user?.email ?? undefined}
              currentUserImage={session?.user?.image ?? undefined}
            />
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
    </main>
  )
}
