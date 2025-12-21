"use server"

import { auth } from "@/auth"
import { supabase, ensureValidUUID, handleFileUploads, parseArrayField } from "@/lib/core"
import { getBugSolutionSchema } from "@/lib/schemas/zod/bugSolution"
import { type SolutionPayload } from "@/lib/types/bugSolution"

export async function createBugSolution(formData: FormData, bugId: string) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Extract form data
    const title = (formData.get('title') as string) || ''
    const description = (formData.get('description') as string) || ''
    const solution_type = (formData.get('solution_type') as string) || ''
    const priority = (formData.get('priority') as string) || 'medium'
    const status = (formData.get('status') as string) || 'draft'
    const assignee = formData.get('assignee') as string | null
    const estimated_hours = formData.get('estimated_hours') as string | null
    const links = formData.get('links') as string | null
    
    // Early validation to prevent storing error messages as data
    if (!title.trim()) {
      return { success: false, error: "Title is required" }
    }
    if (!description.trim()) {
      return { success: false, error: "Description is required" }
    }
    if (!solution_type) {
      return { success: false, error: "Solution type is required" }
    }

    // Additional safety check to prevent error messages from being stored as data
    if (title.includes("Missing required fields") || description.includes("Missing required fields")) {
      return { success: false, error: "Invalid form data detected" }
    }
    
    // Parse links using centralized utility
    const parsedLinks = parseArrayField(links)

    // Handle attachments using centralized utility
    const formDataObj: any = {}
    for (const [key, value] of formData.entries()) {
      formDataObj[key] = value
    }
    const attachment_urls = await handleFileUploads(formDataObj, 'solutions')

    // Additional validation for field lengths
    if (title.trim().length < 3) {
      return { success: false, error: "Title must be at least 3 characters" }
    }
    if (description.trim().length < 3) {
      return { success: false, error: "Description must be at least 3 characters" }
    }
    if (title.trim().length > 100) {
      return { success: false, error: "Title must be less than 100 characters" }
    }
    if (description.trim().length > 2000) {
      return { success: false, error: "Description must be less than 2000 characters" }
    }

    // Validate optional fields
    if (assignee && assignee.length > 100) {
      return { success: false, error: "Assignee must be less than 100 characters" }
    }
    if (estimated_hours) {
      const hours = parseFloat(estimated_hours)
      if (isNaN(hours) || hours < 0 || hours > 1000) {
        return { success: false, error: "Estimated hours must be a valid number between 0 and 1000" }
      }
    }
    if (parsedLinks && parsedLinks.length > 5) {
      return { success: false, error: "Maximum 5 links allowed" }
    }

    // Insert into database using Supabase
    try {
      const solutionData = {
        bug_id: bugId,
        title: title.trim(),
        description: description.trim(),
        solution_type,
        priority,
        status,
        assignee,
        estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null,
        links: parsedLinks?.length ? parsedLinks : null,
        attachment_urls: attachment_urls.length ? attachment_urls : null,
        created_by: ensureValidUUID(session.user.id),
      }

      const { data, error } = await supabase
        .from('bug_solution_details')
        .insert(solutionData)
        .select()
        .single()

      if (error) {
        return { 
          success: false, 
          error: error.message || 'Failed to save solution',
          details: error.code || 'UNKNOWN_ERROR'
        }
      }

      return { 
        success: true, 
        solution: data 
      }
    } catch (sqlErr: any) {
      return { 
        success: false, 
        error: sqlErr?.message || 'Failed to save solution',
        details: sqlErr?.code || 'UNKNOWN_ERROR'
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Internal server error" 
    }
  }
}
