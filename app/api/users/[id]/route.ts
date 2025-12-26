/**
 * User Data API Routes
 * 
 * Purpose: HTTP endpoints for fetching user data
 * - GET /api/users/[id] - Fetch single user by ID
 * - GET /api/users/[id]?ids=id1,id2,id3 - Batch fetch multiple users
 * 
 * Why API Routes here?
 * - Client-side components need HTTP endpoints to fetch user data
 * - Used by components like ClusterMembersDialog to get user details
 * - Provides RESTful API interface for user data access
 * 
 * Architecture:
 * - This module: API routes for reading user data (GET requests)
 * - /app/actions/User.ts: Server action for writing user data (saveUserToSupabase)
 * - /api/auth/signup: API route for user registration (uses saveUserToSupabase)
 */
import { checkAuth } from "@/lib/auth/helpers"
import { getSingleRecord } from "@/lib/database/database"
import { supabase } from "@/lib/config"
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
  
  // Check for batch request
  const searchParams = request.nextUrl.searchParams
  const ids = searchParams.get('ids')
  
  if (ids) {
    // Batch fetch multiple users
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
  
  // Single user fetch
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

