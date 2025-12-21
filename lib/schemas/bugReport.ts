import { z } from "zod"

// Build the schema at runtime to avoid SSR issues with File in Node
export function getBugReportSchema() {
  const FileSchema = typeof window !== "undefined" && typeof File !== "undefined"
    ? z.instanceof(File)
    : z.any()

  return z.object({
    title: z.string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must be less than 100 characters"),
    description: z.string()
      .min(5, "Description must be at least 5 characters")
      .max(2000, "Description must be less than 2000 characters"),
    priority: z.enum(["low", "medium", "high", "critical"]),
    visibility: z.enum(["private", "team", "public"]),
    environment: z.string()
      .max(200, "Environment description must be less than 200 characters")
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
      .max(2000, "Steps to reproduce must be less than 2000 characters")
      .optional(),
    tags: z.array(z.string().min(1, "Tag cannot be empty").max(50, "Tag must be less than 50 characters"))
      .max(10, "Maximum 10 tags allowed")
      .optional(),
    sources: z.array(z.string().min(1, "Source cannot be empty").max(200, "Source must be less than 200 characters"))
      .max(5, "Maximum 5 sources allowed")
      .optional(),
    attachments: z.array(FileSchema)
      .refine((files) => {
        // Check file size (max 10MB each)
        return files.every((file) => file.size <= 10 * 1024 * 1024)
      }, "File size must be less than 10MB")
      .refine((files) => {
        // Check file type
        const allowedTypes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'text/plain', 'text/csv', 'application/json',
          'application/pdf', 'application/zip'
        ]
        return files.every((file) => allowedTypes.includes(file.type))
      }, "File type not supported")
      .refine((files) => {
        // Check total attachment count
        return files.length <= 5
      }, "Maximum 5 attachments allowed")
      .optional(),
  })
}

export type BugPayload = z.infer<ReturnType<typeof getBugReportSchema>>

export type BugDialogErrors = Record<string, string>

export type BugFormData = {
  title: string
  description: string
  priority: string
  visibility: string
  environment: string
  expectedBehavior: string
  actualBehavior: string
  stepsToReproduce: string
  tagsInput: string
  sourcesInput: string
  attachments: File[]
}


