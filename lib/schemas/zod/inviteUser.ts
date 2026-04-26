import { z } from "zod"

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
      return !!(data.inviteeEmail || data.inviteeUsername)
    },
    {
      message: "Email or username is required",
      path: ["inviteeEmail"],
    }
  )
}
