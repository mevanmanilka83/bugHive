"use server"

import { ensureValidUUID, parseArrayField } from "@/lib/utils"
import { supabase } from "@/lib/shared/config/config"
import { handleFileUploads } from "@/lib/shared/s3Uploads"
import { requireAuth, type ActionResponse } from "@/lib/auth/helpers"
import { createErrorResponse, handleSupabaseError } from "@/app/actions/shared/errors"
import { validateWithSchema } from "@/app/actions/shared/validation"
import { getBugReportSchema } from "@/lib/schemas/zod/bugReport"

export async function createBugReport(formData: FormData): Promise<ActionResponse<{ bug?: any }>> {
  try {
    // Check authentication
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult
    }
    const { session } = authResult

    // Extract form data
    const cluster_id = formData.get('cluster_id') as string | null
    // Visibility is only required for non-cluster bugs
    const visibility = cluster_id ? null : ((formData.get('visibility') as string) || 'public')
    
    // Parse tags and sources using centralized utility
    const tags = parseArrayField(formData.get('tags') as string | null)
    const sources = parseArrayField(formData.get('sources') as string | null)

    // Prepare data for validation (excluding attachments which are handled separately)
    const validationData = {
      title: (formData.get('title') as string) || '',
      description: (formData.get('description') as string) || '',
      priority: (formData.get('priority') as string) || 'medium',
      visibility: visibility || undefined,
      environment: formData.get('environment') as string | null || undefined,
      expected_behavior: formData.get('expected_behavior') as string | null || undefined,
      actual_behavior: formData.get('actual_behavior') as string | null || undefined,
      steps_to_reproduce: formData.get('steps_to_reproduce') as string | null || undefined,
      tags,
      sources,
      attachments: [], // Will be validated separately
      cluster_id: cluster_id || undefined,
    }

    // Validate using Zod schema
    const validation = validateWithSchema(getBugReportSchema(), validationData)
    if (!validation.success) {
      return validation
    }

    // Handle attachments using centralized utility
    const formDataObj: any = {
      cluster_id: cluster_id || null
    }
    // Only include visibility if it's not a cluster bug
    if (!cluster_id && visibility) {
      formDataObj.visibility = visibility
    }
    
    // Copy all FormData entries, preserving File objects
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        formDataObj[key] = value
      } else {
        formDataObj[key] = value
      }
    }
    
    const attachment_urls = await handleFileUploads(formDataObj, 'bugs')

    // Insert into database using Supabase
    const bugData: any = {
      title: validation.data.title.trim(),
      description: validation.data.description.trim(),
      priority: validation.data.priority,
      environment: validation.data.environment || null,
      expected_behavior: validation.data.expected_behavior || null,
      actual_behavior: validation.data.actual_behavior || null,
      steps_to_reproduce: validation.data.steps_to_reproduce || null,
      tags: validation.data.tags || null,
      sources: validation.data.sources || null,
      attachments: attachment_urls.length ? attachment_urls : null,
      created_by: ensureValidUUID(session.user.id),
    }
    
    // Only set visibility for non-cluster bugs
    if (!cluster_id && validation.data.visibility) {
      bugData.visibility = validation.data.visibility
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
      return handleSupabaseError(error, 'Failed to save bug report')
    }

    return { 
      success: true, 
      bug: data 
    }
  } catch (error) {
    return createErrorResponse(error)
  }
}
