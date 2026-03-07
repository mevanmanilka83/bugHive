import { NextRequest, NextResponse } from "next/server"
import {
  createBugHandler,
  checkAuth,
  extractRouteId,
  updateRecord,
  addTimestamps,
  ensureValidUUID,
  supabase,
} from "@/lib"
import { awardBugXP, checkFirstResponderBadge, checkOnFireBadge } from "@/lib"

const bugHandler = createBugHandler()
const ALLOWED_PATCH_FIELDS = [
  "status",
  "priority",
  "assigned_to",
  "title",
  "description",
  "visibility",
] as const

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const GET = bugHandler.GET
export const DELETE = bugHandler.DELETE

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

  const id = await extractRouteId(context)
  const body = await request.json().catch(() => ({}))
  const updateData: Record<string, unknown> = {}
  for (const field of ALLOWED_PATCH_FIELDS) {
    if (body[field] !== undefined) {
      updateData[field] = field === "assigned_to" ? (body[field] || null) : body[field]
    }
  }
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    )
  }

  const updated = await updateRecord(
    "bugs",
    id,
    addTimestamps(updateData),
    "id"
  )

  let xpEarned = 0
  if (updateData.status !== undefined || updateData.assigned_to !== undefined) {
    xpEarned = await awardBugXP(authResult.user.id, "triage")
    checkFirstResponderBadge(authResult.user.id, id).catch(() => {})
    checkOnFireBadge(authResult.user.id).catch(() => {})
  }

  const newAssigneeId =
    typeof updateData.assigned_to === "string" && updateData.assigned_to.trim()
      ? updateData.assigned_to.trim()
      : null
  if (newAssigneeId) {
    try {
      const assigneeId = ensureValidUUID(newAssigneeId)
      const bugTitle = (updated?.title || "A bug").toString()
      const assignerName = authResult.user?.name || authResult.user?.email || "Someone"
      await supabase.from("notifications").insert({
        user_id: assigneeId,
        type: "bug_assigned",
        title: `Assigned: ${bugTitle}`,
        message: `${assignerName} assigned you to the bug "${bugTitle}"`,
        bug_id: id,
        read: false,
      })
    } catch (e) {
      console.error("Failed to create bug_assigned notification:", e)
    }
  }

  return NextResponse.json({ bug: updated, xpEarned: xpEarned || undefined })
}