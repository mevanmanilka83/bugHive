"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconEye, IconEyeOff, IconCheck } from "@tabler/icons-react"
import { toast } from "sonner"
import { updateActivityVisibility } from "@/app/actions/privacy"
import { cn } from "@/lib/utils-client"

interface ActivityVisibilitySettingsProps {
  showActivity: boolean
}

const OPTIONS = [
  { value: true as const, icon: IconEye, label: "Show my activity", description: "Others can see your contributions and participation on bugs and clusters" },
  { value: false as const, icon: IconEyeOff, label: "Hide my activity", description: "Your bug reports and cluster participation will not be shown to others" },
]

export function ActivityVisibilitySettings({ showActivity }: ActivityVisibilitySettingsProps) {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = React.useState<boolean>(showActivity)
  const [isUpdating, setIsUpdating] = React.useState(false)

  const handleSelect = async (value: boolean) => {
    if (value === selectedOption || isUpdating) return
    setIsUpdating(true)
    setSelectedOption(value)
    const result = await updateActivityVisibility(value)
    setIsUpdating(false)
    if (result.success) {
      toast.success(result.message || "Activity visibility updated")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to update activity visibility")
      setSelectedOption(showActivity)
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border/60 bg-card p-1 max-w-md">
        <ul className="space-y-1">
          {OPTIONS.map(({ value, icon: Icon, label }) => {
            const isSelected = selectedOption === value
            return (
              <li key={value.toString()}>
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
                    <span>{label}</span>
                  </span>
                  {isSelected && <IconCheck className="size-5 text-primary shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="pt-10">
        <div className="rounded-lg border border-border/60 bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
          <p>Hiding your activity does not remove existing content. It remains visible in bugs and clusters you have participated in, but will not be attributed to your profile.</p>
        </div>
      </div>
    </div>
  )
}
