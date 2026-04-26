import { checkAuth, ensureValidUUID, supabase } from "@/lib"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult
  const userId = ensureValidUUID(authResult.user.id)

  const { data: savedRows, error: savedError } = await supabase
    .from("saved_bugs")
    .select("bug_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (savedError) {
    return NextResponse.json({ error: savedError.message }, { status: 500 })
  }

  const bugIds = (savedRows || []).map((r: { bug_id: string }) => r.bug_id)
  if (bugIds.length === 0) {
    return NextResponse.json({ bugs: [] })
  }

  const { data: bugs, error: bugsError } = await supabase
    .from("bugs")
    .select("*")
    .in("id", bugIds)

  if (bugsError) {
    return NextResponse.json({ error: bugsError.message }, { status: 500 })
  }

  const orderMap = new Map(bugIds.map((id, i) => [id, i]))
  const sorted = (bugs || []).sort(
    (a: { id: string }, b: { id: string }) =>
      (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999)
  )

  return NextResponse.json({ bugs: sorted })
}
