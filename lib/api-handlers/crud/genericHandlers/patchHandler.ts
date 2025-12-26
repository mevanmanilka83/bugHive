/**
 * PATCH Handler Factory
 * 
 * Creates handlers for updating existing records
 * 
 * Architecture:
 * - Authentication is handled by handlerFactory.ts (not here)
 * - This handler receives the authenticated user via authResult parameter (if needed)
 * - Field-level security ensures only allowed fields can be updated
 * 
 * Features:
 * - Field-level security (only allowed fields can be updated)
 * - Additional filter support for ownership validation
 * - Automatic timestamp updates
 */
import { extractRouteId, addTimestamps } from "@/lib/utils"
import { updateRecord } from "@/lib/database/database"
import { createApiHandler } from "../../handlerFactory"

/**
 * Creates a PATCH handler for updating existing records
 * 
 * @param table - Database table name
 * @param allowedFields - Array of field names that can be updated
 * @param idField - Field name for the ID (default: 'id')
 * @param additionalFilter - Optional additional filter for security (e.g., user ownership)
 * @returns PATCH handler function
 */
export const createPatchHandler = (
  table: string,
  allowedFields: string[],
  idField: string = 'id',
  additionalFilter?: { field: string; value: string }
) => 
  createApiHandler(async (request, context) => {
    const id = await extractRouteId(context)
    const body = await request.json().catch(() => ({}))

    // Only allow updates to specified fields
    const updateData: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields to update")
    }

    const record = await updateRecord(
      table, 
      id, 
      addTimestamps(updateData), 
      idField, 
      additionalFilter
    )
    
    return { [table.slice(0, -1)]: record }
  })
