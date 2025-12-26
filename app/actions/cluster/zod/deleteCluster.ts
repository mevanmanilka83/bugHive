import { z } from "zod"

/**
 * Delete Cluster Validation Schema
 * 
 * Validates cluster deletion data.
 */
export function getDeleteClusterValidationSchema() {
  return z.object({
    clusterId: z.string().uuid("Invalid cluster ID"),
  })
}
