import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth/helpers"
import { errorResponse, successResponse } from "@/lib/errors"
import { voteOnBug, getUserVote } from "@/app/actions/bug/vote"
import { ensureValidUUID } from "@/lib"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAuth()
    if (authResult instanceof NextResponse) return authResult

    const { id: bugId } = await context.params
    const { user } = authResult

    if (!bugId) {
      return errorResponse("Bug ID is required", 400)
    }

    const result = await getUserVote(ensureValidUUID(bugId), user.id)

    if (!result.success) {
      return errorResponse(result.error || "Failed to fetch vote", 500)
    }

    return successResponse({ vote_type: result.vote_type }, 200)
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await checkAuth()
    if (authResult instanceof NextResponse) return authResult

    const { id: bugId } = await context.params
    const body = await request.json().catch(() => ({}))
    const voteType = body.vote_type

    if (!voteType || (voteType !== 'upvote' && voteType !== 'downvote')) {
      return errorResponse("vote_type must be 'upvote' or 'downvote'", 400)
    }

    if (!bugId) {
      return errorResponse("Bug ID is required", 400)
    }

    const result = await voteOnBug(ensureValidUUID(bugId), voteType)

    if (!result.success) {
      return errorResponse(result.error || "Failed to vote", 500)
    }

    return successResponse(result, 200)
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    )
  }
}

