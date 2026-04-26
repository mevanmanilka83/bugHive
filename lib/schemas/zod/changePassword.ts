import { z } from "zod"

export function getChangePasswordValidationSchema() {
  return z.object({
    currentPassword: z.string()
      .min(1, "Current password is required"),
    newPassword: z.string()
      .min(6, "New password must be at least 6 characters")
      .max(128, "New password must be less than 128 characters"),
    confirmPassword: z.string()
      .min(1, "Please confirm your new password"),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
}

export type ChangePasswordInput = z.infer<ReturnType<typeof getChangePasswordValidationSchema>>
