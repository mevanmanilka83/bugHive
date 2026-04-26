import { EmailNotificationPrefs } from "@/components/features/settings/EmailNotificationPrefs"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"

export default function DashboardSettingsEmailNotificationsPage() {
  return (
    <SettingsSubpage
      backHref="/dashboard/settings"
      title="Email notifications"
      description="Choose which events trigger an email: cluster invites, join requests, and mentions."
    >
      <EmailNotificationPrefs />
    </SettingsSubpage>
  )
}
