import { supabase } from "@/lib"
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ids = searchParams.get('ids')
  
  if (!ids) {
    return NextResponse.json({ error: "ids parameter is required" }, { status: 400 })
  }

  try {
    const userIds = ids.split(',').filter(Boolean)
    
    if (userIds.length === 0) {
      return NextResponse.json({ users: [] })
    }

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

