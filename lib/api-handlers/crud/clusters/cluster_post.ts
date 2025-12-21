/**
 * Cluster POST Handler
 * 
 * Handles creating new clusters:
 * - POST /api/clusters
 */
import { ensureValidUUID, addTimestamps, insertRecord } from "@/lib/core"
import { createApiHandler } from "../../base"

/**
 * Creates POST handler for clusters
 * 
 * Features:
 * - Validates required fields (name)
 * - Sets owner_id and initializes members array
 * - Creates owner username from email
 */
export const createClusterPostHandler = () => 
  createApiHandler(async (request, context, authResult) => {
    const body = await request.json().catch(() => ({}))
    const { user } = authResult

    const name = body.name?.trim()
    const description = body.description?.trim() || null

    if (!name || name.length < 3) {
      throw new Error("Cluster name is required and must be at least 3 characters")
    }

    // Get owner username
    const ownerEmail = user.email || ''
    const ownerUsername = user.name || (ownerEmail ? ownerEmail.split('@')[0] : 'User')

    const clusterData = addTimestamps({
      name,
      description,
      owner_id: ensureValidUUID(user.id),
      owner_username: ownerUsername,
      members: [ensureValidUUID(user.id)],
      members_usernames: [ownerUsername],
      invites: [],
    })

    const cluster = await insertRecord('clusters', clusterData)
    return { cluster }
  }, 201)
