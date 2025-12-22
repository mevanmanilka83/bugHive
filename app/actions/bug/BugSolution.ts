"use server"

import { auth } from "@/auth"
import { supabase, ensureValidUUID, handleFileUploads, parseArrayField } from "@/lib/shared/shared"
import { getBugSolutionSchema } from "@/lib/schemas/zod/bugSolution"
import { type SolutionPayload } from "@/lib/schemas/types/bugSolution"

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
            const solutionCreatorName = session.user.name || session.user.email?.split('@')[0] || 'Someone'
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

/**
 * Fetch all solutions for charting purposes
 */
export async function getAllSolutions() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", solutions: [] }
    }

    const { data, error } = await supabase
      .from('bug_solution_details')
      .select('id, created_at, bug_id')
      .order('created_at', { ascending: true })

    if (error) {
      return { 
        success: false, 
        error: error.message || 'Failed to fetch solutions',
        solutions: []
      }
    }

    return { 
      success: true, 
      solutions: data || []
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Internal server error",
      solutions: []
    }
  }
}

/**
 * Fetch solutions for bugs in a specific cluster
 */
export async function getSolutionsByCluster(clusterId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", solutions: [] }
    }

    // First get all bugs in this cluster
    const { data: bugs, error: bugsError } = await supabase
      .from('bugs')
      .select('id')
      .eq('cluster_id', clusterId)

    if (bugsError) {
      return { 
        success: false, 
        error: bugsError.message || 'Failed to fetch cluster bugs',
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
        success: false, 
        error: error.message || 'Failed to fetch solutions',
        solutions: []
      }
    }

    return { 
      success: true, 
      solutions: data || []
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Internal server error",
      solutions: []
    }
  }
}

/**
 * Fetch solutions for bugs created by a specific user
 */
export async function getSolutionsByUser(userId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", solutions: [] }
    }

    // First get all bugs created by this user
    const { data: bugs, error: bugsError } = await supabase
      .from('bugs')
      .select('id')
      .eq('created_by', userId)

    if (bugsError) {
      return { 
        success: false, 
        error: bugsError.message || 'Failed to fetch user bugs',
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
        success: false, 
        error: error.message || 'Failed to fetch solutions',
        solutions: []
      }
    }

    return { 
      success: true, 
      solutions: data || []
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Internal server error",
      solutions: []
    }
  }
}
