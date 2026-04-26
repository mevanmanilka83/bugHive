"use server"

import {
  ensureValidUUID,
  generateUUIDFromEmailSync,
  extractUsernameFromEmail,
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
import { getInviteUserValidationSchema } from "@/lib"

export async function inviteUserToCluster(
  clusterId: string, 
  inviteeEmail?: string, 
  inviteeUsername?: string
): Promise<ActionResponse<{ message?: string }>> {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult
    }
    const { session } = authResult

    const validation = validateWithSchema(getInviteUserValidationSchema(), {
      clusterId,
      inviteeEmail,
      inviteeUsername
    })
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

    if (!verifyClusterOwnership(cluster, userId)) {
      return { success: false, error: "Only cluster owners can invite members" }
    }

    let finalEmail = inviteeEmail?.trim().toLowerCase()

    if (!finalEmail && inviteeUsername) {
      const trimmedUsername = inviteeUsername.trim()
      
      if (!trimmedUsername) {
        return { success: false, error: "Username cannot be empty" }
      }

      const { data: userData, error: userError } = await supabase
        .rpc('lookup_user_by_username', { p_username: trimmedUsername })

      if (userError) {
        return handleSupabaseError(userError, `Error looking up user: ${userError.message}`)
      }

      if (!userData || userData.length === 0 || !userData[0]) {
        return { 
          success: false, 
          error: `User not found with username "${trimmedUsername}". Please check the username or use email address instead.` 
        }
      }

      finalEmail = userData[0].email
    }

    if (!finalEmail) {
      return { success: false, error: "Email is required" }
    }

    const inviteeUserId = generateUUIDFromEmailSync(finalEmail)

    if (cluster.members && cluster.members.includes(inviteeUserId)) {
      return { success: false, error: "User is already a member of this cluster" }
    }

    if (cluster.invites && cluster.invites.includes(inviteeUserId)) {
      return { success: false, error: "User already has a pending invitation" }
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', inviteeUserId)
      .single()

    if (!existingUser) {
      const username = extractUsernameFromEmail(finalEmail)
      await supabase
        .from('users')
        .upsert({
          id: inviteeUserId,
          email: finalEmail,
          name: username,
          image: null,
          email_verified: null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })
    }

    const updatedInvites = [...(cluster.invites || []), inviteeUserId]

    const { error: updateError } = await supabase
      .from('clusters')
      .update({ invites: updatedInvites })
      .eq('id', clusterId)

    if (updateError) {
      return handleSupabaseError(updateError, 'Failed to send invitation')
    }

    const notificationData = {
      user_id: inviteeUserId,
      type: 'cluster_invite',
      title: `Invitation to join ${cluster.name}`,
      message: `${session.user.email || session.user.name || 'Someone'} invited you to join the cluster "${cluster.name}"`,
      cluster_id: clusterId,
      read: false,
    }

    await supabase
      .from('notifications')
      .insert(notificationData)

    return { 
      success: true, 
      message: "Invitation sent successfully" 
    }
  } catch (error) {
    return createErrorResponse(error)
  }
}

