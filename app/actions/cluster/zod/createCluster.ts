import { z } from "zod"

/**
 * Cluster Creation Validation Schema
 * 
 * Validates cluster creation data for server actions.
 */
export function getCreateClusterValidationSchema() {
  return z.object({
    name: z.string()
      .min(3, "Cluster name must be at least 3 characters")
      .max(100, "Cluster name must be less than 100 characters")
      .trim(),
    description: z.string()
      .max(2000, "Description must be less than 2000 characters")
      .trim()
      .optional()
      .nullable(),
  })
}
