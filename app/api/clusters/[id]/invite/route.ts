import { checkAuth, ensureValidUUID, generateUUIDFromEmailSync, extractUsernameFromEmail, supabase, validateWithSchema } from "@/lib"
import { NextRequest, NextResponse } from "next/server"
import { getInviteUserValidationSchema } from "@/lib"

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

  try {
    const body = await request.json()

    const validation = validateWithSchema(
      getInviteUserValidationSchema(),
      { ...body, clusterId }
    )

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { inviteeEmail, inviteeUsername } = validation.data

    const { data: cluster, error: clusterError } = await supabase
      .from('clusters')
      .select('*')
      .eq('id', clusterId)
      .single()

    if (clusterError || !cluster) {
      return NextResponse.json({ error: "Cluster not found" }, { status: 404 })
    }

    if (cluster.owner_id !== userId) {
      return NextResponse.json({ error: "Only cluster owners can invite members" }, { status: 403 })
    }

    let finalEmail = inviteeEmail

    if (!finalEmail && inviteeUsername) {
      const { data: userData, error: userError } = await supabase
        .rpc('lookup_user_by_username', { p_username: inviteeUsername })

      if (userError) {
        return NextResponse.json({ 
          error: `Error looking up user: ${userError.message}` 
        }, { status: 500 })
      }

      if (!userData || userData.length === 0 || !userData[0]) {
        return NextResponse.json({ 
          error: `User not found with username "${inviteeUsername}". Please check the username or use email address instead.` 
        }, { status: 404 })
      }

      finalEmail = userData[0].email
    }

    if (!finalEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const inviteeUserId = generateUUIDFromEmailSync(finalEmail)

    if (cluster.members && cluster.members.includes(inviteeUserId)) {
      return NextResponse.json({ error: "User is already a member of this cluster" }, { status: 400 })
    }

    if (cluster.invites && cluster.invites.includes(inviteeUserId)) {
      return NextResponse.json({ error: "User already has a pending invitation" }, { status: 400 })
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', inviteeUserId)
      .single()

    if (!existingUser) {
      const username = extractUsernameFromEmail(finalEmail)
      await supabase
        .from('users')
        .upsert({
          id: inviteeUserId,
          email: finalEmail,
          name: username,
          image: null,
          email_verified: null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        })
    }

    const updatedInvites = [...(cluster.invites || []), inviteeUserId]

    const { error: updateError } = await supabase
      .from('clusters')
      .update({ invites: updatedInvites })
      .eq('id', clusterId)

    if (updateError) {
      return NextResponse.json({ 
        error: updateError.message || 'Failed to send invitation' 
      }, { status: 500 })
    }

    const notificationData = {
      user_id: inviteeUserId,
      type: 'cluster_invite',
      title: `Invitation to join ${cluster.name}`,
      message: `${user.email || user.name || 'Someone'} invited you to join the cluster "${cluster.name}"`,
      cluster_id: clusterId,
      read: false,
    }

    await supabase
      .from('notifications')
      .insert(notificationData)

    return NextResponse.json({ 
      message: "Invitation sent successfully",
      cluster 
    }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 })
  }
}
