import { SettingsContent } from "@/components/features/settings/SettingsContent"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"

export default async function SettingsPage() {
  return (
    <SettingsSubpage
      showBackLink={false}
      title="Settings"
      description="Account, privacy, notifications, and display preferences."
    >
      <SettingsContent />
    </SettingsSubpage>
  )
}
