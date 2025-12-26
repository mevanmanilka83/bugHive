"use server"

import { generateUUIDFromEmailSync, extractUsernameFromEmail } from "@/lib/utils"
import { supabase } from "@/lib/shared/config/config"

/**
 * User Management Server Actions
 * 
 * PURPOSE: Direct server-side functions for user data persistence
 * 
 * Why Server Actions vs API Routes?
 * - Server Actions: Direct function calls from server components, no HTTP overhead
 *   - Better TypeScript support and type safety
 *   - Automatic server-side execution context
 *   - Can be called directly from server components and other server actions
 *   - Use when: Calling from server-side code, form actions, or when you don't need HTTP
 * 
 * - API Routes: HTTP endpoints for external clients or form submissions
 *   - Use when: Client-side fetch calls, external integrations, or when you need HTTP semantics
 * 
 * Architecture:
 * - This module: Server action for saving user data (saveUserToSupabase)
 * - /api/auth/signup: API route that uses this server action for HTTP signup requests
 * - /api/users: API routes for fetching user data (GET requests)
 * 
 * Key Features:
 * - Generates deterministic UUIDs from email addresses (same logic as @/lib/auth/config)
 * - Handles Supabase RLS policies and service role key fallbacks
 * - Single source of truth for user data persistence
 */

// This function runs in Node.js runtime, so we can use Supabase
export async function saveUserToSupabase(
  email: string,
  name?: string | null,
  image?: string | null,
  emailVerified?: string | null
) {
  try {
    if (!email) {
      return { success: false, error: "Email is required" }
    }

    const userIdFromEmail = generateUUIDFromEmailSync(email)
    
    const userData = {
      id: userIdFromEmail,
      email: email.toLowerCase().trim(),
      name: name || extractUsernameFromEmail(email),
      image: image || null,
      email_verified: emailVerified || null,
      updated_at: new Date().toISOString(),
    }

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    try {
      // If we don't have service role key, try using the function instead
      if (!supabaseServiceKey) {
        const { data: functionData, error: functionError } = await supabase.rpc('register_user', {
          p_id: userData.id,
          p_email: userData.email,
          p_name: userData.name,
          p_image: userData.image,
          p_email_verified: userData.email_verified
        })

        if (functionError) {
          // Fall through to try regular upsert
        } else {
          // Function succeeded - it returns the user ID
          // The function uses SECURITY DEFINER so it bypasses RLS
          // Try to fetch the user, but if RLS blocks it, that's okay - we know the function worked
          const { data: fetchedData, error: fetchError } = await supabase
            .from('users')
            .select()
            .eq('email', userData.email)
            .maybeSingle()

          // If we got data, return it. Otherwise, return success anyway since function worked
          if (fetchedData) {
            return { success: true, message: "User data saved successfully", data: fetchedData }
          } else {
            // Function succeeded but we can't verify due to RLS - that's okay
            return { 
              success: true, 
              message: "User data saved successfully", 
              data: { id: userData.id, email: userData.email, name: userData.name }
            }
          }
        }
      }

      // Try regular upsert (works with service role key)
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
        // Try to fetch the user to confirm
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
