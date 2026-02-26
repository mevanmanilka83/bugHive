import { InAppNotificationPrefs } from "@/components/features/settings/InAppNotificationPrefs"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"

export default function SettingsInAppNotificationsPage() {
  return (
    <SettingsSubpage
      title="In-app notifications"
      description="Badge and notification center behavior."
    >
      <InAppNotificationPrefs />
    </SettingsSubpage>
  )
}
