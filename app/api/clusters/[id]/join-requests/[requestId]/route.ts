import { checkAuth, ensureValidUUID, extractUsernameFromEmail, supabase } from "@/lib"
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; requestId: string }> }
) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id: clusterId, requestId } = await context.params
  const ownerId = ensureValidUUID(user.id)

  const body = await request.json().catch(() => ({}))
  const action = body.action === 'accept' ? 'accept' : body.action === 'decline' ? 'decline' : null
  if (!action) {
    return NextResponse.json({ error: "Action must be 'accept' or 'decline'" }, { status: 400 })
  }

  const { data: cluster, error: clusterError } = await supabase
    .from('clusters')
    .select('id, name, owner_id, members, members_usernames')
    .eq('id', clusterId)
    .single()

  if (clusterError || !cluster) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 })
  }

  if (cluster.owner_id !== ownerId) {
    return NextResponse.json({ error: "Only the cluster owner can respond to join requests" }, { status: 403 })
  }

  const { data: joinRequest, error: reqError } = await supabase
    .from('cluster_join_requests')
    .select('id, user_id, status')
    .eq('id', requestId)
    .eq('cluster_id', clusterId)
    .single()

  if (reqError || !joinRequest) {
    return NextResponse.json({ error: "Join request not found" }, { status: 404 })
  }

  if (joinRequest.status !== 'pending') {
    return NextResponse.json({ error: "This request was already processed" }, { status: 400 })
  }

  const requesterId = joinRequest.user_id

  if (action === 'decline') {
    await supabase
      .from('cluster_join_requests')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', requestId)

    await supabase
      .from('notifications')
      .insert({
        user_id: requesterId,
        type: 'cluster_join_declined',
        title: `Request declined`,
        message: `Your request to join "${cluster.name}" was declined.`,
        cluster_id: clusterId,
        read: false,
      })

    return NextResponse.json({ message: "Join request declined" })
  }

  // accept: add user to members
  const members = cluster.members || []
  const membersUsernames = cluster.members_usernames || []
  if (members.includes(requesterId)) {
    await supabase
      .from('cluster_join_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId)
    return NextResponse.json({ message: "User is already a member", cluster })
  }

  const { data: requester } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', requesterId)
    .single()

  const username = requester?.name || extractUsernameFromEmail(requester?.email || '')

  const updatedMembers = [...members, requesterId]
  const updatedMembersUsernames = [...membersUsernames, username]

  const { error: updateClusterError } = await supabase
    .from('clusters')
    .update({
      members: updatedMembers,
      members_usernames: updatedMembersUsernames,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clusterId)

  if (updateClusterError) {
    return NextResponse.json({ error: updateClusterError.message || "Failed to add member" }, { status: 500 })
  }

  await supabase
    .from('cluster_join_requests')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', requestId)

  await supabase
    .from('notifications')
    .insert({
      user_id: requesterId,
      type: 'cluster_joined',
      title: `Joined ${cluster.name}`,
      message: `Your request to join "${cluster.name}" was accepted.`,
      cluster_id: clusterId,
      read: false,
    })

  return NextResponse.json({ message: "Join request accepted", cluster: { ...cluster, members: updatedMembers, members_usernames: updatedMembersUsernames } })
}
