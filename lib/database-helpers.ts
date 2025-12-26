/**
 * Database Helper Utilities
 * 
 * Shared database operation helpers for use across server actions.
 */

import { supabase } from "@/lib/config"
import { type ActionResponse } from "@/lib/auth/helpers"

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
