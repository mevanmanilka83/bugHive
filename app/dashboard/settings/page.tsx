import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"
import { SettingsContent } from "@/components/features/settings/SettingsContent"

export default function DashboardSettingsPage() {
  return (
    <SettingsSubpage
      showBackLink={false}
      title="Settings"
      description="Account, privacy, notifications, and display preferences."
    >
      <SettingsContent basePath="/dashboard/settings" />
    </SettingsSubpage>
  )
}
