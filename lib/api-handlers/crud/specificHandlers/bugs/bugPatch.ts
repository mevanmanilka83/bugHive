/**
 * Bug PATCH Handler
 * 
 * Handles updating existing general bugs (without cluster_id):
 * - PATCH /api/bugs/[id] (when bug doesn't have cluster_id)
 * - Only allows updates to specified fields
 * - Validates field values
 * 
 * Note: For cluster-specific bugs, use clusterBugPatch handler
 */
import { extractRouteId, addTimestamps, ensureValidUUID } from "@/lib/utils"
import { getSingleRecord, updateRecord } from "@/lib/shared/database/database"
import { supabase } from "@/lib/shared/config/config"
import { createApiHandler } from "../../../handlerFactory"

// Helper: Get user's cluster IDs
async function getUserClusterIds(userId: string): Promise<Set<string>> {
  const userUuid = ensureValidUUID(userId)
  const clusterIds = new Set<string>()
  const { data: clusters } = await supabase.from('clusters').select('id, owner_id, members')
  if (clusters) {
    for (const cluster of clusters) {
      if (cluster.owner_id === userUuid || (cluster.members?.includes(userUuid))) {
        clusterIds.add(cluster.id)
      }
    }
  }
  return clusterIds
}

// Helper: Validate bug cluster access
async function validateBugClusterAccess(userId: string, bug: any): Promise<boolean> {
  if (!bug?.cluster_id) return true
  const userClusterIds = await getUserClusterIds(userId)
  return userClusterIds.has(bug.cluster_id)
}

/**
 * Fields that can be updated for general bugs
 */
const ALLOWED_UPDATE_FIELDS = [
  'status',
  'priority',
  'assigned_to',
  'title',
  'description',
  'visibility'
] as const

/**
 * Creates PATCH handler for general bugs
 * 
 * Features:
 * - Only allows updates to specified fields
 * - Prevents unauthorized field modifications
 * - Validates cluster access if bug has cluster_id (should use clusterBugPatch instead)
 * - Automatically updates timestamps
 */
export const createBugPatchHandler = () => 
  createApiHandler(async (request, context, authResult) => {
    if (!authResult?.user?.id) {
      throw new Error("Unauthorized")
    }

    const id = await extractRouteId(context)
    const body = await request.json().catch(() => ({}))

    // Get the existing bug
    const existingBug = await getSingleRecord('bugs', id)
    if (!existingBug) {
      throw new Error("Bug not found")
    }

    // Check if user is trying to close the bug
    if (body.status === 'closed') {
      const userUuid = ensureValidUUID(authResult.user.id)
      const bugCreatorId = existingBug.created_by ? ensureValidUUID(existingBug.created_by) : null
      
      // Only the creator can close the bug
      if (!bugCreatorId || bugCreatorId !== userUuid) {
        throw new Error("Only the bug creator can close this bug")
      }
    }

    // If bug has cluster_id, validate access (but prefer using clusterBugPatch)
    if (existingBug.cluster_id && authResult?.user?.id) {
      const hasAccess = await validateBugClusterAccess(authResult.user.id, existingBug)
      if (!hasAccess) {
        throw new Error("You don't have access to update this bug. Use cluster bug handler instead.")
      }
    }

    // Only allow updates to specified fields (no cluster_id for general bugs)
    const updateData: any = {}
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields to update")
    }

    // Update the bug
    const record = await updateRecord(
      'bugs',
      id,
      addTimestamps(updateData),
      'id'
    )
    
    return { bug: record }
  })
