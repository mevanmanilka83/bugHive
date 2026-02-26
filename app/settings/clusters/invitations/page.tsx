import { ClusterInvitationDefaults } from "@/components/features/settings/ClusterInvitationDefaults"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"

export default function SettingsClusterInvitationsPage() {
  return (
    <SettingsSubpage
      title="Invitation defaults"
      description="Control how you receive cluster invitations."
    >
      <ClusterInvitationDefaults />
    </SettingsSubpage>
  )
}
