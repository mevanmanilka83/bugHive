"use server"

import {
  ensureValidUUID,
  supabase,
  requireAuth,
  getAuthenticatedUserId,
  getUsernameFromSession,
  createErrorResponse,
  handleSupabaseError,
  getClusterById,
  verifyClusterOwnership,
  validateWithSchema,
  type ActionResponse,
} from "@/lib"
import { getDeleteClusterValidationSchema } from "@/lib"

const MAX_CLUSTER_NAME_LENGTH = 100

function truncateName(name: string, maxLength: number): string {
  return name.length <= maxLength ? name : name.slice(0, maxLength).trim()
}

function buildDuplicateName(baseName: string, index: number): string {
  const suffix = index <= 1 ? " (Copy)" : ` (Copy ${index})`
  const safeBase = truncateName(baseName, MAX_CLUSTER_NAME_LENGTH - suffix.length)
  return `${safeBase}${suffix}`.trim()
}

export async function duplicateCluster(clusterId: string): Promise<ActionResponse<{ cluster?: any; message?: string }>> {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult
    }
    const { session } = authResult

    const validation = validateWithSchema(getDeleteClusterValidationSchema(), { clusterId })
    if (!validation.success) {
      return validation
    }

    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    const clusterResult = await getClusterById(clusterId)
    if (!clusterResult.success) {
      return clusterResult
    }
    const sourceCluster = clusterResult.cluster

    if (!verifyClusterOwnership(sourceCluster, userId)) {
      return { success: false, error: "Only cluster owners can duplicate clusters" }
    }

    const { data: ownerClusters, error: namesError } = await supabase
      .from("clusters")
      .select("name")
      .eq("owner_id", ensureValidUUID(userId))

    if (namesError) {
      return handleSupabaseError(namesError, "Failed to duplicate cluster")
    }

    const existingNames = new Set((ownerClusters || []).map((item: any) => String(item?.name || "").trim().toLowerCase()))
    const baseName = String(sourceCluster.name || "Untitled Cluster").trim() || "Untitled Cluster"

    let copyIndex = 1
    let nextName = buildDuplicateName(baseName, copyIndex)
    while (existingNames.has(nextName.toLowerCase()) && copyIndex < 1000) {
      copyIndex += 1
      nextName = buildDuplicateName(baseName, copyIndex)
    }

    const ownerUsername = getUsernameFromSession(session)
    const ownerUuid = ensureValidUUID(userId)

    const duplicatePayload = {
      name: nextName,
      description: sourceCluster.description || null,
      visibility: sourceCluster.visibility === "public" ? "public" : "private",
      owner_id: ownerUuid,
      owner_username: ownerUsername,
      members: [ownerUuid],
      members_usernames: [ownerUsername],
      invites: [],
    }

    const { data: duplicated, error: duplicateError } = await supabase
      .from("clusters")
      .insert(duplicatePayload)
      .select()
      .single()

    if (duplicateError) {
      return handleSupabaseError(duplicateError, "Failed to duplicate cluster")
    }

    return {
      success: true,
      cluster: duplicated,
      message: "Cluster duplicated successfully",
    }
  } catch (error) {
    return createErrorResponse(error)
  }
}
