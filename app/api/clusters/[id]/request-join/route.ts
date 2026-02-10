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

  const { data: cluster, error: clusterError } = await supabase
    .from('clusters')
    .select('id, name, owner_id, members, visibility')
    .eq('id', clusterId)
    .single()

  if (clusterError || !cluster) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 })
  }

  const visibility = (cluster.visibility || "private").toString().toLowerCase()
  if (visibility !== 'public') {
    return NextResponse.json({ error: "This cluster is not open for join requests" }, { status: 400 })
  }

  const members = cluster.members || []
  if (members.includes(userId)) {
    return NextResponse.json({ error: "You are already a member" }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('cluster_join_requests')
    .select('id, status')
    .eq('cluster_id', clusterId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    if (existing.status === 'pending') {
      return NextResponse.json({ error: "You already have a pending request" }, { status: 400 })
    }
    if (existing.status === 'accepted') {
      return NextResponse.json({ error: "You are already a member" }, { status: 400 })
    }
    // declined: allow re-request by inserting again (we use UNIQUE so we need to update or delete first)
    await supabase
      .from('cluster_join_requests')
      .delete()
      .eq('id', existing.id)
  }

  const { data: req, error: insertError } = await supabase
    .from('cluster_join_requests')
    .insert({
      cluster_id: clusterId,
      user_id: userId,
      status: 'pending',
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message || "Failed to submit request" }, { status: 500 })
  }

  const username = user.name || extractUsernameFromEmail(user.email || '')
  const { error: notificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: cluster.owner_id,
      type: 'cluster_join_request',
      title: 'Join request',
      message: `${username || user.email || 'Someone'} requested to join "${cluster.name}"`,
      cluster_id: clusterId,
      bug_id: req.id,
      read: false,
    })
  if (notificationError) {
    // Join request is still valid; notification is best-effort.
    console.error("Failed to create join-request notification:", notificationError)
  }

  return NextResponse.json({ message: "Join request sent", request: req }, { status: 201 })
}
