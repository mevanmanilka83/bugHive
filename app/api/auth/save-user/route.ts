import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/core"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, email, name, image, email_verified } = body

    if (!email || !id) {
      return NextResponse.json({ error: "Email and ID are required" }, { status: 400 })
    }

    // Use upsert to create or update user record
    // onConflict: 'email' will update existing user if email matches
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        id,
        email,
        name: name || email.split('@')[0],
        image,
        email_verified,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'email'
      })

    if (upsertError) {
      console.error('Error saving user to Supabase:', upsertError)
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "User data saved successfully" }, { status: 200 })
  } catch (error) {
    console.error('Error in save-user API:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 })
  }
}
