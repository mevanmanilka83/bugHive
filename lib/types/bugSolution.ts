import { z } from "zod"
import { getBugSolutionSchema } from "../schemas/zod/bugSolution"

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
