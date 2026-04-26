import { requireAuthForPage } from "@/lib"
import { ProfileForm } from "@/components/features/settings/ProfileForm"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"

export default async function DashboardSettingsProfilePage() {
  const session = await requireAuthForPage()
  const user = session.user

  return (
    <SettingsSubpage
      backHref="/dashboard/settings"
      title="Profile"
      description="Update your name and account information."
    >
      <ProfileForm user={user} />
    </SettingsSubpage>
  )
}
