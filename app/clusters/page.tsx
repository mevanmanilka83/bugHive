import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"
import { auth } from "@/lib"
import { AppFooter } from "@/components/AppFooter"
import { HomeHeaderUser } from "@/components/HomeHeaderUser"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { SidebarPublicNav } from "@/components/SidebarPublicNav"
import { ClustersList } from "@/components/clusters/ClustersList"

export default async function ClustersPage() {
  const session = await auth()
  const isAuthenticated = !!session?.user?.id
  const userId = session?.user?.id

  return (
    <main className="min-h-screen bg-muted/20 flex flex-col">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-3 pb-20 sm:px-4 md:pb-0">
        {/* Top navigation – same as homepage */}
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
              <HomeHeaderUser session={session as any} />
            </div>
          </div>
        </header>

        {/* Main content – same sidebar as homepage, clusters in main area */}
        <div className="flex flex-1 gap-0 py-6 md:gap-6">
          <SidebarPublicNav
            active="clusters"
            isAuthenticated={isAuthenticated}
            className="hidden md:flex md:shrink-0"
          />

          <section className="min-w-0 flex-1 basis-0">
            <ClustersList
              userId={userId}
              isAuthenticated={isAuthenticated}
              basePath="/clusters"
              title="Team Clusters"
              description="Create and manage teams to collaborate on bugs."
            />
          </section>
        </div>

        <AppFooter />
      </div>
      <MobileBottomNav active="clusters" isAuthenticated={isAuthenticated} />
    </main>
  )
}
