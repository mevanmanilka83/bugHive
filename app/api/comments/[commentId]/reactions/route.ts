import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth/helpers"
import { ensureValidUUID, errorResponse, successResponse, getSupabaseAdmin } from "@/lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const ALLOWED = new Set(["👍", "🎉", "👀", "❤️"])

type Body = { emoji?: string }

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ commentId: string }> }
) {
  try {
    const authResult = await checkAuth()
    if (authResult instanceof NextResponse) return authResult

    const { commentId } = await context.params
    const cid = ensureValidUUID(commentId)

    const body = (await request.json().catch(() => ({}))) as Body
    const emoji = typeof body.emoji === "string" ? body.emoji.trim() : ""
    if (!ALLOWED.has(emoji)) {
      return errorResponse("Invalid reaction emoji", 400)
    }

    const supabase = (await getSupabaseAdmin()) as any

    const { data: comment } = await supabase
      .from("bug_comments")
      .select("id")
      .eq("id", cid)
      .single()
    if (!comment) return errorResponse("Comment not found", 404)

    const uid = ensureValidUUID(authResult.user.id)

    const { data: existing } = await supabase
      .from("comment_reactions")
      .select("id, emoji")
      .eq("comment_id", cid)
      .eq("user_id", uid)

    const existingRows = (existing || []) as Array<{ id: string; emoji: string }>
    const current = existingRows.find((r) => r.emoji === emoji)

    if (current?.id) {
      const { error } = await supabase
        .from("comment_reactions")
        .delete()
        .eq("id", current.id)
      if (error) return errorResponse("Failed to remove reaction", 500)
    } else {
      if (existingRows.length > 0) {
        const ids = existingRows.map((r) => r.id)
        const { error: deleteError } = await supabase
          .from("comment_reactions")
          .delete()
          .in("id", ids)
        if (deleteError) return errorResponse("Failed to update reaction", 500)
      }
      const { error } = await supabase
        .from("comment_reactions")
        .insert({ comment_id: cid, user_id: uid, emoji })
      if (error) return errorResponse("Failed to add reaction", 500)
    }

    return successResponse({ ok: true })
  } catch (e) {
    console.error("Comment reactions API error:", e)
    return errorResponse(e instanceof Error ? e.message : "Internal server error", 500)
  }
}

