import { requireAuthForPage } from "@/lib"
import { PasswordForm } from "@/components/features/settings/PasswordForm"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"

export default async function DashboardSettingsPasswordPage() {
  const session = await requireAuthForPage()
  const provider = (session.user as { provider?: string }).provider ?? undefined

  return (
    <SettingsSubpage
      backHref="/dashboard/settings"
      title="Password"
      description="Change your password to keep your account secure."
    >
      <PasswordForm authProvider={provider} />
    </SettingsSubpage>
  )
}
