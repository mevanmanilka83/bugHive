import { requireAuthForPage } from "@/lib"
import { ProfileForm } from "@/components/features/settings/ProfileForm"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"

export default async function SettingsProfilePage() {
  const session = await requireAuthForPage()
  const user = session.user

  return (
    <SettingsSubpage
      title="Profile"
      description="Update your name and account information."
    >
      <ProfileForm user={user} />
    </SettingsSubpage>
  )
}
