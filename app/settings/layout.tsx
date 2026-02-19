import { requireAuthForPage } from "@/lib"
import { PublicPageLayout } from "@/components/PublicPageLayout"

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAuthForPage()

  return (
    <PublicPageLayout session={session} sidebarActive="settings">
      {children}
    </PublicPageLayout>
  )
}
