"use server"

import { auth } from "@/auth"
import { supabase, ensureValidUUID } from "@/lib/core"

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

    // Always ensure user record exists and is up-to-date in Supabase
    const userEmail = session.user.email || ''
    const username = session.user.name || (userEmail ? userEmail.split('@')[0] : 'User')
    
    // Upsert user record with current session data
    await supabase
      .from('users')
      .upsert({
        id: userId,
        email: userEmail || null,
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
      return { 
        success: false, 
        error: updateError.message || 'Failed to accept invitation'
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

