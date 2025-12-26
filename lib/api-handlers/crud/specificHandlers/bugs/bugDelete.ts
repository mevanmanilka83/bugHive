/**
 * Bug DELETE Handler
 * 
 * Handles deleting general bugs (without cluster_id):
 * - DELETE /api/bugs/[id] (when bug doesn't have cluster_id)
 * - Validates bug exists before deletion
 * 
 * Note: For cluster-specific bugs, use clusterBugDelete handler
 */
import { extractRouteId, ensureValidUUID } from "@/lib/utils"
import { getSingleRecord, deleteRecord } from "@/lib/shared/database/database"
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
 * Creates DELETE handler for general bugs
 * 
 * Features:
 * - Validates bug exists
 * - Validates cluster access if bug has cluster_id (should use clusterBugDelete instead)
 * - Returns success message on deletion
 */
export const createBugDeleteHandler = () => 
  createApiHandler(async (request, context, authResult) => {
    const id = await extractRouteId(context)

    // Get the existing bug
    const existingBug = await getSingleRecord('bugs', id)
    if (!existingBug) {
      throw new Error("Bug not found")
    }

    // If bug has cluster_id, validate access (but prefer using clusterBugDelete)
    if (existingBug.cluster_id && authResult?.user?.id) {
      const hasAccess = await validateBugClusterAccess(authResult.user.id, existingBug)
      if (!hasAccess) {
        throw new Error("You don't have access to delete this bug. Use cluster bug handler instead.")
      }
    }

    await deleteRecord('bugs', id, 'id')
    return { message: "Bug deleted successfully" }
  })
