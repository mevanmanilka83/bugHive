import Link from "next/link"
import { GalleryVerticalEnd, Tag } from "lucide-react"
import { auth } from "@/lib"
import { AppFooter } from "@/components/AppFooter"
import { HomeHeaderUser } from "@/components/HomeHeaderUser"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { SidebarPublicNav } from "@/components/SidebarPublicNav"
import { TagsList } from "@/components/tags/TagsList"

export default async function TagsPage() {
  const session = await auth()

  return (
    <main className="min-h-screen bg-muted/20 flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 pb-20 sm:px-4 md:pb-0">
        {/* Top navigation */}
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

        {/* Main content */}
        <div className="flex flex-1 gap-6 py-6">
          {/* Left sidebar */}
          <SidebarPublicNav
            active="tags"
            isAuthenticated={!!session}
            useAuthFallback
            className="hidden md:flex"
          />

          {/* Main content */}
          <section className="flex-1 min-w-0">
            <div className="rounded-lg border border-border/40 bg-card p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Tag className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold sm:text-2xl">All Tags</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Browse all tags used in public bug reports. Click a tag to filter bugs.
              </p>
            </div>

            <TagsList />
          </section>
        </div>

        <AppFooter />
      </div>
      <MobileBottomNav active="tags" isAuthenticated={!!session} useAuthFallback />
    </main>
  )
}
