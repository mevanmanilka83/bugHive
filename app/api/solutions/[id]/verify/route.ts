import { NextRequest, NextResponse } from "next/server"
import { checkAuth, supabase, ensureValidUUID } from "@/lib"
import { awardBugXP, checkDeepDiverBadge, checkOnFireBadge } from "@/lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

  const solutionId = await (async () => {
    const { id } = await context.params
    return ensureValidUUID(id)
  })()

  const { data: solution, error: fetchErr } = await supabase
    .from("bug_solution_details")
    .select("id, created_by, verified_at, bug_id")
    .eq("id", solutionId)
    .single()

  if (fetchErr || !solution) {
    return NextResponse.json({ error: "Solution not found" }, { status: 404 })
  }

  if (solution.verified_at) {
    return NextResponse.json({ error: "Solution already verified", solution }, { status: 400 })
  }

  const verifierId = authResult.user.id
  const creatorId = solution.created_by

  if (creatorId === verifierId) {
    return NextResponse.json({ error: "You cannot verify your own solution" }, { status: 400 })
  }

  const { error: updateErr } = await supabase
    .from("bug_solution_details")
    .update({
      verified_at: new Date().toISOString(),
      verified_by: verifierId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", solutionId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  const xp = await awardBugXP(creatorId, "solution_verified", { solutionId, bugId: solution.bug_id })
  checkDeepDiverBadge(creatorId).catch(() => {})
  checkOnFireBadge(creatorId).catch(() => {})

  return NextResponse.json({
    success: true,
    message: "Solution verified",
    xpAwardedToCreator: xp,
  })
}
