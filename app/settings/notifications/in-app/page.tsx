import { InAppNotificationPrefs } from "@/components/settings/InAppNotificationPrefs"
import { SettingsSubpage } from "@/components/settings/SettingsSubpage"

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
