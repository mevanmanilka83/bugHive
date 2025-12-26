import { z } from "zod"

/**
 * Accept Invite Validation Schema
 * 
 * Validates cluster invite acceptance data.
 */
export function getAcceptInviteValidationSchema() {
  return z.object({
    clusterId: z.string().uuid("Invalid cluster ID"),
  })
}
