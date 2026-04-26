import { requireAuthForPage, FAQ_ITEMS } from "@/lib"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"
import { FAQClient } from "@/components/features/faq/FAQClient"

export default async function DashboardSettingsFaqPage() {
  await requireAuthForPage()

  return (
    <SettingsSubpage
      backHref="/dashboard/settings"
      title="FAQ"
      description="Frequently asked questions about BugHive."
      showBackLink={false}
    >
      <FAQClient initialItems={FAQ_ITEMS} />
    </SettingsSubpage>
  )
}
