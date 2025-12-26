/**
 * Cluster PATCH Handler
 * 
 * Handles updating existing clusters:
 * - PATCH /api/clusters/[id]
 * - Only allows updates to specified fields
 * - Validates ownership
 */
import { addTimestamps, ensureValidUUID } from "@/lib/utils"
import { updateRecord, getSingleRecord } from "@/lib/database/database"
import { createApiHandler } from "../../../handlerFactory"

/**
 * Fields that can be updated for clusters
 */
const ALLOWED_UPDATE_FIELDS = [
  'name',
  'description'
] as const

/**
 * Creates PATCH handler for clusters
 * 
 * Features:
 * - Only allows updates to specified fields
 * - Validates cluster ownership
 * - Prevents unauthorized modifications
 */
export const createClusterPatchHandler = () => 
  createApiHandler(async (request, context, authResult) => {
    const { id } = await context.params
    const { user } = authResult
    const body = await request.json().catch(() => ({}))

    // Verify ownership
    const cluster = await getSingleRecord('clusters', id)
    if (cluster.owner_id !== ensureValidUUID(user.id)) {
      throw new Error("Only cluster owners can update clusters")
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

    const record = await updateRecord(
      'clusters', 
      id, 
      addTimestamps(updateData)
    )
    
    return { cluster: record }
  })
