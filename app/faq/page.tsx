import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"
import { auth } from "@/lib"
import { HomeHeaderUser } from "@/components/HomeHeaderUser"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { SidebarPublicNav } from "@/components/SidebarPublicNav"
import { FAQClient } from "@/components/FAQClient"
import { FAQ_ITEMS } from "@/lib/faq"

export default async function FAQPage() {
  const session = await auth()

  return (
    <main className="min-h-screen bg-muted/20 flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 pb-20 sm:px-4 md:pb-0">
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
              {session && <HomeHeaderUser session={session} />}
            </div>
          </div>
        </header>

        <div className="flex flex-1 gap-6 py-6">
          <SidebarPublicNav active="public" isAuthenticated={!!session} className="hidden md:flex" />

          <section className="flex-1 min-w-0">
            <div className="rounded-lg border border-border/40 bg-card p-6 mb-6">
              <h1 className="mb-1 text-xl font-semibold sm:text-2xl">FAQ</h1>
              <p className="text-sm text-muted-foreground">
                Frequently asked questions about BugHive.
              </p>
            </div>
            <div className="rounded-lg border border-border/40 bg-card p-6">
              <FAQClient initialItems={FAQ_ITEMS} />
            </div>
          </section>
        </div>
      </div>

      <MobileBottomNav isAuthenticated={!!session} active="public" />
    </main>
  )
}
