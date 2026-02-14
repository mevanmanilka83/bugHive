"use server"

import { supabase, generateUUIDFromEmailSync, uploadAvatarFile } from "@/lib"
import { getUpdateProfileValidationSchema, getChangePasswordValidationSchema } from "@/lib/schemas/zod"
import { auth } from "@/lib/auth/config"
import type { ActionResponse } from "@/lib/auth/helpers" 

/**
 * Update user profile (name and email)
 */
export async function updateProfile(formData: FormData): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    // Email field is disabled in the form so it may not be submitted; use session email when missing
    const nameFromForm = (formData.get("name") ?? "") as string
    const emailFromForm = (formData.get("email") ?? "") as string
    const email = emailFromForm.trim() || session.user.email?.trim() || ""

    const data = { name: nameFromForm, email }
    const validation = getUpdateProfileValidationSchema().safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Validation failed",
      }
    }

    const { name } = validation.data
    const currentUserId = session.user.id

    // Check if email is being changed and if it's already taken by another user
    if (email.toLowerCase() !== session.user.email?.toLowerCase()) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser && existingUser.id !== currentUserId) {
        return { success: false, error: "This email is already in use" }
      }

      // If email changed, generate new UUID
      const newUserId = generateUUIDFromEmailSync(email)
      
      // Note: Email changes require careful handling of related records
      // For now, we'll prevent email changes to avoid data integrity issues
      return { 
        success: false, 
        error: "Email changes are currently not supported. Please contact support." 
      }
    }

    // Update user profile (name only for now)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentUserId)

    if (updateError) {
      console.error("Profile update error:", updateError)
      return { success: false, error: "Failed to update profile" }
    }

    return { success: true, message: "Profile updated successfully" }
  } catch (error) {
    console.error("Update profile error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Upload avatar image and save URL to the database (users.image).
 * If you don't have an avatar from your auth provider, you can upload one here.
 */
export async function uploadAvatar(formData: FormData): Promise<
  ActionResponse<{ imageUrl?: string }>
> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }
    const file = formData.get("avatar")
    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: "Please choose an image to upload." }
    }
    const imageUrl = await uploadAvatarFile(file, session.user.id)
    const { error: updateError } = await supabase
      .from("users")
      .update({
        image: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id)
    if (updateError) {
      console.error("Avatar DB update error:", updateError)
      return { success: false, error: "Failed to save avatar to profile." }
    }
    return { success: true, message: "Avatar updated.", imageUrl }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload avatar."
    console.error("Upload avatar error:", error)
    return { success: false, error: message }
  }
}

/**
 * Change user password
 * 
 * Note: This is a placeholder implementation since the current Credentials provider
 * doesn't validate passwords. In a production app, you would:
 * 1. Store hashed passwords in the database
 * 2. Validate current password against the hash
 * 3. Hash and store the new password
 */
export async function changePassword(formData: FormData): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }
    const provider = (session.user as { provider?: string }).provider
    const oauthProviders = ["github", "google", "apple", "facebook", "twitter", "discord"]
    if (provider && oauthProviders.includes(provider.toLowerCase())) {
      return {
        success: false,
        error: "You signed in with an OAuth provider. Password change is only available when you sign in with email and password.",
      }
    }

    const data = {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    }

    const validation = getChangePasswordValidationSchema().safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0]?.message || "Validation failed",
      }
    }

    // TODO: Implement actual password validation and storage
    // For now, return a message indicating this feature requires implementation
    return { 
      success: false, 
      error: "Password management requires backend implementation. Please use OAuth providers (GitHub) for authentication." 
    }

  } catch (error) {
    console.error("Change password error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
