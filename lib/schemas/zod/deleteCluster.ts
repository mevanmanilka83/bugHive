import { z } from "zod"

export function getDeleteClusterValidationSchema() {
  return z.object({
    clusterId: z.string().uuid("Invalid cluster ID"),
  })
}
