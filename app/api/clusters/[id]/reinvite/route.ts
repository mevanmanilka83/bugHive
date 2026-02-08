import { checkAuth, ensureValidUUID, supabase } from "@/lib"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id: clusterId } = await context.params
  const userId = ensureValidUUID(user.id)
  const body = await request.json().catch(() => ({}))
  const inviteeId = ensureValidUUID(body.userId || "")

  if (!inviteeId) {
    return NextResponse.json({ error: "User is required" }, { status: 400 })
  }

  const { data: cluster, error: clusterError } = await supabase
    .from("clusters")
    .select("*")
    .eq("id", clusterId)
    .single()

  if (clusterError || !cluster) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 })
  }

  if (cluster.owner_id !== userId) {
    return NextResponse.json(
      { error: "Only cluster owners can resend invitations" },
      { status: 403 }
    )
  }

  if (!cluster.invites || !cluster.invites.includes(inviteeId)) {
    return NextResponse.json({ error: "No pending invitation found" }, { status: 400 })
  }

  const { data: invitee, error: inviteeError } = await supabase
    .from("users")
    .select("email, name")
    .eq("id", inviteeId)
    .single()

  if (inviteeError || !invitee) {
    return NextResponse.json({ error: "Invitee not found" }, { status: 404 })
  }

  const notificationData = {
    user_id: inviteeId,
    type: "cluster_invite",
    title: `Invitation to join ${cluster.name}`,
    message: `${user.email || user.name || "Someone"} invited you to join the cluster "${cluster.name}"`,
    cluster_id: clusterId,
    read: false,
  }

  const { error: notificationError } = await supabase
    .from("notifications")
    .insert(notificationData)

  if (notificationError) {
    return NextResponse.json(
      { error: notificationError.message || "Failed to resend invitation" },
      { status: 500 }
    )
  }

  return NextResponse.json({ message: "Invitation re-sent" }, { status: 200 })
}
