import { requireAuthForPage } from "@/lib"
import { ProfileVisibilitySettings } from "@/components/features/settings/ProfileVisibilitySettings"
import { getPrivacySettings } from "@/app/actions/privacy"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"

export default async function SettingsProfileVisibilityPage() {
  await requireAuthForPage()
  const privacySettings = await getPrivacySettings()

  return (
    <SettingsSubpage
      title="Profile visibility"
      description="Control who can see your profile and discover your account."
    >
      <ProfileVisibilitySettings currentVisibility={privacySettings.profile_visibility} />
    </SettingsSubpage>
  )
}
