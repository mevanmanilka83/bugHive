import { requireAuthForPage } from "@/lib"
import { PasswordForm } from "@/components/settings/PasswordForm"
import { SettingsSubpage } from "@/components/settings/SettingsSubpage"

export default async function SettingsPasswordPage() {
  const session = await requireAuthForPage()
  const provider = (session.user as { provider?: string }).provider ?? undefined

  return (
    <SettingsSubpage
      title="Password"
      description="Change your password to keep your account secure."
    >
      <PasswordForm authProvider={provider} />
    </SettingsSubpage>
  )
}
