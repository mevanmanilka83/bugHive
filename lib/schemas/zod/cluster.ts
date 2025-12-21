import { z } from "zod"

export function getClusterSchema() {
  return z.object({
    name: z.string()
      .min(3, "Cluster name must be at least 3 characters")
      .max(100, "Cluster name must be less than 100 characters"),
    description: z.string()
      .max(500, "Description must be less than 500 characters")
      .optional(),
  })
}
