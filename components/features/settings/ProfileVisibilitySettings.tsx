"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconCheck, IconWorld, IconLock, IconUsers } from "@tabler/icons-react"
import { toast } from "sonner"
import { updateProfileVisibility } from "@/app/actions/privacy"
import { type ProfileVisibility, PROFILE_VISIBILITY_LABELS } from "@/lib/schemas/zod"
import { cn } from "@/lib/utils-client"

interface ProfileVisibilitySettingsProps {
  currentVisibility: ProfileVisibility
}

const OPTIONS: { value: ProfileVisibility; icon: typeof IconWorld }[] = [
  { value: "public", icon: IconWorld },
  { value: "members_only", icon: IconUsers },
  { value: "private", icon: IconLock },
]

export function ProfileVisibilitySettings({ currentVisibility }: ProfileVisibilitySettingsProps) {
  const router = useRouter()
  const [selectedVisibility, setSelectedVisibility] = React.useState<ProfileVisibility>(currentVisibility)
  const [isUpdating, setIsUpdating] = React.useState(false)

  const handleSelect = async (visibility: ProfileVisibility) => {
    if (visibility === selectedVisibility || isUpdating) return
    setIsUpdating(true)
    setSelectedVisibility(visibility)
    const result = await updateProfileVisibility(visibility)
    setIsUpdating(false)
    if (result.success) {
      toast.success(result.message || "Profile visibility updated")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to update visibility")
      setSelectedVisibility(currentVisibility)
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border/60 bg-card p-1 max-w-md">
        <ul className="space-y-1">
          {OPTIONS.map(({ value, icon: Icon }) => {
            const isSelected = selectedVisibility === value
            return (
              <li key={value}>
                <button
                  type="button"
                  onClick={() => handleSelect(value)}
                  disabled={isUpdating}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-md px-4 py-3 text-left text-sm transition-all",
                    "hover:bg-muted/70 disabled:opacity-50 disabled:cursor-not-allowed",
                    isSelected 
                      ? "bg-primary/10 font-medium shadow-sm border border-primary/20" 
                      : "border border-transparent"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className={cn(
                      "size-4.5",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span>{PROFILE_VISIBILITY_LABELS[value]}</span>
                  </span>
                  {isSelected && <IconCheck className="size-5 text-primary shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-5">What this affects</p>
        <ul className="space-y-1.5 text-muted-foreground list-none">
          <li>• Your profile page and basic information</li>
          <li>• Your bug reports and solutions (when set to private)</li>
          <li>• Your cluster memberships (when set to private)</li>
          <li>• Search results and mentions across the platform</li>
        </ul>
      </div>
    </div>
  )
}
