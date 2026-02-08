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

  const { data: cluster, error: clusterError } = await supabase
    .from("clusters")
    .select("*")
    .eq("id", clusterId)
    .single()

  if (clusterError || !cluster) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 })
  }

  if (!cluster.invites || !cluster.invites.includes(userId)) {
    return NextResponse.json({ error: "No pending invitation found" }, { status: 400 })
  }

  const updatedInvites = (cluster.invites || []).filter((id: string) => id !== userId)

  const { error: updateError } = await supabase
    .from("clusters")
    .update({ invites: updatedInvites })
    .eq("id", clusterId)

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || "Failed to decline invitation" },
      { status: 500 }
    )
  }

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("cluster_id", clusterId)
    .eq("type", "cluster_invite")

  return NextResponse.json({ message: "Invitation declined" }, { status: 200 })
}
