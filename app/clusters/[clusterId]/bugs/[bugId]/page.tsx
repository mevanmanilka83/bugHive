import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"
import { requireAuthForPage, getSingleRecord, ensureValidUUID } from "@/lib"
import { incrementViewCount } from "@/lib/views"
import { BugDetailsView } from "@/components/bugs/BugDetailsView"
import { RelatedBugsPanel } from "@/components/bugs/RelatedBugsPanel"
import { AppFooter } from "@/components/AppFooter"
import { HomeHeaderUser } from "@/components/HomeHeaderUser"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { SidebarPublicNav } from "@/components/SidebarPublicNav"
import { notFound } from "next/navigation"

export default async function ClusterBugDetailsPage({
  params,
}: {
  params: Promise<{ clusterId: string; bugId: string }>
}) {
  const session = await requireAuthForPage()
  const { clusterId, bugId } = await params
  const validatedBugId = ensureValidUUID(bugId)

  let bug: Awaited<ReturnType<typeof getSingleRecord>>
  try {
    bug = await getSingleRecord("bugs", validatedBugId)

    if (bug?.cluster_id !== clusterId) {
      notFound()
    }

    await incrementViewCount("bugs", validatedBugId)
  } catch {
    notFound()
  }

  return (
    <main className="min-h-screen bg-muted/20 flex flex-col">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-3 pb-20 sm:px-4 md:pb-0">
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

        <div className="flex flex-1 flex-col gap-6 py-6 md:grid md:grid-cols-[200px_minmax(0,1fr)_320px] md:items-start lg:grid-cols-[220px_minmax(0,1fr)_360px] xl:grid-cols-[240px_minmax(0,1fr)_380px]">
          <SidebarPublicNav
            active="clusters"
            isAuthenticated
            className="hidden md:flex"
          />

          <section className="min-w-0">
            <Link
              href={`/clusters/${clusterId}`}
              className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
            >
              &larr; Back to Cluster
            </Link>
            <BugDetailsView bug={bug} userId={session.user.id} />
          </section>

          <aside className="w-full min-w-0">
            <RelatedBugsPanel bugId={bug.id} context="cluster" />
          </aside>
        </div>

        <AppFooter />
      </div>
      <MobileBottomNav active="clusters" isAuthenticated />
    </main>
  )
}
