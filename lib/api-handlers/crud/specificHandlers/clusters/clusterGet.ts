/**
 * Cluster GET Handler
 * 
 * Handles fetching clusters:
 * - Single cluster: GET /api/clusters/[id]
 * - Multiple clusters: GET /api/clusters
 */
import { getSingleRecord, getMultipleRecords } from "@/lib/database/database"
import { createApiHandler } from "../../../handlerFactory"

/**
 * Creates GET handler for clusters
 * 
 * Features:
 * - Fetches single or multiple clusters
 * - Supports filtering by owner_id or member_id
 */
export const createClusterGetHandler = () => 
  createApiHandler(async (request, context) => {
    if (context?.params) {
      // Single cluster fetch
      const { id } = await context.params
      const cluster = await getSingleRecord('clusters', id)
      return { cluster }
    }
    
    // Multiple clusters fetch
    const searchParams = request?.nextUrl?.searchParams
    const records = await getMultipleRecords('clusters')
    
    return { clusters: records }
  })
