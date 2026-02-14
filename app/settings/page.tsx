import { SettingsContent } from "@/components/settings/SettingsContent"

export default async function SettingsPage() {
  return (
    <>
      <div className="rounded-lg border border-border/40 bg-card p-6 mb-6">
        <h1 className="mb-0.5 text-xl font-semibold sm:text-2xl">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Account, privacy, notifications, and display preferences.
        </p>
      </div>
      <SettingsContent />
    </>
  )
}
