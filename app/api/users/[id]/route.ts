import { checkAuth, getSingleRecord, supabase } from "@/lib"
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

  const { id } = await context.params
  
  const searchParams = request.nextUrl.searchParams
  const ids = searchParams.get('ids')
  
  if (ids) {
    try {
      const userIds = ids.split(',').filter(Boolean)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds)
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ users: data || [] })
    } catch (error) {
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }
  }
  
  try {
    const user = await getSingleRecord('users', id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
}

