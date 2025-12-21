"use server"

import { auth } from "@/auth"
import { supabase, ensureValidUUID } from "@/lib/core"

export async function deleteCluster(clusterId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const userId = ensureValidUUID(session.user.id)

    // Get cluster to verify ownership
    const { data: cluster, error: clusterError } = await supabase
      .from('clusters')
      .select('*')
      .eq('id', clusterId)
      .single()

    if (clusterError || !cluster) {
      return { success: false, error: "Cluster not found" }
    }

    // Verify ownership
    if (cluster.owner_id !== userId) {
      return { success: false, error: "Only cluster owners can delete clusters" }
    }

    // Delete cluster
    const { error: deleteError } = await supabase
      .from('clusters')
      .delete()
      .eq('id', clusterId)

    if (deleteError) {
      return { 
        success: false, 
        error: deleteError.message || 'Failed to delete cluster'
      }
    }

    return { 
      success: true, 
      message: "Cluster deleted successfully" 
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Internal server error" 
    }
  }
}

