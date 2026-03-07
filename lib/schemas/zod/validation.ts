import { z } from "zod"

/**
 * Generic Zod validation helper
 *
 * Validates data against a Zod schema and returns a standardized result.
 *
 * Usage:
 * ```ts
 * const result = validateWithSchema(getBugReportSchema(), data)
 * if (!result.success) {
 *   return { success: false, error: result.error }
 * }
 * const validatedData = result.data
 * ```
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details?: z.ZodIssue[] } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0]
      return {
        success: false,
        error: firstError?.message || "Validation failed",
        details: error.issues || [],
      }
    }
    return {
      success: false,
      error: "Validation failed",
    }
  }
}
