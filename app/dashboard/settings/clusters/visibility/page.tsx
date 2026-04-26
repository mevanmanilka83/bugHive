import { ClusterVisibilityDefaults } from "@/components/features/settings/ClusterVisibilityDefaults"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"

export default function DashboardSettingsClusterVisibilityPage() {
  return (
    <SettingsSubpage
      backHref="/dashboard/settings"
      title="Default cluster visibility"
      description="Choose the default visibility for new clusters you create."
    >
      <ClusterVisibilityDefaults />
    </SettingsSubpage>
  )
}
