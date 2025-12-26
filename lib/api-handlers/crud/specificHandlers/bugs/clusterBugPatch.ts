/**
 * Cluster Bug PATCH Handler
 * 
 * Handles updating cluster-specific bugs:
 * - PATCH /api/bugs/[id] (when bug has cluster_id)
 * - Only allows updates to specified fields
 * - Validates cluster access before allowing updates
 * - Validates access when moving bugs between clusters
 */
import { extractRouteId, addTimestamps, ensureValidUUID } from "@/lib/utils"
import { getSingleRecord, updateRecord } from "@/lib/shared/database/database"
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
  
  const isOwner = cluster.owner_id === userUuid
  const isMember = cluster.members && Array.isArray(cluster.members) && cluster.members.includes(userUuid)
  
  return isOwner || isMember
}

// Helper: Validate bug cluster access (only owner/member)
async function validateBugClusterAccess(userId: string, bug: any): Promise<boolean> {
  if (!bug?.cluster_id) return false
  return await isClusterOwnerOrMember(userId, bug.cluster_id)
}

// Helper: Check cluster access (only owner/member)
async function hasClusterAccess(userId: string, clusterId: string): Promise<boolean> {
  return await isClusterOwnerOrMember(userId, clusterId)
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

    // Validate that user is owner or member of the cluster
    const isAuthorized = await validateBugClusterAccess(authResult.user.id, existingBug)
    if (!isAuthorized) {
      throw new Error("Only cluster owners and members can update cluster bugs")
    }

    // Check if user is trying to close the bug
    if (body.status === 'closed') {
      const userUuid = ensureValidUUID(authResult.user.id)
      const bugCreatorId = existingBug.created_by ? ensureValidUUID(existingBug.created_by) : null
      
      // Check if user is the bug creator
      const isCreator = bugCreatorId && bugCreatorId === userUuid
      
      // Check if user is the cluster owner
      const { data: cluster } = await supabase
        .from('clusters')
        .select('owner_id')
        .eq('id', existingBug.cluster_id)
        .single()
      
      const isClusterOwner = cluster?.owner_id === userUuid
      
      // Only creator or cluster owner can close the bug
      if (!isCreator && !isClusterOwner) {
        throw new Error("Only the bug creator or cluster owner can close this bug")
      }
    }

    // If updating cluster_id, validate that user is owner or member of the new cluster
    if (body.cluster_id && body.cluster_id !== existingBug.cluster_id) {
      const hasNewClusterAccess = await hasClusterAccess(authResult.user.id, body.cluster_id)
      if (!hasNewClusterAccess) {
        throw new Error("Only cluster owners and members can move bugs to a cluster")
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
