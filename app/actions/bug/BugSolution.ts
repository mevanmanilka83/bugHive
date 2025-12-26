"use server"

import { ensureValidUUID, parseArrayField, extractUsernameFromEmail } from "@/lib/utils"
import { supabase } from "@/lib/config"
import { handleFileUploads } from "@/lib/s3Uploads"
import { requireAuth, type ActionResponse } from "@/lib/auth/helpers"
import { createErrorResponse, handleSupabaseError } from "@/lib/errors"
import { validateWithSchema } from "@/lib/validation"
import { getBugSolutionSchema } from "@/lib/schemas/zod/bugSolution"

export async function createBugSolution(formData: FormData, bugId: string): Promise<ActionResponse<{ solution?: any }>> {
  try {
    // Check authentication
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult
    }
    const { session } = authResult // session is guaranteed to be AuthenticatedSession here

    // Extract form data
    const links = formData.get('links') as string | null

    // Prepare data for validation (links should be a string for validation)
    const validationData = {
      title: (formData.get('title') as string) || '',
      description: (formData.get('description') as string) || '',
      solution_type: (formData.get('solution_type') as string) || '',
      priority: (formData.get('priority') as string) || 'medium',
      status: (formData.get('status') as string) || 'draft',
      assignee: formData.get('assignee') as string | null || undefined,
      estimated_hours: formData.get('estimated_hours') as string | null || undefined,
      links: links || undefined, // Pass as string for validation
      attachments: [], // Will be validated separately
    }

    // Validate using Zod schema
    const validation = validateWithSchema(getBugSolutionSchema(), validationData)
    if (!validation.success) {
      return validation
    }

    // Handle attachments using centralized utility
    const formDataObj: any = {}
    for (const [key, value] of formData.entries()) {
      formDataObj[key] = value
    }
    const attachment_urls = await handleFileUploads(formDataObj, 'solutions')

    // Parse links from validated string to array for database
    const parsedLinks = validation.data.links ? parseArrayField(validation.data.links) : null

    // Insert into database using Supabase
    const solutionData = {
      bug_id: bugId,
      title: validation.data.title.trim(),
      description: validation.data.description.trim(),
      solution_type: validation.data.solution_type,
      priority: validation.data.priority,
      status: validation.data.status,
      assignee: validation.data.assignee || null,
      estimated_hours: validation.data.estimated_hours ? parseFloat(validation.data.estimated_hours) : null,
      links: parsedLinks && parsedLinks.length > 0 ? parsedLinks : null,
      attachment_urls: attachment_urls.length ? attachment_urls : null,
      created_by: ensureValidUUID(session.user.id),
    }

      const { data, error } = await supabase
        .from('bug_solution_details')
        .insert(solutionData)
        .select()
        .single()

      if (error) {
        return handleSupabaseError(error, 'Failed to save solution')
      }

      // Create notifications for cluster members if bug belongs to a cluster
      try {
        // Get the bug to check if it has a cluster_id
        const { data: bug } = await supabase
          .from('bugs')
          .select('id, cluster_id, title, created_by')
          .eq('id', bugId)
          .single()

        if (bug?.cluster_id) {
          // Get cluster members
          const { data: cluster } = await supabase
            .from('clusters')
            .select('id, members, name')
            .eq('id', bug.cluster_id)
            .single()

          if (cluster?.members && Array.isArray(cluster.members)) {
            const solutionCreatorId = ensureValidUUID(session.user.id)
            const solutionCreatorName = session.user.name || extractUsernameFromEmail(session.user.email) || 'Someone'
            const bugTitle = bug.title || 'Untitled Bug'

            // Create notifications for all cluster members except the solution creator
            const notifications = cluster.members
              .filter((memberId: string) => ensureValidUUID(memberId) !== solutionCreatorId)
              .map((memberId: string) => ({
                user_id: ensureValidUUID(memberId),
                type: 'solution_created',
                title: `New solution for "${bugTitle}"`,
                message: `${solutionCreatorName} provided a solution for bug "${bugTitle}" in cluster "${cluster.name}"`,
                cluster_id: bug.cluster_id,
                bug_id: bugId,
                read: false,
              }))

            if (notifications.length > 0) {
              await supabase
                .from('notifications')
                .insert(notifications)
            }
          }
        }
      } catch (notificationError) {
        // Don't fail solution creation if notification fails
        console.error('Failed to create notifications:', notificationError)
      }

      return { 
        success: true, 
        solution: data 
      }
  } catch (error) {
    return createErrorResponse(error)
  }
}

/**
 * Fetch all solutions for charting purposes
 */
export async function getAllSolutions(): Promise<ActionResponse<{ solutions: any[] }>> {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) {
      return { ...authResult, solutions: [] }
    }

    const { data, error } = await supabase
      .from('bug_solution_details')
      .select('id, created_at, bug_id')
      .order('created_at', { ascending: true })

    if (error) {
      return { 
        ...handleSupabaseError(error, 'Failed to fetch solutions'),
        solutions: []
      }
    }

    return { 
      success: true, 
      solutions: data || []
    }
  } catch (error) {
    return { 
      ...createErrorResponse(error),
      solutions: []
    }
  }
}

/**
 * Fetch solutions for bugs in a specific cluster
 */
export async function getSolutionsByCluster(clusterId: string): Promise<ActionResponse<{ solutions: any[] }>> {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) {
      return { ...authResult, solutions: [] }
    }

    // First get all bugs in this cluster
    const { data: bugs, error: bugsError } = await supabase
      .from('bugs')
      .select('id')
      .eq('cluster_id', clusterId)

    if (bugsError) {
      return { 
        ...handleSupabaseError(bugsError, 'Failed to fetch cluster bugs'),
        solutions: []
      }
    }

    if (!bugs || bugs.length === 0) {
      return { success: true, solutions: [] }
    }

    const bugIds = bugs.map(b => b.id)

    // Then get all solutions for those bugs
    const { data, error } = await supabase
      .from('bug_solution_details')
      .select('id, created_at, bug_id')
      .in('bug_id', bugIds)
      .order('created_at', { ascending: true })

    if (error) {
      return { 
        ...handleSupabaseError(error, 'Failed to fetch solutions'),
        solutions: []
      }
    }

    return { 
      success: true, 
      solutions: data || []
    }
  } catch (error) {
    return { 
      ...createErrorResponse(error),
      solutions: []
    }
  }
}

/**
 * Fetch solutions for bugs created by a specific user
 */
export async function getSolutionsByUser(userId: string): Promise<ActionResponse<{ solutions: any[] }>> {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) {
      return { ...authResult, solutions: [] }
    }

    // First get all bugs created by this user
    const { data: bugs, error: bugsError } = await supabase
      .from('bugs')
      .select('id')
      .eq('created_by', userId)

    if (bugsError) {
      return { 
        ...handleSupabaseError(bugsError, 'Failed to fetch user bugs'),
        solutions: []
      }
    }

    if (!bugs || bugs.length === 0) {
      return { success: true, solutions: [] }
    }

    const bugIds = bugs.map(b => b.id)

    // Then get all solutions for those bugs
    const { data, error } = await supabase
      .from('bug_solution_details')
      .select('id, created_at, bug_id')
      .in('bug_id', bugIds)
      .order('created_at', { ascending: true })

    if (error) {
      return { 
        ...handleSupabaseError(error, 'Failed to fetch solutions'),
        solutions: []
      }
    }

    return { 
      success: true, 
      solutions: data || []
    }
  } catch (error) {
    return { 
      ...createErrorResponse(error),
      solutions: []
    }
  }
}
