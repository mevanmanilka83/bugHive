import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"
import { auth, getSingleRecord, ensureValidUUID, supabase } from "@/lib"
import { incrementViewCount } from "@/lib/views"
import { BugDetailsView } from "@/components/bugs/BugDetailsView"
import { RelatedBugsPanel } from "@/components/bugs/RelatedBugsPanel"
import { AppFooter } from "@/components/AppFooter"
import { HomeHeaderUser } from "@/components/HomeHeaderUser"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { SidebarPublicNav } from "@/components/SidebarPublicNav"
import { notFound, redirect } from "next/navigation"

export default async function ClusterBugDetailsPage({
  params,
}: {
  params: Promise<{ clusterId: string; bugId: string }>
}) {
  const session = await auth()
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

  // Allow unauthenticated access only for public clusters.
  // For private clusters, require the user to be owner or member.
  const { data: cluster, error } = await supabase
    .from("clusters")
    .select("id, owner_id, members, visibility")
    .eq("id", clusterId)
    .single()

  if (error || !cluster) {
    notFound()
  }

  const visibility = String(cluster.visibility || "private").toLowerCase()
  const userId = session?.user?.id ? ensureValidUUID(session.user.id) : null
  const isMember =
    !!userId && Array.isArray(cluster.members) && cluster.members.includes(userId)
  const isOwner = !!userId && cluster.owner_id === userId

  if (visibility !== "public" && !isOwner && !isMember) {
    redirect(
      `/auth/signin?callbackUrl=${encodeURIComponent(
        `/clusters/${clusterId}/bugs/${bugId}`,
      )}`,
    )
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

        <div className="flex flex-1 gap-0 py-6 md:gap-6">
          <SidebarPublicNav
            active="clusters"
            isAuthenticated={!!session}
            className="hidden md:flex md:shrink-0"
          />

          <section className="min-w-0 flex-1 basis-0">
            <Link
              href={`/clusters/${clusterId}`}
              className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
            >
              &larr; Back to Cluster
            </Link>
            <BugDetailsView bug={bug} userId={session?.user?.id} />
          </section>

          <aside className="hidden md:block md:w-[152px] lg:w-[164px] xl:w-[176px] shrink-0 border-l border-border/60 bg-muted/20 pl-3">
            <div className="sticky top-6">
              <RelatedBugsPanel bugId={bug.id} context="cluster" />
            </div>
          </aside>
        </div>

        <AppFooter />
      </div>
      <MobileBottomNav active="clusters" isAuthenticated={!!session} />
    </main>
  )
}
