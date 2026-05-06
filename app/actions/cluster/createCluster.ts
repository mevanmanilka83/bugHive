"use server"

import {
  ensureValidUUID,
  generateUUIDFromEmailSync,
  extractUsernameFromEmail,
  supabase,
  requireAuth,
  getUsernameFromSession,
  createErrorResponse,
  handleSupabaseError,
  validateWithSchema,
  normalizeClusterDescription,
  type ActionResponse
} from "@/lib"
import { getClusterSchema } from "@/lib"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseInviteEmails(raw: string): { emails: string[]; invalid: string[] } {
  const parts = raw
    .split(/[\n,;]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  const uniqueEmails = Array.from(new Set(parts))
  const invalid = uniqueEmails.filter((email) => !EMAIL_PATTERN.test(email))
  const emails = uniqueEmails.filter((email) => EMAIL_PATTERN.test(email))

  return { emails, invalid }
}

export async function createCluster(
  prevState: any,
  formData: FormData
): Promise<ActionResponse<{ cluster?: any }>> {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) {
      return authResult
    }
    const { session } = authResult

    if (!formData) {
      return { success: false, error: "Form data is required" }
    }

    const rawData = {
      name: (formData.get('name') as string) || '',
      description: (formData.get('description') as string) || '',
      visibility: (formData.get('visibility') as string) || 'private',
    }

    const validation = validateWithSchema(getClusterSchema(), rawData)
    if (!validation.success) {
      return validation
    }
    const { name, description, visibility } = validation.data

    const descriptionResult = normalizeClusterDescription(description)
    if (!descriptionResult.success) {
      return { success: false, error: descriptionResult.error }
    }

    const rawInviteEmails = String(formData.get("inviteEmails") || "")
    const { emails: parsedInviteEmails, invalid: invalidInviteEmails } = parseInviteEmails(rawInviteEmails)

    if (invalidInviteEmails.length > 0) {
      return {
        success: false,
        error: `Invalid email address: ${invalidInviteEmails[0]}`,
      }
    }

    if (parsedInviteEmails.length > 25) {
      return {
        success: false,
        error: "You can invite up to 25 emails when creating a cluster",
      }
    }

    const ownerUsername = getUsernameFromSession(session)
    const userId = ensureValidUUID(session.user.id)
    const ownerEmail = (session.user.email || "").toLowerCase().trim()

    const inviteEmails = parsedInviteEmails.filter((email) => email !== ownerEmail)
    const inviteTargets = inviteEmails.map((email) => ({
      email,
      userId: generateUUIDFromEmailSync(email),
    }))

    const clusterData = {
      name,
      description: descriptionResult.value,
      visibility,
      owner_id: userId,
      owner_username: ownerUsername,
      members: [userId],
      members_usernames: [ownerUsername],
      invites: inviteTargets.map((target) => target.userId),
    }

    const { data, error } = await supabase
      .from('clusters')
      .insert(clusterData)
      .select()
      .single()

    if (error) {
      return handleSupabaseError(error, 'Failed to create cluster')
    }

    if (inviteTargets.length > 0) {
      const userUpserts = inviteTargets.map((target) => {
        const username = extractUsernameFromEmail(target.email)
        return supabase
          .from("users")
          .upsert(
            {
              id: target.userId,
              email: target.email,
              name: username,
              image: null,
              email_verified: null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          )
      })

      const userUpsertResults = await Promise.all(userUpserts)
      const upsertError = userUpsertResults.find((result) => result.error)?.error
      if (upsertError) {
        return {
          success: true,
          cluster: data,
        }
      }

      const notifications = inviteTargets.map((target) => ({
        user_id: target.userId,
        type: "cluster_invite",
        title: `Invitation to join ${name}`,
        message: `${session.user.email || session.user.name || "Someone"} invited you to join the cluster "${name}"`,
        cluster_id: data.id,
        read: false,
      }))

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications)

      if (notificationError) {
        return {
          success: true,
          cluster: data,
        }
      }
    }

    return { 
      success: true, 
      cluster: data 
    }
  } catch (error) {
    return createErrorResponse(error)
  }
}

