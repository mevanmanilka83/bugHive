import { z } from "zod"

// Build the schema at runtime to avoid SSR issues with File in Node
export function getBugSolutionSchema() {
  const FileSchema = typeof window !== "undefined" && typeof File !== "undefined"
    ? z.instanceof(File)
    : z.any()

  return z.object({
    title: z.string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must be less than 100 characters"),
    description: z.string()
      .min(3, "Description must be at least 3 characters")
      .max(2000, "Description must be less than 2000 characters"),
    solution_type: z.enum(["bug_fix", "feature_request", "improvement", "documentation", "refactoring", "performance"]),
    priority: z.enum(["low", "medium", "high", "critical"]),
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
    links: z.string()
      .refine((val) => {
        if (!val) return true // Optional field
        const links = val.split(',').map(s => s.trim()).filter(Boolean)
        const urlRegex = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i
        return links.every((link) => urlRegex.test(link))
      }, "All links must be valid URLs starting with http(s)://")
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

export type SolutionPayload = z.infer<ReturnType<typeof getBugSolutionSchema>>

export type SolutionDialogErrors = { 
  title?: string
  description?: string
  solution_type?: string
  priority?: string
  status?: string
  assignee?: string
  estimated_hours?: string
  links?: string
  attachments?: string
}

export type SolutionFormData = {
  title: string
  description: string
  solution_type: string
  priority: string
  status: string
  assignee: string
  estimated_hours: string
  links: string
  attachments: File[]
}
