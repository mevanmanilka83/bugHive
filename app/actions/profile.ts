"use server"

import { supabase, getSupabaseAdmin, generateUUIDFromEmailSync, uploadAvatarFile } from "@/lib"
import { verifyPassword, hashPassword } from "@/lib/password"
import { getUpdateProfileValidationSchema, getChangePasswordValidationSchema } from "@/lib"
import { auth } from "@/lib/auth/config"
import type { ActionResponse } from "@/lib/auth/helpers" 

export async function updateProfile(formData: FormData): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

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

    if (email.toLowerCase() !== session.user.email?.toLowerCase()) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser && existingUser.id !== currentUserId) {
        return { success: false, error: "This email is already in use" }
      }

      const newUserId = generateUUIDFromEmailSync(email)
      
      return { 
        success: false, 
        error: "Email changes are currently not supported. Please contact support." 
      }
    }

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

    const { currentPassword, newPassword } = validation.data
    const db = getSupabaseAdmin()
    const { data: row, error: fetchError } = await db
      .from("users")
      .select("password_hash")
      .eq("id", session.user.id)
      .single()

    const user = row as { password_hash: string | null } | null
    if (fetchError || !user?.password_hash) {
      return {
        success: false,
        error: "No password is set for this account. Use “Forgot password” if you need to reset it.",
      }
    }

    const valid = await verifyPassword(currentPassword, user.password_hash)
    if (!valid) {
      return { success: false, error: "Current password is incorrect." }
    }

    const newHash = await hashPassword(newPassword)
    const { error: updateError } = await db
      .from("users")
      .update({ password_hash: newHash, updated_at: new Date().toISOString() } as never)
      .eq("id", session.user.id)

    if (updateError) {
      console.error("Change password update error:", updateError)
      return { success: false, error: "Failed to update password." }
    }

    return { success: true, message: "Password changed successfully." }
  } catch (error) {
    console.error("Change password error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
