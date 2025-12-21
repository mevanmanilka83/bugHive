import { checkAuth, supabase, ensureValidUUID, addTimestamps, insertRecord } from "@/lib/core"
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const userId = ensureValidUUID(user.id)

  // Get all clusters and filter where user is owner or member
  // This is more reliable than using Supabase array operators
  const { data: allClusters, error } = await supabase
    .from('clusters')
    .select('*')
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Filter clusters where user is owner or member
  const clusters = (allClusters || []).filter((cluster: any) => {
    const isOwner = cluster.owner_id === userId
    const isMember = cluster.members && 
                     Array.isArray(cluster.members) && 
                     cluster.members.includes(userId)
    return isOwner || isMember
  })

  return NextResponse.json({ clusters })
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

  // Get owner username
  const ownerEmail = user.email || ''
  const ownerUsername = user.name || (ownerEmail ? ownerEmail.split('@')[0] : 'User')

  const clusterData = addTimestamps({
    name,
    description,
    owner_id: ensureValidUUID(user.id),
    owner_username: ownerUsername,
    members: [ensureValidUUID(user.id)],
    members_usernames: [ownerUsername],
    invites: [],
  })

  const cluster = await insertRecord('clusters', clusterData)
  return NextResponse.json({ cluster }, { status: 201 })
}
