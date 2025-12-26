import { checkAuth, ensureValidUUID, supabase } from "@/lib"
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const userId = ensureValidUUID(user.id)
  const searchParams = request?.nextUrl?.searchParams
  if (!searchParams) {
    return NextResponse.json({ notifications: [] })
  }
  const unreadOnly = searchParams.get('unread') === 'true'

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (unreadOnly) {
    query = query.eq('read', false)
  }

  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
  query = query.limit(limit)

  const { data: notifications, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ notifications: notifications || [] })
}

export async function POST(request: NextRequest) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const body = await request.json().catch(() => ({}))

  const notificationData = {
    user_id: ensureValidUUID(user.id),
    type: body.type || 'cluster_invite',
    title: body.title,
    message: body.message || null,
    cluster_id: body.cluster_id || null,
    bug_id: body.bug_id || null,
    read: false,
  }

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert(notificationData)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ notification }, { status: 201 })
}
