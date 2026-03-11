import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth/helpers"
import { getSupabaseAdmin, errorResponse, successResponse, stripMarkdownBold } from "@/lib"
import { ensureValidUUID } from "@/lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type PostBody = { content?: string }

type CommentReactionCount = { emoji: string; count: number }
type CommentRow = { id: string; content: string; created_at: string; user_id: string | null }

/**
 * GET /api/bugs/[id]/comments
 * List comments for a bug (for display on bug detail page).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bugId } = await context.params
    const uuid = ensureValidUUID(bugId)
    const supabase = getSupabaseAdmin()

    const { data: comments, error } = await supabase
      .from("bug_comments")
      .select("id, content, created_at, user_id")
      .eq("bug_id", uuid)
      .limit(50)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Bug comments list error:", error)
      return errorResponse(error.message || "Failed to load comments", 500)
    }

    const list = (comments ?? []) as CommentRow[]
    const commentIds = list.map((c) => c.id)
    const userIds = Array.from(new Set(list.map((c) => c.user_id).filter(Boolean))) as string[]

    let reactionCountsByComment: Record<string, CommentReactionCount[]> = {}
    let myReactionsByComment: Record<string, string[]> = {}

    if (commentIds.length > 0) {
      const { data: countsRows } = await supabase
        .from("comment_reactions")
        .select("comment_id, emoji")
        .in("comment_id", commentIds)

      // aggregate counts in-process (small list; avoids DB RPC complexity)
      const agg = new Map<string, Map<string, number>>()
      for (const r of (countsRows ?? []) as Array<{ comment_id: string; emoji: string }>) {
        if (!agg.has(r.comment_id)) agg.set(r.comment_id, new Map())
        const m = agg.get(r.comment_id)!
        m.set(r.emoji, (m.get(r.emoji) ?? 0) + 1)
      }
      reactionCountsByComment = Object.fromEntries(
        Array.from(agg.entries()).map(([commentId, m]) => [
          commentId,
          Array.from(m.entries()).map(([emoji, count]) => ({ emoji, count })),
        ])
      )

      // If logged in, include which emojis the current user has reacted with.
      const authResult = await checkAuth()
      if (!(authResult instanceof NextResponse)) {
        const uid = ensureValidUUID(authResult.user.id)
        const { data: myRows } = await supabase
          .from("comment_reactions")
          .select("comment_id, emoji")
          .eq("user_id", uid)
          .in("comment_id", commentIds)

        const mine = new Map<string, string[]>()
        for (const r of (myRows ?? []) as Array<{ comment_id: string; emoji: string }>) {
          const arr = mine.get(r.comment_id) ?? []
          arr.push(r.emoji)
          mine.set(r.comment_id, arr)
        }
        myReactionsByComment = Object.fromEntries(Array.from(mine.entries()))
      }
    }

    let userById: Record<string, { name?: string | null; email?: string | null; image?: string | null }> = {}
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, name, email, image")
        .in("id", userIds)
      userById = (users ?? []).reduce((acc: typeof userById, u: any) => {
        acc[u.id] = { name: u.name, email: u.email, image: u.image }
        return acc
      }, {})
    }

    const enriched = list.map((c) => {
      const user = c.user_id ? userById[c.user_id] : undefined
      const displayName = user?.name || user?.email || null
      return {
        ...c,
        author_name: displayName,
        author_image: user?.image ?? null,
        reactions: reactionCountsByComment[c.id] ?? [],
        my_reactions: myReactionsByComment[c.id] ?? [],
      }
    })

    return successResponse({ comments: enriched })
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
