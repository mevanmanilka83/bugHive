"use server"

import {
  ensureValidUUID,
  supabase,
  requireAuth,
  createErrorResponse,
  handleSupabaseError,
  type ActionResponse
} from "@/lib"

export type VoteType = "upvote" | "downvote"

export interface VoteResult {
  bug_id: string
  vote_type: VoteType | null
  upvotes_count: number
  downvotes_count: number
}

/**
 * Vote on a bug (upvote or downvote)
 * If user already voted with the same type, removes the vote
 * If user voted with different type, changes the vote
 */
export async function voteOnBug(
  bugId: string,
  voteType: VoteType
): Promise<ActionResponse<VoteResult>> {
  try {
    // Check authentication
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult
    }
    const { session } = authResult
    const userId = ensureValidUUID(session.user.id)

    // Validate bug exists
    const { data: bug, error: bugError } = await supabase
      .from('bugs')
      .select('id')
      .eq('id', ensureValidUUID(bugId))
      .single()

    if (bugError || !bug) {
      return {
        success: false,
        error: "Bug not found"
      }
    }

    // Check if user already voted
    const { data: existingVote, error: voteError } = await supabase
      .from('bug_votes')
      .select('id, vote_type')
      .eq('bug_id', ensureValidUUID(bugId))
      .eq('user_id', userId)
      .single()

    if (voteError && voteError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return handleSupabaseError(voteError, 'Failed to check existing vote')
    }

    if (existingVote) {
      // User already voted - can only remove their vote, not change it
      if (existingVote.vote_type === voteType) {
        // Same vote type - remove the vote (toggle off)
        const { error: deleteError } = await supabase
          .from('bug_votes')
          .delete()
          .eq('id', existingVote.id)

        if (deleteError) {
          return handleSupabaseError(deleteError, 'Failed to remove vote')
        }
      } else {
        // Different vote type - user already voted, cannot change vote
        // Return current vote status without making changes
        const { data: bugWithVotes, error: fetchError } = await supabase
          .from('bugs')
          .select('upvotes_count, downvotes_count')
          .eq('id', ensureValidUUID(bugId))
          .single()

        if (fetchError) {
          return handleSupabaseError(fetchError, 'Failed to fetch vote counts')
        }

        return {
          success: true,
          bug_id: bugId,
          vote_type: existingVote.vote_type,
          upvotes_count: bugWithVotes?.upvotes_count || 0,
          downvotes_count: bugWithVotes?.downvotes_count || 0
        }
      }
    } else {
      // New vote - insert
      const { error: insertError } = await supabase
        .from('bug_votes')
        .insert({
          bug_id: ensureValidUUID(bugId),
          user_id: userId,
          vote_type: voteType
        })

      if (insertError) {
        return handleSupabaseError(insertError, 'Failed to create vote')
      }
    }

    // Get updated vote counts and user's current vote
    const { data: bugWithVotes, error: fetchError } = await supabase
      .from('bugs')
      .select('upvotes_count, downvotes_count')
      .eq('id', ensureValidUUID(bugId))
      .single()

    if (fetchError) {
      return handleSupabaseError(fetchError, 'Failed to fetch vote counts')
    }

    // Get user's current vote status
    const { data: userVote } = await supabase
      .from('bug_votes')
      .select('vote_type')
      .eq('bug_id', ensureValidUUID(bugId))
      .eq('user_id', userId)
      .single()

    return {
      success: true,
      bug_id: bugId,
      vote_type: userVote?.vote_type || null,
      upvotes_count: bugWithVotes?.upvotes_count || 0,
      downvotes_count: bugWithVotes?.downvotes_count || 0
    }
  } catch (error) {
    return createErrorResponse(error)
  }
}

/**
 * Get user's vote status for a bug
 */
export async function getUserVote(
  bugId: string,
  userId: string
): Promise<ActionResponse<{ vote_type: VoteType | null }>> {
  try {
    const { data: vote, error } = await supabase
      .from('bug_votes')
      .select('vote_type')
      .eq('bug_id', ensureValidUUID(bugId))
      .eq('user_id', ensureValidUUID(userId))
      .single()

    if (error && error.code !== 'PGRST116') {
      return handleSupabaseError(error, 'Failed to fetch user vote')
    }

    return {
      success: true,
      vote_type: vote?.vote_type || null
    }
  } catch (error) {
    return createErrorResponse(error)
  }
}

