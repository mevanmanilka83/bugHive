"use server"

import { auth } from "@/auth"
import { supabase, ensureValidUUID } from "@/lib/core"
import { getClusterSchema } from "@/lib/schemas/cluster"

export async function createCluster(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string; cluster?: any }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    if (!formData) {
      return { success: false, error: "Form data is required" }
    }

    const name = (formData.get('name') as string) || ''
    const description = (formData.get('description') as string) || ''

    // Validate
    if (!name.trim()) {
      return { success: false, error: "Cluster name is required" }
    }
    if (name.trim().length < 3) {
      return { success: false, error: "Cluster name must be at least 3 characters" }
    }
    if (name.trim().length > 100) {
      return { success: false, error: "Cluster name must be less than 100 characters" }
    }

    const clusterData = {
      name: name.trim(),
      description: description.trim() || null,
      owner_id: ensureValidUUID(session.user.id),
      members: [ensureValidUUID(session.user.id)], // Owner is automatically a member
      invites: [],
    }

    const { data, error } = await supabase
      .from('clusters')
      .insert(clusterData)
      .select()
      .single()

    if (error) {
      return { 
        success: false, 
        error: error.message || 'Failed to create cluster',
        details: error.code || 'UNKNOWN_ERROR'
      }
    }

    return { 
      success: true, 
      cluster: data 
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Internal server error" 
    }
  }
}

export async function inviteUserToCluster(clusterId: string, inviteeEmail: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteeEmail)) {
      return { success: false, error: "Invalid email address" }
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

    // Generate deterministic UUID for invitee from email
    // This matches the auth.ts pattern
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

    const inviteeUserId = generateUUIDFromEmailSync(inviteeEmail)

    // Check if user is already a member
    if (cluster.members && cluster.members.includes(inviteeUserId)) {
      return { success: false, error: "User is already a member of this cluster" }
    }

    // Check if user already has a pending invite
    if (cluster.invites && cluster.invites.includes(inviteeUserId)) {
      return { success: false, error: "User already has a pending invitation" }
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
        error: updateError.message || 'Failed to send invitation',
        details: updateError.code || 'UNKNOWN_ERROR'
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

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notificationData)

    if (notificationError) {
      // Invite was added but notification failed - log but don't fail
      console.error("Failed to create notification:", notificationError)
    }

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

export async function acceptClusterInvite(clusterId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const userId = ensureValidUUID(session.user.id)

    // Get cluster
    const { data: cluster, error: clusterError } = await supabase
      .from('clusters')
      .select('*')
      .eq('id', clusterId)
      .single()

    if (clusterError || !cluster) {
      return { success: false, error: "Cluster not found" }
    }

    // Check if user has a pending invite
    if (!cluster.invites || !cluster.invites.includes(userId)) {
      return { success: false, error: "No pending invitation found" }
    }

    // Remove from invites and add to members
    const updatedInvites = (cluster.invites || []).filter((id: string) => id !== userId)
    const updatedMembers = [...(cluster.members || []), userId]

    const { error: updateError } = await supabase
      .from('clusters')
      .update({ 
        invites: updatedInvites,
        members: updatedMembers
      })
      .eq('id', clusterId)

    if (updateError) {
      return { 
        success: false, 
        error: updateError.message || 'Failed to accept invitation',
        details: updateError.code || 'UNKNOWN_ERROR'
      }
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
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Internal server error" 
    }
  }
}
