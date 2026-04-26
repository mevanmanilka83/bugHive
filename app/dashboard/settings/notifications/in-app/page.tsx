import { InAppNotificationPrefs } from "@/components/features/settings/InAppNotificationPrefs"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"

export default function DashboardSettingsInAppNotificationsPage() {
  return (
    <SettingsSubpage
      backHref="/dashboard/settings"
      title="In-app notifications"
      description="Badge and notification center behavior."
    >
      <InAppNotificationPrefs />
    </SettingsSubpage>
  )
}
