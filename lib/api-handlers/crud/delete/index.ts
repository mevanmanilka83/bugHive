/**
 * DELETE Handler Factory
 * 
 * Creates handlers for deleting records
 * 
 * Features:
 * - Additional filter support for security validation
 * - Prevents unauthorized deletions
 */
import { extractBugId, deleteRecord } from "@/lib/core"
import { createApiHandler } from "../../base"

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
    const id = await extractBugId(context)
    await deleteRecord(table, id, idField, additionalFilter)
    return { message: `${table.slice(0, -1)} deleted successfully` }
  })
