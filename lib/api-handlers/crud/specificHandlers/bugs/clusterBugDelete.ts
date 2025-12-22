/**
 * Cluster Bug DELETE Handler
 * 
 * Handles deleting cluster-specific bugs:
 * - DELETE /api/bugs/[id] (when bug has cluster_id)
 * - Validates bug exists before deletion
 * - Validates cluster access before allowing deletion
 */
import { getSingleRecord, extractRouteId, deleteRecord, supabase, ensureValidUUID } from "@/lib/shared/shared"
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
  if (!bug?.cluster_id) return false
  const userClusterIds = await getUserClusterIds(userId)
  return userClusterIds.has(bug.cluster_id)
}

/**
 * Creates DELETE handler for cluster-specific bugs
 * 
 * Features:
 * - Validates bug exists
 * - Validates bug is a cluster bug
 * - Validates cluster access before allowing deletion
 * - Returns success message on deletion
 */
export const createClusterBugDeleteHandler = () => 
  createApiHandler(async (request, context, authResult) => {
    if (!authResult?.user?.id) {
      throw new Error("Unauthorized")
    }

    const id = await extractRouteId(context)

    // Get the existing bug to check cluster access
    const existingBug = await getSingleRecord('bugs', id)
    if (!existingBug) {
      throw new Error("Bug not found")
    }

    // Only handle cluster bugs
    if (!existingBug.cluster_id) {
      throw new Error("This handler is for cluster bugs only")
    }

    // Validate cluster access for the bug
    const hasAccess = await validateBugClusterAccess(authResult.user.id, existingBug)
    if (!hasAccess) {
      throw new Error("You don't have access to delete this cluster bug")
    }

    await deleteRecord('bugs', id, 'id')
    return { message: "Cluster bug deleted successfully" }
  })
