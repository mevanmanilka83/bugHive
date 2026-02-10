import { z } from "zod"

/**
 * Cluster Creation Validation Schema
 * 
 * Single source of truth for cluster validation.
 * Used by both server actions and client components.
 * 
 * Naming Convention: Primary export uses shorter name (getClusterSchema)
 * Alias provided for backward compatibility (getCreateClusterValidationSchema)
 */
export function getClusterSchema() {
  return z.object({
    name: z.string()
      .min(3, "Cluster name must be at least 3 characters")
      .max(100, "Cluster name must be less than 100 characters")
      .trim(),
    visibility: z.enum(["private", "public"]).default("private"),
    description: z.string()
      .max(2000, "Description must be less than 2000 characters")
      .trim()
      .optional()
      .nullable(),
  })
}

// Alias for backward compatibility
export const getCreateClusterValidationSchema = getClusterSchema
