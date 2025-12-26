import { z } from "zod"

/**
 * User Invitation Validation Schema
 * 
 * Validates user invitation data for cluster invites.
 * Either email or username must be provided.
 */
export function getInviteUserValidationSchema() {
  return z.object({
    clusterId: z.string().uuid("Invalid cluster ID"),
    inviteeEmail: z.string()
      .email("Invalid email address")
      .toLowerCase()
      .trim()
      .optional(),
    inviteeUsername: z.string()
      .min(1, "Username cannot be empty")
      .trim()
      .optional(),
  }).refine(
    (data) => {
      // Either email or username must be provided
      return !!(data.inviteeEmail || data.inviteeUsername)
    },
    {
      message: "Email or username is required",
      path: ["inviteeEmail"],
    }
  )
}
