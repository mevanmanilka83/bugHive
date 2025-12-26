"use server"

import { supabase } from "@/lib/shared/shared"
import { requireAuth, getAuthenticatedUserId, type ActionResponse } from "@/lib/auth/helpers"
import { createErrorResponse, handleSupabaseError } from "../shared/errors"

export async function getClusters(): Promise<ActionResponse<{ clusters: any[] }>> {
  try {
    // Check authentication
    const authResult = await requireAuth()
    if (!authResult.success) {
      return { ...authResult, clusters: [] }
    }

    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return { success: false, error: "Unauthorized", clusters: [] }
    }

    // Get all clusters and filter where user is owner or member
    const { data: allClusters, error } = await supabase
      .from('clusters')
      .select('*')
    
    if (error) {
      return { 
        ...handleSupabaseError(error, 'Failed to fetch clusters'),
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
      ...createErrorResponse(error),
      clusters: []
    }
  }
}


