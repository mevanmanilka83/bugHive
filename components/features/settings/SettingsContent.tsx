"use client"

import * as React from "react"
import Link from "next/link"
import { IconChevronRight } from "@tabler/icons-react"
import { getClusterViewMode, type ClusterViewMode, cn } from "@/lib"
import { SettingsContentSkeleton } from "@/components/features/skeletons/SettingsContentSkeleton"

const SECTION_HEADING =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-12 first:mt-0 mb-5"

const VIEW_MODE_LABELS: Record<ClusterViewMode, string> = {
  grid: "Grid",
  list: "List",
  compact: "Compact",
}

function SettingsSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className={SECTION_HEADING}>{title}</h2>
      {children}
    </section>
  )
}

const rowBaseClass =
  "flex items-center justify-between gap-4 py-3 px-0 border-b border-border/60 last:border-b-0 cursor-pointer hover:bg-muted/50 rounded-md px-2 -mx-2"

function SettingsRow({
  label,
  description,
  valueLabel,
  href,
  children,
  onClick,
}: {
  label: string
  description?: string
  /** Shown on the right before the chevron for navigation rows */
  valueLabel?: string
  /** When set, row navigates to this URL (same pattern as other settings rows) */
  href?: string
  children?: React.ReactNode
  onClick?: () => void
}) {
  const isNavRow = (!!href || !!onClick) && !children
  const right = (
    <div className="flex items-center gap-3 shrink-0">
      {valueLabel && (
        <span className="text-sm text-muted-foreground">{valueLabel}</span>
      )}
      <IconChevronRight className="size-4 text-muted-foreground" />
    </div>
  )

  if (href && isNavRow) {
    return (
      <Link
        href={href}
        className={cn(rowBaseClass)}
      >
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">{label}</div>
          {description && (
            <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
          )}
        </div>
        {right}
      </Link>
    )
  }

  if (onClick && isNavRow) {
    return (
      <div
        className={cn(rowBaseClass)}
        onClick={onClick}
        role="button"
      >
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">{label}</div>
          {description && (
            <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
          )}
        </div>
        {right}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-3 px-0 border-b border-border/60 last:border-b-0"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
        )}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  )
}

export function SettingsContent() {
  const [clusterViewMode, setStateViewMode] = React.useState<ClusterViewMode>("list")
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    setStateViewMode(getClusterViewMode())
    setIsLoading(false)
  }, [])

  React.useEffect(() => {
    const onSync = () => setStateViewMode(getClusterViewMode())
    window.addEventListener("settings:clusterViewMode", onSync)
    return () => window.removeEventListener("settings:clusterViewMode", onSync)
  }, [])

  if (isLoading) {
    return <SettingsContentSkeleton />
  }

  return (
    <div className="max-w-2xl p-6">
      <SettingsSection title="Account Settings">
        <SettingsRow
          label="Profile"
          description="Name, email, avatar"
          href="/settings/profile"
        />
        <SettingsRow
          label="Password"
          description="Change your password"
          href="/settings/password"
        />
      </SettingsSection>

      <SettingsSection title="Privacy & Visibility">
        <SettingsRow
          label="Profile visibility"
          description="Who can see your profile"
          href="/settings/profile-visibility"
        />
        <div className="mb-6">
          <SettingsRow
            label="Activity visibility"
            description="Show your activity on bugs and clusters"
            href="/settings/activity-visibility"
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Notification Preferences">
        <SettingsRow
          label="Email notifications"
          description="Cluster invites, join requests, mentions"
          href="/settings/notifications/email"
        />
        <div className="mb-6">
          <SettingsRow
            label="In-app notifications"
            description="Badge and notification center"
            href="/settings/notifications/in-app"
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Cluster Preferences">
        <SettingsRow
          label="Default cluster visibility"
          description="When creating a new cluster"
          href="/settings/clusters/visibility"
        />
        <SettingsRow
          label="Invitation defaults"
          description="How you receive cluster invites"
          href="/settings/clusters/invitations"
        />
      </SettingsSection>

      <SettingsSection title="Interface Preferences">
        <SettingsRow
          label="Theme"
          description="Light, dark, or system"
          href="/settings/theme"
        />
        <div className="mb-6">
          <SettingsRow
            label="Language"
            description="App language and locale"
            href="/settings/language"
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Display Preferences">
        <SettingsRow
          label="Cluster list view"
          description="How clusters are shown on Teams & clusters"
          valueLabel={VIEW_MODE_LABELS[clusterViewMode]}
          href="/settings/display"
        />
      </SettingsSection>
    </div>
  )
}
