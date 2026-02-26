import { ClusterViewPicker } from "@/components/features/settings/ClusterViewPicker"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"

export default function SettingsDisplayPage() {
  return (
    <SettingsSubpage
      title="Cluster list view"
      description="Choose how clusters are displayed on the Teams & clusters page."
    >
      <ClusterViewPicker />
    </SettingsSubpage>
  )
}
