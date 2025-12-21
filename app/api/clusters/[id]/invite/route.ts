import { checkAuth, supabase, ensureValidUUID } from "@/lib/core"
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
  const body = await request.json().catch(() => ({}))

  const inviteeEmail = body.email?.trim().toLowerCase()

  if (!inviteeEmail) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  // Get cluster to verify ownership
  const { data: cluster, error: clusterError } = await supabase
    .from('clusters')
    .select('*')
    .eq('id', clusterId)
    .single()

  if (clusterError || !cluster) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 })
  }

  // Check if user is the owner
  if (cluster.owner_id !== ensureValidUUID(user.id)) {
    return NextResponse.json({ error: "Only cluster owners can invite members" }, { status: 403 })
  }

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

  const inviteeUserId = generateUUIDFromEmailSync(inviteeEmail)

  // Check if user is already a member
  if (cluster.members && cluster.members.includes(inviteeUserId)) {
    return NextResponse.json({ error: "User is already a member of this cluster" }, { status: 400 })
  }

  // Check if user already has a pending invite
  if (cluster.invites && cluster.invites.includes(inviteeUserId)) {
    return NextResponse.json({ error: "User already has a pending invitation" }, { status: 400 })
  }

  // Add invitee to invites array
  const updatedInvites = [...(cluster.invites || []), inviteeUserId]

  // Update cluster with new invite
  const { error: updateError } = await supabase
    .from('clusters')
    .update({ invites: updatedInvites })
    .eq('id', clusterId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message || 'Failed to send invitation' }, { status: 500 })
  }

  // Create notification for the invitee
  const notificationData = {
    user_id: inviteeUserId,
    type: 'cluster_invite',
    title: `Invitation to join ${cluster.name}`,
    message: `${user.email || user.name || 'Someone'} invited you to join the cluster "${cluster.name}"`,
    cluster_id: clusterId,
    read: false,
  }

  const { error: notificationError } = await supabase
    .from('notifications')
    .insert(notificationData)

  if (notificationError) {
    console.error("Failed to create notification:", notificationError)
  }

  return NextResponse.json({ message: "Invitation sent successfully" }, { status: 201 })
}
