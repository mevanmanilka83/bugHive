"use server"

import { auth } from "@/auth"
import { supabase, ensureValidUUID } from "@/lib/core"

// Generate deterministic UUID for invitee from email
function generateUUIDFromEmailSync(email: string): string {
  let hash = 0
  const normalizedEmail = email.toLowerCase().trim()
  for (let i = 0; i < normalizedEmail.length; i++) {
    const char = normalizedEmail.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const hashStr = Math.abs(hash).toString(16).padStart(8, '0')
  const hashStr2 = ((hash * 31) >>> 0).toString(16).padStart(8, '0')
  const hashStr3 = ((hash * 17) >>> 0).toString(16).padStart(8, '0')
  const hashStr4 = ((hash * 7) >>> 0).toString(16).padStart(8, '0')
  const fullHash = (hashStr + hashStr2 + hashStr3 + hashStr4).substring(0, 32)
  const uuid = [
    fullHash.substring(0, 8),
    fullHash.substring(8, 12),
    '4' + fullHash.substring(13, 16),
    ((parseInt(fullHash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + fullHash.substring(17, 20),
    fullHash.substring(20, 32)
  ].join('-')
  return uuid
}

export async function inviteUserToCluster(
  clusterId: string, 
  inviteeEmail?: string, 
  inviteeUsername?: string
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    if (!inviteeEmail && !inviteeUsername) {
      return { success: false, error: "Email or username is required" }
    }

    // Get cluster to verify ownership
    const { data: cluster, error: clusterError } = await supabase
      .from('clusters')
      .select('*')
      .eq('id', clusterId)
      .single()

    if (clusterError || !cluster) {
      return { success: false, error: "Cluster not found" }
    }

    // Check if user is the owner
    if (cluster.owner_id !== ensureValidUUID(session.user.id)) {
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
        return { 
          success: false, 
          error: `Error looking up user: ${userError.message}` 
        }
      }

      if (!userData || userData.length === 0 || !userData[0]) {
        return { 
          success: false, 
          error: `User not found with username "${trimmedUsername}". Please check the username or use email address instead.` 
        }
      }

      finalEmail = userData[0].email
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!finalEmail || !emailRegex.test(finalEmail)) {
      return { success: false, error: "Invalid email address" }
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
      const username = finalEmail.split('@')[0]
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
      return { 
        success: false, 
        error: updateError.message || 'Failed to send invitation'
      }
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
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Internal server error" 
    }
  }
}

