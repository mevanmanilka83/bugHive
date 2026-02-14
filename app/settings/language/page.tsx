import { LanguagePicker } from "@/components/settings/LanguagePicker"
import { SettingsSubpage } from "@/components/settings/SettingsSubpage"

export default function SettingsLanguagePage() {
  return (
    <SettingsSubpage
      title="Language"
      description="App language and locale. UI strings will follow this preference where available."
    >
      <LanguagePicker />
    </SettingsSubpage>
  )
}
