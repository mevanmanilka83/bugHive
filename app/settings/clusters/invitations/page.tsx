import { ClusterInvitationDefaults } from "@/components/settings/ClusterInvitationDefaults"
import { SettingsSubpage } from "@/components/settings/SettingsSubpage"

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
