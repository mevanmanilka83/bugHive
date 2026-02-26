"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconUser, IconMail, IconLoader2, IconPhotoUp } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { updateProfile, uploadAvatar } from "@/app/actions/profile"
import { cn } from "@/lib/utils-client"

interface ProfileFormProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

const SECTION_LABEL =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5"
const SECTION_DIVIDER = "border-b border-border/60"

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(user.image ?? null)
  const avatarInputRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    setAvatarUrl(user.image ?? null)
  }, [user.image])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData)

    setIsSubmitting(false)

    if (result.success) {
      toast.success(result.message || "Profile updated successfully")
      router.refresh()
    } else {
      toast.error(result.error || "Failed to update profile")
      if (result.error?.includes("Name")) {
        setErrors({ name: result.error })
      } else if (result.error?.includes("email")) {
        setErrors({ email: result.error })
      }
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingAvatar(true)
    const formData = new FormData()
    formData.set("avatar", file)
    const result = await uploadAvatar(formData)
    setIsUploadingAvatar(false)
    e.target.value = ""
    if (result.success && result.imageUrl) {
      setAvatarUrl(result.imageUrl)
      toast.success(result.message ?? "Avatar updated.")
      router.refresh()
    } else {
      const message = !result.success && "error" in result ? result.error : "Failed to upload avatar."
      toast.error(message)
    }
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() || "U"

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* Section 1: Profile picture */}
        <section className={cn(SECTION_DIVIDER, "pb-8")}>
          <h2 className={SECTION_LABEL}>Profile picture</h2>
          <div className="flex items-center gap-5">
            <Avatar className="size-20 shrink-0">
              <AvatarImage src={avatarUrl ?? undefined} alt={user.name || "User"} />
              <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground mb-5">
                From your sign-in provider or upload below.
              </p>
              <input
                ref={avatarInputRef}
                type="file"
                name="avatar"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                aria-label="Upload avatar"
                onChange={handleAvatarChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
              >
                {isUploadingAvatar ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconPhotoUp className="size-4 mr-1.5" />
                )}
                {isUploadingAvatar ? "Uploading…" : "Upload avatar"}
              </Button>
            </div>
          </div>
        </section>

        {/* Section 2: Personal details */}
        <section className={cn(SECTION_DIVIDER, "pb-8 pt-10")}>
          <h2 className={SECTION_LABEL}>Personal details</h2>
          <div className="space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="name" className="flex items-center gap-2">
                <IconUser className="size-4 text-muted-foreground" />
                Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                defaultValue={user.name || ""}
                placeholder="Enter your name"
                required
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Displayed across the platform.
              </p>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="email" className="flex items-center gap-2">
                <IconMail className="size-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email || ""}
                placeholder="Enter your email"
                required
                disabled
                className="bg-muted/50"
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Email is linked to your sign-in provider and cannot be changed here.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Form actions */}
        <section className="pt-12" aria-label="Form actions">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isSubmitting} className="rounded-full">
              {isSubmitting && <IconLoader2 className="size-4 mr-2 animate-spin" />}
              Save changes
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
        </section>
      </form>

      {/* Section 4: Account information — secondary, read-only metadata */}
      <section
        className="mt-8 rounded-lg border border-border/50 bg-muted/20 px-6 py-6"
        aria-label="Account information"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-5">
          Account information
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>User ID</span>
          <code className="px-2 py-0.5 bg-muted/80 rounded font-mono text-foreground/80">
            {user.id}
          </code>
        </div>
      </section>
    </div>
  )
}
