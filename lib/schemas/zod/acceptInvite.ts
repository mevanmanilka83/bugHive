import { z } from "zod"

export function getAcceptInviteValidationSchema() {
  return z.object({
    clusterId: z.string().uuid("Invalid cluster ID"),
  })
}
