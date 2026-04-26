import { LanguagePicker } from "@/components/features/settings/LanguagePicker"
import { SettingsSubpage } from "@/components/features/settings/SettingsSubpage"

export default function DashboardSettingsLanguagePage() {
  return (
    <SettingsSubpage
      backHref="/dashboard/settings"
      title="Language"
      description="App language and locale. UI strings will follow this preference where available."
    >
      <LanguagePicker />
    </SettingsSubpage>
  )
}
