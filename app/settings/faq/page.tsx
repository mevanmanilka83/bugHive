import { requireAuthForPage } from "@/lib"
import { SettingsSubpage } from "@/components/settings/SettingsSubpage"
import { FAQ_ITEMS } from "@/lib/faq"
import { FAQ } from "@/components/faq"

export default async function SettingsFaqPage() {
  await requireAuthForPage()

  return (
    <SettingsSubpage
      title="FAQ"
      description="Frequently asked questions about BugHive."
      showBackLink={false}
    >
      <FAQ faqItems={FAQ_ITEMS} />
    </SettingsSubpage>
  )
}
