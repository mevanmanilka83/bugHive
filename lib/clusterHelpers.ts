/**
 * Cluster Helper Utilities
 * 
 * Shared helper functions for cluster access validation and membership checks.
 */

import { supabase, ensureValidUUID, type ActionResponse } from "@/lib"

/**
 * Fetch cluster by ID with error handling
 * 
 * Usage:
 * ```ts
 * const result = await getClusterById(clusterId)
 * if (!result.success) {
 *   return { success: false, error: result.error }
 * }
 * const cluster = result.cluster
 * ```
 */
export async function getClusterById(
  clusterId: string
): Promise<ActionResponse<{ cluster: any }>> {
  const { data: cluster, error: clusterError } = await supabase
    .from('clusters')
    .select('*')
    .eq('id', clusterId)
    .single()

  if (clusterError || !cluster) {
    return { 
      success: false, 
      error: "Cluster not found",
      cluster: null as any
    }
  }

  return { success: true, cluster }
}

/**
 * Verify user is cluster owner
 * 
 * Usage:
 * ```ts
 * if (!verifyClusterOwnership(cluster, userId)) {
 *   return { success: false, error: "Unauthorized" }
 * }
 * ```
 */
export function verifyClusterOwnership(cluster: any, userId: string): boolean {
  return cluster.owner_id === userId
}

/**
 * Get user's cluster IDs (where user is owner or member)
 * 
 * @param userId - The user ID to check
 * @returns Set of cluster IDs the user belongs to
 */
export async function getUserClusterIds(userId: string): Promise<Set<string>> {
  const userUuid = ensureValidUUID(userId)
  const clusterIds = new Set<string>()
  
  const { data: clusters } = await supabase.from('clusters').select('id, owner_id, members')
  
  if (clusters) {
    for (const cluster of clusters) {
      if (cluster.owner_id === userUuid) {
        clusterIds.add(cluster.id)
      } else if (Array.isArray(cluster.members) && cluster.members.includes(userUuid)) {
        clusterIds.add(cluster.id)
      }
    }
  }
  
  return clusterIds
}

/**
 * Check if user is owner or member of a cluster
 * 
 * @param userId - The user ID to check
 * @param clusterId - The cluster ID to check
 * @returns true if user is owner or member, false otherwise
 */
export async function isClusterOwnerOrMember(userId: string, clusterId: string): Promise<boolean> {
  const userUuid = ensureValidUUID(userId)
  const { data: cluster } = await supabase
    .from('clusters')
    .select('id, owner_id, members')
    .eq('id', clusterId)
    .single()
  
  if (!cluster) return false
  
  // Check if user is owner
  if (cluster.owner_id === userUuid) return true
  
  // Check if user is member
  if (Array.isArray(cluster.members) && cluster.members.includes(userUuid)) {
    return true
  }
  
  return false
}

/**
 * Check if user can view a bug with cluster context
 * 
 * @param userId - The user ID to check
 * @param bug - The bug record
 * @returns true if user can view the bug, false otherwise
 */
export async function canUserViewBug(userId: string, bug: any): Promise<boolean> {
  // Global bugs (no cluster_id) are visible to all
  if (!bug.cluster_id) return true
  
  // Cluster bugs require membership
  return await isClusterOwnerOrMember(userId, bug.cluster_id)
}
