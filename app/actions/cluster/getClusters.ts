"use server"

import { auth } from "@/auth"
import { supabase, ensureValidUUID } from "@/lib/shared/shared"

export async function getClusters() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", clusters: [] }
    }

    const userId = ensureValidUUID(session.user.id)

    // Get all clusters and filter where user is owner or member
    const { data: allClusters, error } = await supabase
      .from('clusters')
      .select('*')
    
    if (error) {
      return { 
        success: false, 
        error: error.message || 'Failed to fetch clusters',
        clusters: []
      }
    }
    
    // Filter clusters where user is owner or member
    const clusters = (allClusters || []).filter((cluster: any) => {
      const isOwner = cluster.owner_id === userId
      const isMember = cluster.members && 
                       Array.isArray(cluster.members) && 
                       cluster.members.includes(userId)
      return isOwner || isMember
    })

    return { 
      success: true, 
      clusters: clusters || []
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Internal server error",
      clusters: []
    }
  }
}


