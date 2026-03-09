import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth/helpers"
import { getSupabaseAdmin, errorResponse, successResponse, stripMarkdownBold } from "@/lib"
import { ensureValidUUID } from "@/lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type PostBody = { content?: string }

/**
 * GET /api/bugs/[id]/comments
 * List comments for a bug (for display on bug detail page).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bugId } = await context.params
    const uuid = ensureValidUUID(bugId)
    const supabase = getSupabaseAdmin()
    const { data: bug } = await supabase.from("bugs").select("id, visibility, created_by").eq("id", uuid).single()
    if (!bug) {
      return errorResponse("Bug not found", 404)
    }

    const { data: comments, error } = await supabase
      .from("bug_comments")
      .select("id, content, created_at, user_id")
      .eq("bug_id", uuid)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Bug comments list error:", error)
      return errorResponse(error.message || "Failed to load comments", 500)
    }

    return successResponse({ comments: comments ?? [] })
  } catch (e) {
    console.error("Bug comments GET error:", e)
    return errorResponse(e instanceof Error ? e.message : "Internal server error", 500)
  }
}

/**
 * POST /api/bugs/[id]/comments
 * Add a comment on a bug (e.g. "Merge & Follow" from Duplicate Radar).
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAuth()
    if (authResult instanceof NextResponse) return authResult

    const { id: bugId } = await context.params
    const uuid = ensureValidUUID(bugId)
    const body = (await request.json().catch(() => ({}))) as PostBody
    let content = typeof body.content === "string" ? body.content.trim().slice(0, 10000) : ""
    content = stripMarkdownBold(content)

    if (!content) {
      return errorResponse("Comment content is required", 400)
    }

    const supabase = getSupabaseAdmin()
    const { data: bug } = await supabase.from("bugs").select("id, visibility, created_by").eq("id", uuid).single()
    if (!bug) {
      return errorResponse("Bug not found", 404)
    }

    const { user } = authResult
    const { data: comment, error } = await supabase
      .from("bug_comments")
      .insert({
        bug_id: uuid,
        user_id: user.id,
        content,
      })
      .select("id, created_at")
      .single()

    if (error) {
      console.error("Bug comment insert error:", error)
      return errorResponse(error.message || "Failed to add comment", 500)
    }

    return successResponse({ comment: { id: comment.id, created_at: comment.created_at }, bug_id: uuid })
  } catch (e) {
    console.error("Bug comments API error:", e)
    return errorResponse(e instanceof Error ? e.message : "Internal server error", 500)
  }
}
