"use server"

import { ensureValidUUID } from "@/lib/utils"
import { supabase } from "@/lib/shared/config/config"
import { requireAuth, getUsernameFromSession, getAuthenticatedUserId, type ActionResponse } from "@/lib/auth/helpers"
import { createErrorResponse, handleSupabaseError } from "@/app/actions/shared/errors"
import { getClusterById } from "@/app/actions/shared/cluster"
import { validateWithSchema } from "@/app/actions/shared/validation"
import { getAcceptInviteValidationSchema } from "@/lib/schemas/zod/acceptInvite"

export async function acceptClusterInvite(clusterId: string): Promise<ActionResponse<{ message?: string }>> {
  try {
    // Check authentication
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult
    }
    const { session } = authResult

    // Validate clusterId
    const validation = validateWithSchema(getAcceptInviteValidationSchema(), { clusterId })
    if (!validation.success) {
      return validation
    }

    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return { success: false, error: "Unauthorized" }
    }

    // Get cluster
    const clusterResult = await getClusterById(clusterId)
    if (!clusterResult.success) {
      return clusterResult
    }
    const cluster = clusterResult.cluster

    // Check if user has a pending invite
    if (!cluster.invites || !cluster.invites.includes(userId)) {
      return { success: false, error: "No pending invitation found" }
    }

    // Always ensure user record exists and is up-to-date in Supabase
    const username = getUsernameFromSession(session)
    
    // Upsert user record with current session data
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

    // Remove from invites and add to members
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

    // Mark notification as read
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

