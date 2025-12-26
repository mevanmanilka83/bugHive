/**
 * Validation Utilities
 * 
 * Single source of truth for all validation logic.
 * Use Zod schemas from @/lib/schemas/zod for type-safe validation.
 */

import { z } from "zod"

/**
 * Validate data against a Zod schema and return standardized response
 * 
 * Usage:
 * ```ts
 * const result = validateWithSchema(mySchema, data)
 * if (!result.success) {
 *   return { success: false, error: result.error }
 * }
 * const validatedData = result.data
 * ```
 * 
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Success result with data or error result with message and details
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
