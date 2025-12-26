/**
 * Cluster Bug DELETE Handler
 * 
 * Handles deleting cluster-specific bugs:
 * - DELETE /api/bugs/[id] (when bug has cluster_id)
 * - Validates bug exists before deletion
 * - Validates cluster access before allowing deletion
 */
import { extractRouteId, ensureValidUUID } from "@/lib/utils"
import { getSingleRecord, deleteRecord } from "@/lib/shared/database/database"
import { supabase } from "@/lib/shared/config/config"
import { createApiHandler } from "../../../handlerFactory"

// Helper: Check if user is owner or member of a cluster
async function isClusterOwnerOrMember(userId: string, clusterId: string): Promise<boolean> {
  const userUuid = ensureValidUUID(userId)
  const { data: cluster } = await supabase
    .from('clusters')
    .select('id, owner_id, members')
    .eq('id', clusterId)
    .single()
  
  if (!cluster) return false
  
  // Check if user is owner
  const isOwner = cluster.owner_id === userUuid
  
  // Check if user is member
  const isMember = cluster.members && 
                   Array.isArray(cluster.members) && 
                   cluster.members.includes(userUuid)
  
  return isOwner || isMember
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

    // Validate that user is owner or member of the cluster
    const isAuthorized = await isClusterOwnerOrMember(authResult.user.id, existingBug.cluster_id)
    if (!isAuthorized) {
      throw new Error("Only cluster owners and members can delete cluster bugs")
    }

    await deleteRecord('bugs', id, 'id')
    return { message: "Cluster bug deleted successfully" }
  })
