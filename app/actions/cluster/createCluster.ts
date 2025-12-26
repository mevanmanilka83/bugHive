"use server"

import { supabase, ensureValidUUID } from "@/lib/shared/shared"
import { requireAuth, getUsernameFromSession, type ActionResponse } from "@/lib/auth/helpers"
import { createErrorResponse, handleSupabaseError } from "../shared/errors"
import { validateWithSchema } from "../shared/validation"
import { getCreateClusterValidationSchema } from "./zod/createCluster"

export async function createCluster(
  prevState: any,
  formData: FormData
): Promise<ActionResponse<{ cluster?: any }>> {
  try {
    // Check authentication
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult
    }
    const { session } = authResult // session is guaranteed to be AuthenticatedSession here

    if (!formData) {
      return { success: false, error: "Form data is required" }
    }

    // Extract and validate form data
    const rawData = {
      name: (formData.get('name') as string) || '',
      description: (formData.get('description') as string) || '',
    }

    const validation = validateWithSchema(getCreateClusterValidationSchema(), rawData)
    if (!validation.success) {
      return validation
    }
    const { name, description } = validation.data

    // Get owner username
    const ownerUsername = getUsernameFromSession(session)
    const userId = ensureValidUUID(session.user.id)

    const clusterData = {
      name,
      description: description || null,
      owner_id: userId,
      owner_username: ownerUsername,
      members: [userId], // Owner is automatically a member
      members_usernames: [ownerUsername], // Owner is automatically a member
      invites: [],
    }

    const { data, error } = await supabase
      .from('clusters')
      .insert(clusterData)
      .select()
      .single()

    if (error) {
      return handleSupabaseError(error, 'Failed to create cluster')
    }

    return { 
      success: true, 
      cluster: data 
    }
  } catch (error) {
    return createErrorResponse(error)
  }
}

