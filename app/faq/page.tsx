import { auth } from "@/lib"
import { AppFooter } from "@/components/AppFooter"
import { AppHeader } from "@/components/AppHeader"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { SidebarPublicNav } from "@/components/SidebarPublicNav"
import { FAQClient } from "@/components/FAQClient"
import { FAQ_ITEMS } from "@/lib/faq"

export default async function FAQPage() {
  const session = await auth()

  return (
    <main className="min-h-screen bg-muted/20 flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 pb-20 sm:px-4 md:pb-0">
        <AppHeader session={session} />

        <div className="flex flex-1 gap-6 py-6">
          <SidebarPublicNav active="public" isAuthenticated={!!session} useAuthFallback className="hidden md:flex md:shrink-0" />

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
        <AppFooter />
      </div>
      <MobileBottomNav isAuthenticated={!!session} active="public" useAuthFallback />
    </main>
  )
}
