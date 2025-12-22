/**
 * Bug DELETE Handler
 * 
 * Handles deleting bugs:
 * - DELETE /api/bugs/[id]
 * - Validates bug exists before deletion
 */
import { createDeleteHandler } from "../../genericHandlers/deleteHandler"

/**
 * Creates DELETE handler for bugs
 * 
 * Features:
 * - Validates bug exists
 * - Returns success message on deletion
 */
export const createBugDeleteHandler = () => 
  createDeleteHandler('bugs')
