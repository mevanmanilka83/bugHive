/**
 * DELETE Handler Factory
 * 
 * Creates handlers for deleting records
 * 
 * Architecture:
 * - Authentication is handled by handlerFactory.ts (not here)
 * - This handler receives the authenticated user via authResult parameter (if needed)
 * - Additional filters can be used for ownership/security validation
 * 
 * Features:
 * - Additional filter support for security validation
 * - Prevents unauthorized deletions
 */
import { extractRouteId, deleteRecord } from "@/lib/shared/shared"
import { createApiHandler } from "../../handlerFactory"

/**
 * Creates a DELETE handler for removing records
 * 
 * @param table - Database table name
 * @param idField - Field name for the ID (default: 'id')
 * @param additionalFilter - Optional additional filter for security
 * @returns DELETE handler function
 */
export const createDeleteHandler = (
  table: string,
  idField: string = 'id',
  additionalFilter?: { field: string; value: string }
) => 
  createApiHandler(async (request, context) => {
    const id = await extractRouteId(context)
    await deleteRecord(table, id, idField, additionalFilter)
    return { message: `${table.slice(0, -1)} deleted successfully` }
  })
