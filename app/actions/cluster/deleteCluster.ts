"use server"

import {
  supabase,
  requireAuth,
  getAuthenticatedUserId,
  createErrorResponse,
  handleSupabaseError,
  getClusterById,
  verifyClusterOwnership,
  validateWithSchema,
  type ActionResponse
} from "@/lib"
import { getDeleteClusterValidationSchema } from "@/lib"

export async function deleteCluster(clusterId: string): Promise<ActionResponse<{ message?: string }>> {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult
    }

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

    if (!verifyClusterOwnership(clusterResult.cluster, userId)) {
      return { success: false, error: "Only cluster owners can delete clusters" }
    }

    const { error: deleteError } = await supabase
      .from('clusters')
      .delete()
      .eq('id', clusterId)

    if (deleteError) {
      return handleSupabaseError(deleteError, 'Failed to delete cluster')
    }

    return { 
      success: true, 
      message: "Cluster deleted successfully" 
    }
  } catch (error) {
    return createErrorResponse(error)
  }
}


