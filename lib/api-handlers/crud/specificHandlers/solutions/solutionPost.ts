/**
 * Solution POST Handler
 * 
 * Handles creating new solutions:
 * - POST /api/bugs/[id]/solutions
 * - Supports file uploads for solution attachments
 * - Creates notifications for cluster members when solution is created
 */
import { extractBugId, parseArrayField, supabase, ensureValidUUID, processFormDataWithUploads, validateRequiredFields, addTimestamps, insertRecord } from "@/lib/shared/shared"
import { createApiHandler } from "../../../handlerFactory"

/**
 * Creates POST handler for solutions
 * 
 * Features:
 * - Validates required fields
 * - Extracts bug_id from route parameters
 * - Supports file uploads (attachments)
 * - Uploads files to 'solutions' folder in S3
 * - Creates notifications for cluster members
 */
export const createSolutionPostHandler = () => 
  createApiHandler(async (request, context, authResult) => {
    if (!authResult?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Extract bug_id from route parameters (/api/bugs/[id]/solutions)
    const bugId = context?.params ? await extractBugId(context) : null
    if (!bugId) {
      throw new Error("Bug ID is required")
    }

    // Parse form data with file uploads
    const formData = await processFormDataWithUploads(request, 'solutions')
    
    // Validate required fields
    validateRequiredFields(formData, ['title', 'description', 'solution_type', 'priority', 'status'])

    const solutionData = addTimestamps({
      bug_id: bugId,
      title: formData.title?.trim() || formData.title,
      description: formData.description?.trim() || formData.description,
      solution_type: formData.solution_type,
      priority: formData.priority,
      status: formData.status,
      assignee: formData.assignee || null,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      links: parseArrayField(formData.links),
      attachment_urls: formData.attachments || null,
      created_by: ensureValidUUID(authResult.user.id),
    })

    const solution = await insertRecord('bug_solution_details', solutionData)

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
          const solutionCreatorId = ensureValidUUID(authResult.user.id)
          const solutionCreatorName = authResult.user.name || authResult.user.email?.split('@')[0] || 'Someone'
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

    return { solution }
  }, 201)
