/**
 * Cluster Bug PATCH Handler
 * 
 * Handles updating cluster-specific bugs:
 * - PATCH /api/bugs/[id] (when bug has cluster_id)
 * - Only allows updates to specified fields
 * - Validates cluster access before allowing updates
 * - Validates access when moving bugs between clusters
 */
import { getSingleRecord, extractRouteId, updateRecord, addTimestamps, supabase, ensureValidUUID } from "@/lib/shared/shared"
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

// Helper: Check cluster access
async function hasClusterAccess(userId: string, clusterId: string): Promise<boolean> {
  const userClusterIds = await getUserClusterIds(userId)
  return userClusterIds.has(clusterId)
}

/**
 * Fields that can be updated for cluster bugs
 */
const ALLOWED_UPDATE_FIELDS = [
  'status',
  'priority',
  'assigned_to',
  'title',
  'description',
  'visibility',
  'cluster_id'
] as const

/**
 * Creates PATCH handler for cluster-specific bugs
 * 
 * Features:
 * - Only allows updates to specified fields
 * - Prevents unauthorized field modifications
 * - Validates cluster access before allowing updates
 * - Validates access when changing cluster_id
 * - Automatically updates timestamps
 */
export const createClusterBugPatchHandler = () => 
  createApiHandler(async (request, context, authResult) => {
    if (!authResult?.user?.id) {
      throw new Error("Unauthorized")
    }

    const id = await extractRouteId(context)
    const body = await request.json().catch(() => ({}))

    // Get the existing bug to check cluster access
    const existingBug = await getSingleRecord('bugs', id)
    if (!existingBug) {
      throw new Error("Bug not found")
    }

    // Only handle cluster bugs
    if (!existingBug.cluster_id) {
      throw new Error("This handler is for cluster bugs only")
    }

    // Validate cluster access for the existing bug
    const hasAccess = await validateBugClusterAccess(authResult.user.id, existingBug)
    if (!hasAccess) {
      throw new Error("You don't have access to update this cluster bug")
    }

    // If updating cluster_id, validate access to the new cluster
    if (body.cluster_id && body.cluster_id !== existingBug.cluster_id) {
      const hasNewClusterAccess = await hasClusterAccess(authResult.user.id, body.cluster_id)
      if (!hasNewClusterAccess) {
        throw new Error("You don't have access to move this bug to the specified cluster")
      }
    }

    // Only allow updates to specified fields
    const updateData: any = {}
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields to update")
    }

    // Ensure cluster_id remains set (can't remove it via this handler)
    if (!updateData.cluster_id) {
      updateData.cluster_id = existingBug.cluster_id
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
