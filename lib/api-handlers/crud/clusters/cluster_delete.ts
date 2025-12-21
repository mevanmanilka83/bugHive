/**
 * Cluster DELETE Handler
 * 
 * Handles deleting clusters:
 * - DELETE /api/clusters/[id]
 * - Validates ownership before deletion
 */
import { deleteRecord, ensureValidUUID, getSingleRecord } from "@/lib/core"
import { createApiHandler } from "../../base"

/**
 * Creates DELETE handler for clusters
 * 
 * Features:
 * - Validates cluster exists
 * - Validates cluster ownership
 * - Returns success message on deletion
 */
export const createClusterDeleteHandler = () => 
  createApiHandler(async (request, context, authResult) => {
    const { id } = await context.params
    const { user } = authResult

    // Verify ownership
    const cluster = await getSingleRecord('clusters', id)
    if (cluster.owner_id !== ensureValidUUID(user.id)) {
      throw new Error("Only cluster owners can delete clusters")
    }

    await deleteRecord('clusters', id)
    return { message: "Cluster deleted successfully" }
  })
