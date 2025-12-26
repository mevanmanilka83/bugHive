import { z } from "zod"

/**
 * Validate data against a Zod schema and return standardized error response
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details?: any } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0]
      return {
        success: false,
        error: firstError?.message || "Validation failed",
        details: error.issues || []
      }
    }
    return {
      success: false,
      error: "Validation failed"
    }
  }
}
