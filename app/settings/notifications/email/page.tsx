import { EmailNotificationPrefs } from "@/components/features/settings/EmailNotificationPrefs"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"

export default function SettingsEmailNotificationsPage() {
  return (
    <SettingsSubpage
      title="Email notifications"
      description="Choose which events trigger an email: cluster invites, join requests, and mentions."
    >
      <EmailNotificationPrefs />
    </SettingsSubpage>
  )
}
