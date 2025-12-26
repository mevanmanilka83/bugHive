import { z } from "zod"

/**
 * Login/Credentials Validation Schema
 * 
 * Validates login credentials for authentication.
 * This is the single source of truth for login validation.
 */
export function getLoginValidationSchema() {
  return z.object({
    email: z.string()
      .email("Invalid email format")
      .toLowerCase()
      .trim(),
    password: z.string()
      .min(1, "Password is required"),
  })
}

