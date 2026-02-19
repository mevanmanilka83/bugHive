import { auth } from "@/lib"
import { AppFooter } from "@/components/AppFooter"
import { AppHeader } from "@/components/AppHeader"

export default async function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  return (
    <main className="min-h-screen bg-muted/20 flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 sm:px-4">
        <AppHeader session={session} />
        <div className="flex-1">{children}</div>
        <AppFooter />
      </div>
    </main>
  )
}
