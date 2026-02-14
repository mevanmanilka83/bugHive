"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconLock, IconLoader2, IconEye, IconEyeOff } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { changePassword } from "@/app/actions/profile"
import { cn } from "@/lib/utils-client"

export function PasswordForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const result = await changePassword(formData)

    setIsSubmitting(false)

    if (result.success) {
      toast.success(result.message || "Password changed successfully")
      // Reset form
      e.currentTarget.reset()
      router.refresh()
    } else {
      toast.error(result.error || "Failed to change password")
      // Parse error for specific fields
      if (result.error?.includes("Current password")) {
        setErrors({ currentPassword: result.error })
      } else if (result.error?.includes("New password")) {
        setErrors({ newPassword: result.error })
      } else if (result.error?.includes("match")) {
        setErrors({ confirmPassword: result.error })
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-border/60 bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-5">Password management</p>
        <p>This app uses OAuth (e.g. GitHub) for sign-in. Changing a password for credentials-based
        accounts would require backend support. We recommend using an OAuth provider for authentication.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Current Password */}
        <div className="space-y-2.5">
          <Label htmlFor="currentPassword" className="flex items-center gap-2">
            <IconLock className="size-4 text-muted-foreground" />
            Current Password
          </Label>
          <div className="relative">
            <Input
              id="currentPassword"
              name="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Enter current password"
              required
              disabled
              className={cn("pr-10 bg-muted/50", errors.currentPassword && "border-destructive")}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled
            >
              {showCurrentPassword ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-destructive">{errors.currentPassword}</p>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-2.5">
          <Label htmlFor="newPassword" className="flex items-center gap-2">
            <IconLock className="size-4 text-muted-foreground" />
            New Password
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              name="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter new password"
              required
              disabled
              className={cn("pr-10 bg-muted/50", errors.newPassword && "border-destructive")}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled
            >
              {showNewPassword ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-destructive">{errors.newPassword}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Password must be at least 6 characters long.
          </p>
        </div>

        {/* Confirm New Password */}
        <div className="space-y-2.5">
          <Label htmlFor="confirmPassword" className="flex items-center gap-2">
            <IconLock className="size-4 text-muted-foreground" />
            Confirm New Password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              required
              disabled
              className={cn("pr-10 bg-muted/50", errors.confirmPassword && "border-destructive")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              disabled
            >
              {showConfirmPassword ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Action Buttons — same gap as content-to-divider for clean rhythm */}
        <div className="flex flex-wrap items-center gap-3 pt-10">
          <Button type="submit" disabled className="rounded-full">
            {isSubmitting && <IconLoader2 className="size-4 mr-2 animate-spin" />}
            Change password
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/settings")}
            disabled={isSubmitting}
            className="rounded-full font-semibold bg-background border-border hover:bg-muted/50"
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Security Tips — divider then section gap */}
      <div className="border-t border-border/60 pt-10">
        <h3 className="text-sm font-medium text-foreground mb-5">Password security tips</h3>
        <ul className="space-y-2.5 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Use a unique password that you don't use elsewhere</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Make it at least 12 characters long</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Include a mix of letters, numbers, and symbols</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary">•</span>
            <span>Consider using a password manager</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
