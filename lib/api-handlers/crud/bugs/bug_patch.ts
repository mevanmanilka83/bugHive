/**
 * Bug PATCH Handler
 * 
 * Handles updating existing bugs:
 * - PATCH /api/bugs/[id]
 * - Only allows updates to specified fields
 * - Validates field values
 */
import { createPatchHandler } from "../patch"

/**
 * Fields that can be updated for bugs
 */
const ALLOWED_UPDATE_FIELDS = [
  'status',
  'priority',
  'assigned_to',
  'title',
  'description',
  'visibility'
] as const

/**
 * Creates PATCH handler for bugs
 * 
 * Features:
 * - Only allows updates to specified fields
 * - Prevents unauthorized field modifications
 * - Automatically updates timestamps
 */
export const createBugPatchHandler = () => 
  createPatchHandler('bugs', [...ALLOWED_UPDATE_FIELDS])
