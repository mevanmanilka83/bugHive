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
import { getInviteUserValidationSchema } from "@/lib/schemas/zod/inviteUser"

export async function inviteUserToCluster(
  clusterId: string, 
  inviteeEmail?: string, 
  inviteeUsername?: string
): Promise<ActionResponse<{ message?: string }>> {
  try {
    // Check authentication
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult
    }
    const { session } = authResult

    // Validate input
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

    // Get cluster to verify ownership
    const clusterResult = await getClusterById(clusterId)
    if (!clusterResult.success) {
      return clusterResult
    }
    const cluster = clusterResult.cluster

    // Check if user is the owner
    if (!verifyClusterOwnership(cluster, userId)) {
      return { success: false, error: "Only cluster owners can invite members" }
    }

    // Determine the email to use for invitation
    let finalEmail = inviteeEmail?.trim().toLowerCase()

    // If email is not provided but username is, look up user by username
    if (!finalEmail && inviteeUsername) {
      const trimmedUsername = inviteeUsername.trim()
      
      if (!trimmedUsername) {
        return { success: false, error: "Username cannot be empty" }
      }

      // Use function to lookup user by username (bypasses RLS)
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

    // Email validation is handled by Zod schema, but double-check here
    if (!finalEmail) {
      return { success: false, error: "Email is required" }
    }

    const inviteeUserId = generateUUIDFromEmailSync(finalEmail)

    // Check if user is already a member
    if (cluster.members && cluster.members.includes(inviteeUserId)) {
      return { success: false, error: "User is already a member of this cluster" }
    }

    // Check if user already has a pending invite
    if (cluster.invites && cluster.invites.includes(inviteeUserId)) {
      return { success: false, error: "User already has a pending invitation" }
    }

    // Create user record in Supabase if it doesn't exist
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', inviteeUserId)
      .single()

    if (!existingUser) {
      // User doesn't exist, create a basic user record
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

    // Add invitee to invites array
    const updatedInvites = [...(cluster.invites || []), inviteeUserId]

    // Update cluster with new invite
    const { error: updateError } = await supabase
      .from('clusters')
      .update({ invites: updatedInvites })
      .eq('id', clusterId)

    if (updateError) {
      return handleSupabaseError(updateError, 'Failed to send invitation')
    }

    // Create notification for the invitee
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

