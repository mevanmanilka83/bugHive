import { checkAuth, ensureValidUUID, supabase } from "@/lib"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET: List saved bug IDs for the current user. */
export async function GET() {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult
  const userId = ensureValidUUID(authResult.user.id)

  const { data, error } = await supabase
    .from("saved_bugs")
    .select("bug_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const savedBugIds = (data || []).map((row: { bug_id: string }) => row.bug_id)
  return NextResponse.json({ savedBugIds })
}

/** POST: Save a bug. Body: { bug_id: string } */
export async function POST(request: NextRequest) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult
  const userId = ensureValidUUID(authResult.user.id)

  const body = await request.json().catch(() => ({}))
  const bugId = body.bug_id ? ensureValidUUID(String(body.bug_id)) : null
  if (!bugId) {
    return NextResponse.json({ error: "bug_id is required" }, { status: 400 })
  }

  const { error } = await supabase.from("saved_bugs").insert({
    user_id: userId,
    bug_id: bugId,
  })

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ saved: true })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ saved: true })
}

/** DELETE: Unsave a bug. Query: ?bug_id=... */
export async function DELETE(request: NextRequest) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult
  const userId = ensureValidUUID(authResult.user.id)

  const url = new URL(request.url)
  const bugId = url.searchParams.get("bug_id")
  const validBugId = bugId ? ensureValidUUID(bugId) : null
  if (!validBugId) {
    return NextResponse.json({ error: "bug_id is required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("saved_bugs")
    .delete()
    .eq("user_id", userId)
    .eq("bug_id", validBugId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ saved: false })
}
