import Link from "next/link"
import { requireAuthForPage, getRecordOrNotFound, ensureValidUUID, incrementViewCount } from "@/lib"
import { AppSidebar } from "@/components/layout/app/AppSidebar"
import { PublicHeader } from "@/components/layout/public/PublicHeader"
import { BugDetailsView } from "@/components/features/bugs/BugDetailsView"
import { RelatedBugsPanel } from "@/components/features/bugs/RelatedBugsPanel"
import { GraphButton } from "@/components/features/bugs/GraphButton"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function DashboardBugDetailsPage({
  params,
}: {
  params: Promise<{ bugId: string }>
}) {
  const session = await requireAuthForPage()
  const user = session.user
  const { bugId } = await params
  const validatedBugId = ensureValidUUID(bugId)

  const bug = await getRecordOrNotFound("bugs", validatedBugId)
  await incrementViewCount("bugs", validatedBugId)

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <PublicHeader user={user} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
                  <div className="min-w-0">
                    <div className="mb-6 flex items-center justify-between">
                      <Link
                        href="/dashboard/bugs"
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        ← Back to Bug Explore
                      </Link>
                      <GraphButton bugId={bug.id} />
                    </div>
                    <BugDetailsView bug={bug} userId={user.id} />
                  </div>
                  <aside className="hidden lg:block">
                    <div className="sticky top-6">
                      <RelatedBugsPanel bugId={bug.id} />
                    </div>
                  </aside>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
