"use server"

import { supabase } from "@/lib"
import { getPrivacySettingsValidationSchema } from "@/lib"
import type { ProfileVisibility } from "@/lib/schemas/types"
import { auth } from "@/lib/auth/config"
import type { ActionResponse } from "@/lib/auth/helpers"

export async function updateProfileVisibility(visibility: ProfileVisibility): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const validation = getPrivacySettingsValidationSchema().shape.profile_visibility.safeParse(visibility)
    if (!validation.success) {
      return { success: false, error: "Invalid visibility setting" }
    }

    const { error } = await supabase
      .from('users')
      .update({
        profile_visibility: visibility,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)

    if (error) {
      console.error("Profile visibility update error:", error)
      return { success: false, error: "Failed to update profile visibility" }
    }

    return { success: true, message: "Profile visibility updated successfully" }
  } catch (error) {
    console.error("Update profile visibility error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function updateActivityVisibility(showActivity: boolean): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const { error } = await supabase
      .from('users')
      .update({
        show_activity: showActivity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)

    if (error) {
      console.error("Activity visibility update error:", error)
      return { success: false, error: "Failed to update activity visibility" }
    }

    return { 
      success: true, 
      message: showActivity 
        ? "Your activity is now visible" 
        : "Your activity is now hidden" 
    }
  } catch (error) {
    console.error("Update activity visibility error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getPrivacySettings() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { 
        profile_visibility: "public" as ProfileVisibility, 
        show_activity: true 
      }
    }

    const { data, error } = await supabase
      .from('users')
      .select('profile_visibility, show_activity')
      .eq('id', session.user.id)
      .single()

    if (error || !data) {
      return { 
        profile_visibility: "public" as ProfileVisibility, 
        show_activity: true 
      }
    }

    return {
      profile_visibility: (data.profile_visibility || "public") as ProfileVisibility,
      show_activity: data.show_activity ?? true,
    }
  } catch (error) {
    console.error("Get privacy settings error:", error)
    return { 
      profile_visibility: "public" as ProfileVisibility, 
      show_activity: true 
    }
  }
}
