"use server"

import {
  ensureValidUUID,
  getSupabaseAdmin,
  requireAuth,
  createErrorResponse,
  handleSupabaseError,
  type ActionResponse
} from "@/lib"

export type SolutionVoteType = "upvote" | "downvote"

export interface SolutionVoteResult {
  solution_id: string
  vote_type: SolutionVoteType | null
  upvotes_count: number
  downvotes_count: number
}

export async function voteOnSolution(
  solutionId: string,
  voteType: SolutionVoteType
): Promise<ActionResponse<SolutionVoteResult>> {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult
    }
    const { session } = authResult
    const userId = ensureValidUUID(session.user.id)
    const db = getSupabaseAdmin() as any

    const { data: solution, error: solutionError } = await db
      .from("bug_solution_details")
      .select("id")
      .eq("id", ensureValidUUID(solutionId))
      .single()

    if (solutionError || !solution) {
      return {
        success: false,
        error: "Solution not found",
      }
    }

    const { data: existingVoteData, error: voteError } = await db
      .from("solution_votes" as any)
      .select("id, vote_type")
      .eq("solution_id", ensureValidUUID(solutionId))
      .eq("user_id", userId)
      .single()

    const existingVote = existingVoteData as { id: string; vote_type: SolutionVoteType } | null

    if (voteError && voteError.code !== "PGRST116") {
      return handleSupabaseError(voteError, "Failed to check existing vote")
    }

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        const { error: deleteError } = await db
          .from("solution_votes")
          .delete()
          .eq("id", existingVote.id)

        if (deleteError) {
          return handleSupabaseError(deleteError, "Failed to remove vote")
        }
      } else {
        const { error: updateError } = await db
          .from("solution_votes")
          .update({ vote_type: voteType, updated_at: new Date().toISOString() })
          .eq("id", existingVote.id)

        if (updateError) {
          return handleSupabaseError(updateError, "Failed to change vote")
        }
      }
    } else {
      const { error: insertError } = await db
        .from("solution_votes")
        .insert({
          solution_id: ensureValidUUID(solutionId),
          user_id: userId,
          vote_type: voteType,
        })

      if (insertError) {
        return handleSupabaseError(insertError, "Failed to create vote")
      }
    }

    const { data: solutionWithVotes, error: fetchError } = await db
      .from("bug_solution_details")
      .select("upvotes_count, downvotes_count")
      .eq("id", ensureValidUUID(solutionId))
      .single()

    if (fetchError) {
      return handleSupabaseError(fetchError, "Failed to fetch vote counts")
    }

    const { data: userVote } = await db
      .from("solution_votes")
      .select("vote_type")
      .eq("solution_id", ensureValidUUID(solutionId))
      .eq("user_id", userId)
      .single()

    return {
      success: true,
      solution_id: solutionId,
      vote_type: userVote?.vote_type || null,
      upvotes_count: solutionWithVotes?.upvotes_count || 0,
      downvotes_count: solutionWithVotes?.downvotes_count || 0,
    }
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function getUserSolutionVote(
  solutionId: string,
  userId: string
): Promise<ActionResponse<{ vote_type: SolutionVoteType | null }>> {
  try {
    const db = getSupabaseAdmin() as any
    const { data: vote, error } = await db
      .from("solution_votes")
      .select("vote_type")
      .eq("solution_id", ensureValidUUID(solutionId))
      .eq("user_id", ensureValidUUID(userId))
      .single()

    if (error && error.code !== "PGRST116") {
      return handleSupabaseError(error, "Failed to fetch user solution vote")
    }

    return {
      success: true,
      vote_type: vote?.vote_type || null,
    }
  } catch (error) {
    return createErrorResponse(error)
  }
}

