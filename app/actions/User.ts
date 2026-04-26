"use server"

import { generateUUIDFromEmailSync, extractUsernameFromEmail, supabase, env } from "@/lib"


export async function saveUserToSupabase(
  email: string,
  name?: string | null,
  image?: string | null,
  emailVerified?: string | null,
  passwordHash?: string | null
) {
  try {
    if (!email) {
      return { success: false, error: "Email is required" }
    }

    const userIdFromEmail = generateUUIDFromEmailSync(email)
    
    const userData: Record<string, unknown> = {
      id: userIdFromEmail,
      email: email.toLowerCase().trim(),
      name: name || extractUsernameFromEmail(email),
      image: image || null,
      email_verified: emailVerified || null,
      updated_at: new Date().toISOString(),
    }
    if (passwordHash != null && passwordHash !== "") {
      userData.password_hash = passwordHash
    }

    const supabaseServiceKey = env.supabaseServiceKey

    try {
      if (!supabaseServiceKey) {
        const { error: functionError } = await supabase.rpc('register_user', {
          p_id: userData.id,
          p_email: userData.email,
          p_name: userData.name,
          p_image: userData.image,
          p_email_verified: userData.email_verified
        })

        if (functionError) {
        } else {
          const { data: fetchedData, error: fetchError } = await supabase
            .from('users')
            .select()
            .eq('email', userData.email)
            .maybeSingle()

          if (fetchedData) {
            return { success: true, message: "User data saved successfully", data: fetchedData }
          } else {
            return { 
              success: true, 
              message: "User data saved successfully", 
              data: { id: userData.id, email: userData.email, name: userData.name }
            }
          }
        }
      }

      const response = await supabase
        .from('users')
        .upsert(userData, {
          onConflict: 'email'
        })
        .select()

      const { data, error: upsertError } = response

      if (upsertError) {
        const errorMessage = upsertError.message || upsertError.details || upsertError.hint || 'Unknown error saving user'
        return { 
          success: false, 
          error: errorMessage,
          details: {
            code: upsertError.code,
            message: upsertError.message
          }
        }
      }

      if (!data || data.length === 0) {
        const { data: fetchedData, error: fetchError } = await supabase
          .from('users')
          .select()
          .eq('email', userData.email)
          .single()
        
        if (fetchError) {
          return { success: false, error: 'User save may have failed - could not verify' }
        } else if (fetchedData) {
          return { success: true, message: "User data saved successfully", data: fetchedData }
        } else {
          return { success: false, error: 'User save may have failed - user not found after upsert' }
        }
      } else {
        return { success: true, message: "User data saved successfully", data: data[0] }
      }
    } catch (supabaseError) {
      const errorMessage = supabaseError instanceof Error ? supabaseError.message : String(supabaseError)
      return {
        success: false,
        error: `Supabase operation failed: ${errorMessage}`
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { 
      success: false, 
      error: errorMessage || "Internal server error"
    }
  }
}
