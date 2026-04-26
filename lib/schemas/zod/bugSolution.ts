import { z } from "zod"
import { getAttachmentSchema, getLinksSchema, PRIORITY_ENUM, STRING_VALIDATIONS } from "./shared"

export function getBugSolutionSchema() {
  return z.object({
    title: z.string()
      .min(STRING_VALIDATIONS.title.min, STRING_VALIDATIONS.title.minMessage)
      .max(STRING_VALIDATIONS.title.max, STRING_VALIDATIONS.title.maxMessage),
    description: z.string()
      .min(STRING_VALIDATIONS.description.min, STRING_VALIDATIONS.description.minMessage)
      .max(STRING_VALIDATIONS.description.max, STRING_VALIDATIONS.description.maxMessage),
    solution_type: z.enum(["bug_fix", "feature_request", "improvement", "documentation", "refactoring", "performance"]),
    priority: z.enum(PRIORITY_ENUM),
    status: z.enum(["draft", "ready_for_review", "in_progress", "testing", "completed"]),
    assignee: z.string()
      .max(100, "Assignee must be less than 100 characters")
      .optional(),
    estimated_hours: z.string()
      .refine((val) => {
        if (!val) return true // Optional field
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0 && num <= 1000
      }, "Estimated hours must be a valid number between 0 and 1000")
      .optional(),
    links: getLinksSchema(),
    attachments: getAttachmentSchema(),
  })
}

export const getBugSolutionValidationSchema = getBugSolutionSchema
