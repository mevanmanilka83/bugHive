import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth/helpers"
import { getSupabaseAdmin, errorResponse, successResponse, deleteRecord } from "@/lib"
import { ensureValidUUID } from "@/lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * DELETE /api/comments/[commentId]
 * Delete a comment. Only the author can delete.
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ commentId: string }> }
) {
    try {
        const authResult = await checkAuth()
        if (authResult instanceof NextResponse) return authResult

        const { commentId } = await context.params
        const uuid = ensureValidUUID(commentId)
        const supabase = getSupabaseAdmin()

        // 1. Fetch the comment to check ownership
        const { data: comment, error: fetchError } = await supabase
            .from("bug_comments")
            .select("user_id")
            .eq("id", uuid)
            .single<{ user_id: string }>()

        if (fetchError || !comment) {
            return errorResponse("Comment not found", 404)
        }

        // 2. Security: Check if the current user is the author
        if (comment.user_id !== authResult.user.id) {
            return errorResponse("Unauthorized: You can only delete your own comments", 403)
        }

        // 3. Delete the comment
        const { error: deleteError } = await supabase
            .from("bug_comments")
            .delete()
            .eq("id", uuid)

        if (deleteError) {
            console.error("Delete comment error:", deleteError)
            return errorResponse(deleteError.message || "Failed to delete comment", 500)
        }

        return successResponse({ message: "Comment deleted" })
    } catch (e) {
        console.error("Comment DELETE API error:", e)
        return errorResponse(e instanceof Error ? e.message : "Internal server error", 500)
    }
}
