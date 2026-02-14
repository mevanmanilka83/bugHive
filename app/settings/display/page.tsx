import Link from "next/link"
import { ClusterViewPicker } from "@/components/settings/ClusterViewPicker"

export default function SettingsDisplayPage() {
  return (
    <>
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        ← Back to Settings
      </Link>
      <div className="mb-6">
        <h1 className="mb-1.5 text-xl font-semibold sm:text-2xl">Cluster list view</h1>
        <p className="text-sm text-muted-foreground">
          Choose how clusters are displayed on the Teams & clusters page.
        </p>
      </div>
      <ClusterViewPicker />
    </>
  )
}
