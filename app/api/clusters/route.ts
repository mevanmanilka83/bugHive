import { checkAuth, supabase, ensureValidUUID, addTimestamps, insertRecord } from "@/lib/core"
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const userId = ensureValidUUID(user.id)

  // Get clusters where user is owner or member
  const { data: clusters, error } = await supabase
    .from('clusters')
    .select('*')
    .or(`owner_id.eq.${userId},members.cs.{${userId}}`)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ clusters: clusters || [] })
}

export async function POST(request: NextRequest) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const body = await request.json().catch(() => ({}))

  const name = body.name?.trim()
  const description = body.description?.trim() || null

  if (!name || name.length < 3) {
    return NextResponse.json({ error: "Cluster name is required and must be at least 3 characters" }, { status: 400 })
  }

  const clusterData = addTimestamps({
    name,
    description,
    owner_id: ensureValidUUID(user.id),
    members: [ensureValidUUID(user.id)],
    invites: [],
  })

  const cluster = await insertRecord('clusters', clusterData)
  return NextResponse.json({ cluster }, { status: 201 })
}
