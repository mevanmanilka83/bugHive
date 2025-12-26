import { checkAuth, ensureValidUUID, extractUsernameFromEmail, supabase } from "@/lib"
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id: clusterId } = await context.params
  const userId = ensureValidUUID(user.id)

  // Get cluster
  const { data: cluster, error: clusterError } = await supabase
    .from('clusters')
    .select('*')
    .eq('id', clusterId)
    .single()

  if (clusterError || !cluster) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 })
  }

  // Check if user has a pending invite
  if (!cluster.invites || !cluster.invites.includes(userId)) {
    return NextResponse.json({ error: "No pending invitation found" }, { status: 400 })
  }

  // Always ensure user record exists and is up-to-date in Supabase
  const userEmail = user.email || ''
  const username = user.name || extractUsernameFromEmail(userEmail)
  
  // Upsert user record with current session data
  const { error: userUpsertError } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email: userEmail || null,
      name: user.name || username,
      image: user.image || null,
      email_verified: null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    })

  if (userUpsertError) {
    // Continue anyway - user creation is not critical for accepting invitation
  }

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
    return NextResponse.json({ error: updateError.message || 'Failed to accept invitation' }, { status: 500 })
  }

  // Mark notification as read
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('cluster_id', clusterId)
    .eq('type', 'cluster_invite')

  // Create a notification for joining
  await supabase
    .from('notifications')
    .insert({
      user_id: cluster.owner_id,
      type: 'cluster_joined',
      title: `User joined ${cluster.name}`,
      message: `${user.email || user.name || 'Someone'} has joined your cluster "${cluster.name}"`,
      cluster_id: clusterId,
      read: false,
    })

  return NextResponse.json({ message: "Invitation accepted successfully", cluster }, { status: 200 })
}
