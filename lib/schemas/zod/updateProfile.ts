import { z } from "zod"

/**
 * Validation schema for updating user profile
 */
export function getUpdateProfileValidationSchema() {
  return z.object({
    name: z.string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters")
      .trim(),
    email: z.string()
      .min(1, "Email is required")
      .email("Please enter a valid email address")
      .max(255, "Email must be less than 255 characters")
      .toLowerCase()
      .trim(),
  })
}

export type UpdateProfileInput = z.infer<ReturnType<typeof getUpdateProfileValidationSchema>>
