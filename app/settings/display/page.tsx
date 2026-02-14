import { ClusterViewPicker } from "@/components/settings/ClusterViewPicker"
import { SettingsSubpage } from "@/components/settings/SettingsSubpage"

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
