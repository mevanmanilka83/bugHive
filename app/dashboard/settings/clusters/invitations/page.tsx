import { ClusterInvitationDefaults } from "@/components/features/settings/ClusterInvitationDefaults"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"

export default function DashboardSettingsClusterInvitationsPage() {
  return (
    <SettingsSubpage
      backHref="/dashboard/settings"
      title="Invitation defaults"
      description="Control how you receive cluster invitations."
    >
      <ClusterInvitationDefaults />
    </SettingsSubpage>
  )
}
