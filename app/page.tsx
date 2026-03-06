import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { auth } from "@/lib"
import { BugExploreList } from "@/components/features/bugs/BugExploreList"
import { Button } from "@/components/ui/button"
import { BugReportDialog } from "@/components/features/bugs/reports/BugReportDialog"
import { PublicPageLayout } from "@/components/layout/public/PublicPageLayout"

type HomeProps = { searchParams?: Promise<{ tag?: string }> }

export default async function Home({ searchParams }: HomeProps) {
  const session = await auth()
  const userId = session?.user?.id ?? ""
  const params = searchParams ? await searchParams : {}
  const initialTag = typeof params?.tag === "string" && params.tag.trim() ? params.tag.trim() : undefined

  return (
    <PublicPageLayout
      session={session}
      sidebarActive={initialTag ? "tags" : "public"}
      useAuthFallback
    >
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
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {session ? (
              <Button asChild variant="outline" className="px-4 sm:w-auto">
                <Link href="/unanswered">Unanswered Queue</Link>
              </Button>
            ) : null}
            {session ? (
              <BugReportDialog />
            ) : (
              <Button asChild className="px-4 sm:w-auto">
                <Link href="/auth/signin">Report Bug</Link>
              </Button>
            )}
          </div>
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
    </PublicPageLayout>
  )
}
