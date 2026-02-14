import { ThemePicker } from "@/components/settings/ThemePicker"
import { SettingsSubpage } from "@/components/settings/SettingsSubpage"

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
