import { requireAuthForPage } from "@/lib"
import { SettingsSubpage } from "@/components/settings/SettingsSubpage"
import { FAQ_ITEMS } from "@/lib/faq"
import { FAQClient } from "@/components/FAQClient"

export default async function SettingsFaqPage() {
  await requireAuthForPage()

  return (
    <SettingsSubpage
      title="FAQ"
      description="Frequently asked questions about BugHive."
      showBackLink={false}
    >
      <FAQClient initialItems={FAQ_ITEMS} />
    </SettingsSubpage>
  )
}
