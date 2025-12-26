import { z } from "zod"

/**
 * Signup Validation Schema
 * 
 * Validates user signup data for registration.
 * This is the single source of truth for signup validation.
 */
export function getSignupValidationSchema() {
  return z.object({
    name: z.string()
      .min(1, "Name is required")
      .max(100, "Name must be less than 100 characters")
      .trim(),
    email: z.string()
      .email("Invalid email format")
      .toLowerCase()
      .trim(),
    password: z.string()
      .min(6, "Password must be at least 6 characters")
      .max(128, "Password must be less than 128 characters"),
  })
}

