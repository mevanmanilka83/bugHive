import { ThemePicker } from "@/components/features/settings/ThemePicker"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"

export default function SettingsThemePage() {
  return (
    <SettingsSubpage
      title="Theme"
      description="Choose light, dark, or follow your system preference."
    >
      <ThemePicker />
    </SettingsSubpage>
  )
}
