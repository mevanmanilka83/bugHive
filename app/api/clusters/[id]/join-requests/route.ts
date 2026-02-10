import { checkAuth, ensureValidUUID, supabase } from "@/lib"
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
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
    .select('id, owner_id')
    .eq('id', clusterId)
    .single()

  if (clusterError || !cluster) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 })
  }

  if (cluster.owner_id !== userId) {
    return NextResponse.json({ error: "Only the cluster owner can view join requests" }, { status: 403 })
  }

  const { data: requests, error } = await supabase
    .from('cluster_join_requests')
    .select('id, user_id, status, created_at')
    .eq('cluster_id', clusterId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const userIds = [...new Set((requests || []).map((r: any) => r.user_id))]
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email, image')
    .in('id', userIds)

  const userMap = (users || []).reduce((acc: Record<string, any>, u: any) => {
    acc[u.id] = u
    return acc
  }, {})

  const list = (requests || []).map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    status: r.status,
    created_at: r.created_at,
    user: userMap[r.user_id] || { id: r.user_id, name: null, email: null, image: null },
  }))

  return NextResponse.json({ join_requests: list })
}
