import Link from "next/link"
import { auth } from "@/lib"
import { BugExploreList } from "@/components/bugs/BugExploreList"
import { Button } from "@/components/ui/button"
import { BugReportDialog } from "@/components/bugs/reports/BugReportDialog"
import { PublicPageLayout } from "@/components/PublicPageLayout"

export default async function Home() {
  const session = await auth()
  const userId = session?.user?.id ?? ""

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
  )
}
