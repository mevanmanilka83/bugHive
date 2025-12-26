import { z } from "zod"
import { getBugReportSchema } from "@/lib"

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
