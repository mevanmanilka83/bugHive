"use server"

import {
  ensureValidUUID,
  supabase,
  requireAuth,
  getUsernameFromSession,
  getAuthenticatedUserId,
  createErrorResponse,
  handleSupabaseError,
  getClusterById,
  validateWithSchema,
  type ActionResponse
} from "@/lib"
import { getAcceptInviteValidationSchema } from "@/lib"

export async function acceptClusterInvite(clusterId: string): Promise<ActionResponse<{ message?: string }>> {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult
    }
    const { session } = authResult

    const validation = validateWithSchema(getAcceptInviteValidationSchema(), { clusterId })
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
    const cluster = clusterResult.cluster

    if (!cluster.invites || !cluster.invites.includes(userId)) {
      return { success: false, error: "No pending invitation found" }
    }

    const username = getUsernameFromSession(session)
    
    await supabase
      .from('users')
      .upsert({
        id: userId,
        email: session.user.email || null,
        name: session.user.name || username,
        image: session.user.image || null,
        email_verified: null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })

    const updatedInvites = (cluster.invites || []).filter((id: string) => id !== userId)
    const updatedMembers = [...(cluster.members || []), userId]
    const updatedMembersUsernames = [...(cluster.members_usernames || []), username]

    const { error: updateError } = await supabase
      .from('clusters')
      .update({ 
        invites: updatedInvites,
        members: updatedMembers,
        members_usernames: updatedMembersUsernames
      })
      .eq('id', clusterId)

    if (updateError) {
      return handleSupabaseError(updateError, 'Failed to accept invitation')
    }

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('cluster_id', clusterId)
      .eq('type', 'cluster_invite')

    return { 
      success: true, 
      message: "Invitation accepted successfully" 
    }
  } catch (error) {
    return createErrorResponse(error)
  }
}

