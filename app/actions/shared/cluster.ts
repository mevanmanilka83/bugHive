import { supabase } from "@/lib/shared/config/config"
import { type ActionResponse } from "@/lib/auth/helpers"

/**
 * Fetch cluster by ID with error handling
 */
export async function getClusterById(clusterId: string): Promise<ActionResponse<{ cluster: any }>> {
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
 */
export function verifyClusterOwnership(cluster: any, userId: string): boolean {
  return cluster.owner_id === userId
}
