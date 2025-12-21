import { checkAuth, supabase, ensureValidUUID } from "@/lib/core"
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Generate deterministic UUID from email (same as auth.ts)
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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id: clusterId } = await context.params

  // Get cluster
  const { data: cluster, error: clusterError } = await supabase
    .from('clusters')
    .select('*')
    .eq('id', clusterId)
    .single()

  if (clusterError || !cluster) {
    return NextResponse.json({ error: "Cluster not found" }, { status: 404 })
  }

  // Check if user is owner or member
  const userId = ensureValidUUID(user.id)
  const isOwner = cluster.owner_id === userId
  const isMember = cluster.members && cluster.members.includes(userId)
  
  if (!isOwner && !isMember) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  // Get all member IDs (including owner)
  const allMemberIds = [
    cluster.owner_id,
    ...(cluster.members || [])
  ].filter((id, index, self) => self.indexOf(id) === index) // Remove duplicates

  // Check which users don't exist
  const { data: existingUsers } = await supabase
    .from('users')
    .select('id')
    .in('id', allMemberIds)

  const existingUserIds = new Set((existingUsers || []).map((u: any) => u.id))
  const missingUserIds = allMemberIds.filter((id: string) => !existingUserIds.has(id))

  if (missingUserIds.length === 0) {
    return NextResponse.json({ message: "All members have user records", created: 0 })
  }

  // Try to create user records for missing members
  // We can't reverse-engineer emails from UUIDs, so we'll create basic records
  const createdUsers = []
  for (const memberId of missingUserIds) {
    // Try to find email from notifications or other sources
    // For now, create a basic record with a placeholder
    const { error: createError } = await supabase
      .from('users')
      .upsert({
        id: memberId,
        email: null, // We don't know the email
        name: `User ${memberId.slice(0, 8)}`,
        image: null,
        email_verified: null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })

    if (!createError) {
      createdUsers.push(memberId)
    }
  }

  return NextResponse.json({ 
    message: `Created ${createdUsers.length} user record(s)`,
    created: createdUsers.length,
    total: missingUserIds.length
  })
}

