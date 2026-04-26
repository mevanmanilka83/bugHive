import { z } from "zod"

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

