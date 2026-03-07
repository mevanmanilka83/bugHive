import { auth } from "@/lib"
import { FAQClient } from "@/components/features/faq/FAQClient"
import { PublicPageLayout } from "@/components/layout/public/PublicPageLayout"
import { FAQ_ITEMS } from "@/lib"

export default async function FAQPage() {
  const session = await auth()

  return (
    <PublicPageLayout session={session} sidebarActive="public" useAuthFallback>
      <div className="rounded-lg border border-border/40 bg-card p-6 mb-6">
        <h1 className="mb-1 text-xl font-semibold sm:text-2xl">FAQ</h1>
        <p className="text-sm text-muted-foreground">
          Frequently asked questions about BugHive.
        </p>
      </div>
      <div className="rounded-lg border border-border/40 bg-card p-6">
        <FAQClient initialItems={FAQ_ITEMS} />
      </div>
    </PublicPageLayout>
  )
}
