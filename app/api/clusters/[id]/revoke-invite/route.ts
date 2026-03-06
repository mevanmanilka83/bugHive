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
  const ownerId = ensureValidUUID(user.id)

  const body = await request.json().catch(() => ({}))
  const inviteeId = ensureValidUUID(body.userId || "")

  if (!inviteeId) {
    return NextResponse.json({ error: "User is required" }, { status: 400 })
  }

  const { data: cluster, error: clusterError } = await supabase
    .from("clusters")
    .select("id, name, owner_id, invites")
    .eq("id", clusterId)
    .single()

  if (clusterError || !cluster) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 })
  }

  if (cluster.owner_id !== ownerId) {
    return NextResponse.json(
      { error: "Only cluster owners can revoke invitations" },
      { status: 403 }
    )
  }

  const currentInvites = Array.isArray(cluster.invites) ? cluster.invites : []
  if (!currentInvites.includes(inviteeId)) {
    return NextResponse.json({ error: "No pending invitation found" }, { status: 400 })
  }

  const updatedInvites = currentInvites.filter((id: string) => id !== inviteeId)

  const { error: updateError } = await supabase
    .from("clusters")
    .update({ invites: updatedInvites })
    .eq("id", clusterId)

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || "Failed to revoke invitation" },
      { status: 500 }
    )
  }

  return NextResponse.json({ message: "Invitation revoked" }, { status: 200 })
}
