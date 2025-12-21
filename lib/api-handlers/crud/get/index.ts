/**
 * GET Handler Factory
 * 
 * Creates handlers for fetching records (single or multiple)
 * 
 * Supports:
 * - Single record: GET /api/resource/[id]
 * - Multiple records: GET /api/resource?created_by=xxx&cluster_id=yyy&limit=100
 */
import { extractBugId, getSingleRecord, getMultipleRecords } from "@/lib/core"
import { createApiHandler } from "../../base"

/**
 * Creates a GET handler for fetching records
 * 
 * @param table - Database table name
 * @param idField - Field name for the ID (default: 'id')
 * @returns GET handler function
 */
export const createGetHandler = (table: string, idField: string = 'id') => 
  createApiHandler(async (request, context) => {
    if (context?.params) {
      // Single record fetch
      const id = await extractBugId(context)
      return { [table.slice(0, -1)]: await getSingleRecord(table, id, idField) }
    }
    
    // Multiple records fetch with query parameters
    const searchParams = request?.nextUrl?.searchParams
    if (!searchParams) {
      return { [table]: [] }
    }
    
    const createdByParam = searchParams.get('created_by')
    const clusterIdParam = searchParams.get('cluster_id')
    const filterField = clusterIdParam ? 'cluster_id' : (createdByParam ? 'created_by' : undefined)
    const filterValue: string | undefined = clusterIdParam ?? createdByParam ?? undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    
    const records = await getMultipleRecords(table, filterField, filterValue)
    
    // Apply limit if specified
    const limitedRecords = limit ? records.slice(0, limit) : records
    
    return { [table]: limitedRecords }
  })
