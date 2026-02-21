import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { auth } from "@/lib"
import { BugExploreList } from "@/components/bugs/BugExploreList"
import { Button } from "@/components/ui/button"
import { BugReportDialog } from "@/components/bugs/reports/BugReportDialog"
import { PublicPageLayout } from "@/components/PublicPageLayout"

type HomeProps = { searchParams?: Promise<{ tag?: string }> }

export default async function Home({ searchParams }: HomeProps) {
  const session = await auth()
  const userId = session?.user?.id ?? ""
  const params = searchParams ? await searchParams : {}
  const initialTag = typeof params?.tag === "string" && params.tag.trim() ? params.tag.trim() : undefined

  return (

    <PublicPageLayout session={session} sidebarActive="public" useAuthFallback>
      <div className="rounded-lg border border-border/40 bg-card p-6 mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
              <Link href="/auth/signin">Report Bug</Link>
            </Button>
          )}

    <main className="min-h-screen bg-muted/20 flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 pb-20 sm:px-4 md:pb-0">
        <AppHeader session={session} />

        <div className="flex flex-1 gap-6 py-6">
          <SidebarPublicNav
            active={initialTag ? "tags" : "public"}
            isAuthenticated={!!session}
            useAuthFallback
            className="hidden md:flex md:shrink-0"
          />

          {/* Main list column */}
          <section className="flex-1 min-w-0">
            {initialTag ? (
              <div className="mb-4">
                <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-foreground" asChild>
                  <Link href="/tags" className="inline-flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Tags
                  </Link>
                </Button>
              </div>
            ) : null}
            <div className="rounded-lg border border-border/40 bg-card p-6 mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="mb-1 text-xl font-semibold sm:text-2xl">
                  {initialTag ? `Bugs tagged with "${initialTag}"` : "Newest Bugs"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {initialTag
                    ? "Bugs filtered by this tag. Clear filters to see all."
                    : "Discover real bugs reported by the BugHive community."}
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

            <BugExploreList
              userId={userId}
              initialTag={initialTag}
              showTitle={false}
              showReportButton={false}
              currentUserName={session?.user?.name ?? session?.user?.email ?? undefined}
              currentUserImage={session?.user?.image ?? undefined}
            />
          </section>

        </div>
      </div>


      <BugExploreList
        userId={userId}
        showTitle={false}
        showReportButton={false}
        currentUserName={session?.user?.name ?? session?.user?.email ?? undefined}
        currentUserImage={session?.user?.image ?? undefined}
      />
    </PublicPageLayout>

      <MobileBottomNav active={initialTag ? "tags" : "public"} isAuthenticated={!!session} useAuthFallback />
    </main>

  )
}
