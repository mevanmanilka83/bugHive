"use server"

import { auth } from "@/auth"
import { supabase, ensureValidUUID, handleFileUploads, parseArrayField } from "@/lib/core"
import { getBugReportSchema, type BugPayload } from "@/lib/schemas/bugReport"

export async function createBugReport(formData: FormData) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Extract form data
    const title = (formData.get('title') as string) || ''
    const description = (formData.get('description') as string) || ''
    const priority = (formData.get('priority') as string) || 'medium'
    const visibility = (formData.get('visibility') as string) || 'team'
    const environment = formData.get('environment') as string | null
    const expected_behavior = formData.get('expected_behavior') as string | null
    const actual_behavior = formData.get('actual_behavior') as string | null
    const steps_to_reproduce = formData.get('steps_to_reproduce') as string | null
    const cluster_id = formData.get('cluster_id') as string | null
    
    // Parse tags and sources using centralized utility
    const tags = parseArrayField(formData.get('tags') as string | null)
    const sources = parseArrayField(formData.get('sources') as string | null)

    // Handle attachments using centralized utility
    const formDataObj: any = {}
    for (const [key, value] of formData.entries()) {
      formDataObj[key] = value
    }
    const attachment_urls = await handleFileUploads(formDataObj, 'bugs')

    // Basic validation for required fields
    if (!title.trim()) {
      return { success: false, error: "Title is required" }
    }
    if (!description.trim()) {
      return { success: false, error: "Description is required" }
    }
    if (title.trim().length < 3) {
      return { success: false, error: "Title must be at least 3 characters" }
    }
    if (description.trim().length < 5) {
      return { success: false, error: "Description must be at least 5 characters" }
    }
    if (title.trim().length > 100) {
      return { success: false, error: "Title must be less than 100 characters" }
    }
    if (description.trim().length > 2000) {
      return { success: false, error: "Description must be less than 2000 characters" }
    }

    // Validate optional fields
    if (environment && environment.length > 200) {
      return { success: false, error: "Environment description must be less than 200 characters" }
    }
    if (expected_behavior && expected_behavior.length > 1000) {
      return { success: false, error: "Expected behavior must be less than 1000 characters" }
    }
    if (actual_behavior && actual_behavior.length > 1000) {
      return { success: false, error: "Actual behavior must be less than 1000 characters" }
    }
    if (steps_to_reproduce && steps_to_reproduce.length > 2000) {
      return { success: false, error: "Steps to reproduce must be less than 2000 characters" }
    }
    if (tags && tags.length > 10) {
      return { success: false, error: "Maximum 10 tags allowed" }
    }
    if (sources && sources.length > 5) {
      return { success: false, error: "Maximum 5 sources allowed" }
    }

    // Insert into database using Supabase
    try {
      const bugData: any = {
        title: title.trim(),
        description: description.trim(),
        priority,
        visibility,
        environment,
        expected_behavior,
        actual_behavior,
        steps_to_reproduce,
        tags,
        sources,
        attachments: attachment_urls.length ? attachment_urls : null,
        created_by: ensureValidUUID(session.user.id),
      }

      // Add cluster_id if provided
      if (cluster_id) {
        bugData.cluster_id = ensureValidUUID(cluster_id)
      }

      const { data, error } = await supabase
        .from('bugs')
        .insert(bugData)
        .select()
        .single()

      if (error) {
        return { 
          success: false, 
          error: error.message || 'Failed to save bug report',
          details: error.code || 'UNKNOWN_ERROR'
        }
      }

      return { 
        success: true, 
        bug: data 
      }
    } catch (sqlErr: any) {
      return { 
        success: false, 
        error: sqlErr?.message || 'Failed to save bug report',
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
