import { requireAuthForPage } from "@/lib"
import { ActivityVisibilitySettings } from "@/components/settings/ActivityVisibilitySettings"
import { getPrivacySettings } from "@/app/actions/privacy"
import { SettingsSubpage } from "@/components/settings/SettingsSubpage"

export default async function SettingsActivityVisibilityPage() {
  await requireAuthForPage()
  const privacySettings = await getPrivacySettings()

  return (
    <SettingsSubpage
      title="Activity visibility"
      description="Control whether your activity on bugs and clusters is visible to others."
    >
      <ActivityVisibilitySettings showActivity={privacySettings.show_activity} />
    </SettingsSubpage>
  )
}
