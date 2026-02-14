import { z } from "zod"

/**
 * Profile visibility options
 */
export const ProfileVisibilityEnum = z.enum(["public", "private", "members_only"])
export type ProfileVisibility = z.infer<typeof ProfileVisibilityEnum>

/**
 * Validation schema for updating privacy settings
 */
export function getPrivacySettingsValidationSchema() {
  return z.object({
    profile_visibility: ProfileVisibilityEnum.default("public"),
    show_activity: z.boolean().default(true),
  })
}

export type PrivacySettingsInput = z.infer<ReturnType<typeof getPrivacySettingsValidationSchema>>

export const PROFILE_VISIBILITY_LABELS: Record<ProfileVisibility, string> = {
  public: "Public",
  private: "Private",
  members_only: "Members only",
}

export const PROFILE_VISIBILITY_DESCRIPTIONS: Record<ProfileVisibility, string> = {
  public: "Anyone can see your profile and contributions",
  private: "Only you can see your profile",
  members_only: "Only cluster members can see your profile",
}
