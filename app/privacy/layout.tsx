import { auth } from "@/lib"
import { AppFooter } from "@/components/layout/app/AppFooter"
import { AppHeader } from "@/components/layout/app/AppHeader"

export default async function PrivacyLayout({
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
