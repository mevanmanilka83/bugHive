import { z } from "zod"
import { getAttachmentSchema, PRIORITY_ENUM, STRING_VALIDATIONS } from "@/lib/schemas/zod/shared"

/**
 * Bug Report Validation Schema
 * 
 * Single source of truth for bug report validation.
 * Used by both server actions and client components.
 * Visibility is required only when cluster_id is not present.
 * 
 * Naming Convention: Primary export uses shorter name (getBugReportSchema)
 * Alias provided for backward compatibility (getBugReportValidationSchema)
 */
export function getBugReportSchema() {
  return z.object({
    title: z.string()
      .min(STRING_VALIDATIONS.title.min, STRING_VALIDATIONS.title.minMessage)
      .max(STRING_VALIDATIONS.title.max, STRING_VALIDATIONS.title.maxMessage),
    description: z.string()
      .min(5, "Description must be at least 5 characters")
      .max(STRING_VALIDATIONS.description.max, STRING_VALIDATIONS.description.maxMessage),
    priority: z.enum(PRIORITY_ENUM),
    visibility: z.enum(["private", "public"]).optional(),
    environment: z.string()
      .max(200, "Environment description must be less than 200 characters")
      .optional(),
    os: z.enum(["windows", "macos", "linux", "ios", "android", "other"])
      .optional(),
    expected_behavior: z.string()
      .min(3, "Expected behavior must be at least 3 characters")
      .max(1000, "Expected behavior must be less than 1000 characters")
      .optional(),
    actual_behavior: z.string()
      .min(3, "Actual behavior must be at least 3 characters")
      .max(1000, "Actual behavior must be less than 1000 characters")
      .optional(),
    steps_to_reproduce: z.string()
      .min(5, "Steps to reproduce must be at least 5 characters")
      .max(2000, "Steps to reproduce must be less than 2000 characters")
      .optional(),
    tags: z.array(z.string().min(1, "Tag cannot be empty").max(50, "Tag must be less than 50 characters"))
      .max(10, "Maximum 10 tags allowed")
      .optional(),
    sources: z.array(z.string().min(1, "Source cannot be empty").max(200, "Source must be less than 200 characters"))
      .max(5, "Maximum 5 sources allowed")
      .optional(),
    attachments: getAttachmentSchema(),
    cluster_id: z.string().uuid().optional(),
  }).refine(
    (data) => {
      // Visibility is required only when cluster_id is not present
      if (!data.cluster_id && !data.visibility) {
        return false
      }
      return true
    },
    {
      message: "Visibility is required for non-cluster bugs",
      path: ["visibility"],
    }
  )
}

// Alias for backward compatibility
export const getBugReportValidationSchema = getBugReportSchema
