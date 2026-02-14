import { requireAuthForPage } from "@/lib"
import { PasswordForm } from "@/components/settings/PasswordForm"
import { SettingsSubpage } from "@/components/settings/SettingsSubpage"

export default async function SettingsPasswordPage() {
  await requireAuthForPage()

  return (
    <SettingsSubpage
      title="Password"
      description="Change your password to keep your account secure."
    >
      <PasswordForm />
    </SettingsSubpage>
  )
}
