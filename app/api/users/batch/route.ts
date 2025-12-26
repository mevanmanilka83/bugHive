/**
 * Batch User Fetch API Route
 * 
 * Purpose: HTTP endpoint for fetching multiple users at once
 * - GET /api/users/batch?ids=id1,id2,id3 - Fetch multiple users by their IDs
 * 
 * Why separate from /api/users/[id]?
 * - Cleaner API design - batch operations have dedicated endpoint
 * - Used by components that need to fetch multiple user profiles efficiently
 * - Reduces number of HTTP requests when displaying user lists
 */
import { checkAuth } from "@/lib/auth/helpers"
import { supabase } from "@/lib/shared/config/config"
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

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

