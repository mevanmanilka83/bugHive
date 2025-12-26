import { checkAuth } from "@/lib/auth/helpers"
import { ensureValidUUID, generateUUIDFromEmailSync } from "@/lib/utils"
import { supabase } from "@/lib/shared/config/config"
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

