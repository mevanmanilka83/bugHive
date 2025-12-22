/**
 * Bug GET Handler
 * 
 * Handles fetching bugs with cluster name enrichment:
 * - Single bug: GET /api/bugs/[id]
 * - Multiple bugs: GET /api/bugs?created_by=xxx&cluster_id=yyy&limit=100
 */
import { getSingleRecord, getMultipleRecords, extractBugId, parseQueryFilters } from "@/lib/core/core"
import { createApiHandler } from "../../../handlerFactory"
import { enrichBugWithCluster, enrichBugsWithClusters } from "./bugUtils"

/**
 * Creates GET handler for bugs
 * 
 * Features:
 * - Fetches single or multiple bugs
 * - Enriches bugs with cluster names
 * - Supports filtering by created_by or cluster_id
 * - Supports limit parameter
 */
export const createBugGetHandler = () => 
  createApiHandler(async (request, context) => {
    if (context?.params) {
      // Single bug fetch - include cluster name
      const id = await extractBugId(context)
      const bug = await getSingleRecord('bugs', id)
      const enrichedBug = await enrichBugWithCluster(bug)
      return { bug: enrichedBug }
    }
    
    // Multiple bugs fetch - include cluster names
    const searchParams = request?.nextUrl?.searchParams
    if (!searchParams) {
      return { bugs: [] }
    }
    
    const { filterField, filterValue, limit } = parseQueryFilters(searchParams)
    const records = await getMultipleRecords('bugs', filterField, filterValue)
    
    // Enrich bugs with cluster names
    const bugsWithClusters = await enrichBugsWithClusters(records)
    
    // Apply limit if specified
    const limitedRecords = limit ? bugsWithClusters.slice(0, limit) : bugsWithClusters
    
    return { bugs: limitedRecords }
  })
