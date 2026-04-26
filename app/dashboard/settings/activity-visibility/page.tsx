import { requireAuthForPage } from "@/lib"
import { ActivityVisibilitySettings } from "@/components/features/settings/ActivityVisibilitySettings"
import { getPrivacySettings } from "@/app/actions/privacy"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"

export default async function DashboardSettingsActivityVisibilityPage() {
  await requireAuthForPage()
  const privacySettings = await getPrivacySettings()

  return (
    <SettingsSubpage
      backHref="/dashboard/settings"
      title="Activity visibility"
      description="Control whether your activity on bugs and clusters is visible to others."
    >
      <ActivityVisibilitySettings showActivity={privacySettings.show_activity} />
    </SettingsSubpage>
  )
}
