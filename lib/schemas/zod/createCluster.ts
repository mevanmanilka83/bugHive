import { z } from "zod"

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

export const getCreateClusterValidationSchema = getClusterSchema
