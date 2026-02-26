import { ClusterVisibilityDefaults } from "@/components/features/settings/ClusterVisibilityDefaults"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"

export default function SettingsClusterVisibilityPage() {
  return (
    <SettingsSubpage
      title="Default cluster visibility"
      description="Choose the default visibility for new clusters you create."
    >
      <ClusterVisibilityDefaults />
    </SettingsSubpage>
  )
}
