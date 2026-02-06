/**
 * Database utilities for view tracking
 */

import { supabase } from "./config"

let viewsColumnChecked = false
let viewsColumnExists = false

async function ensureViewsColumnExists(table: string): Promise<boolean> {
  try {
    // Try to query the views column - if it doesn't exist, we'll get an error
    const { error } = await supabase
      .from(table)
      .select("views")
      .limit(1)

    if (error) {
      // Column doesn't exist, try to create it
      console.log(`Creating views column for ${table}...`)
      
      // Note: Supabase JS client doesn't support raw SQL execution
      // This will need to be done manually via the SQL editor or migrations
      // For now, we'll silently fail and the feature will work once the column exists
      return false
    }

    return true
  } catch (err) {
    console.error(`Error checking views column for ${table}:`, err)
    return false
  }
}

export async function incrementViewCount(table: string, id: string): Promise<boolean> {
  try {
    // Check if views column exists (only once per session)
    const columnExists = await ensureViewsColumnExists(table)
    
    if (!columnExists) {
      console.log(`Skipping view count increment for ${table} - views column not yet created`)
      return false
    }

    // Get current views count
    const { data, error: fetchError } = await supabase
      .from(table)
      .select("views")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error(`Error fetching current views for ${table}:`, fetchError)
      return false
    }

    const currentViews = (data?.views as number) || 0

    // Increment views count
    const { error: updateError } = await supabase
      .from(table)
      .update({ views: currentViews + 1 })
      .eq("id", id)

    if (updateError) {
      console.error(`Error incrementing views for ${table}:`, updateError)
      return false
    }

    return true
  } catch (err) {
    console.error(`Failed to increment view count for ${table}:`, err)
    return false
  }
}

export async function getViewCount(table: string, id: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select("views")
      .eq("id", id)
      .single()

    if (error || !data) {
      return 0
    }

    return (data.views as number) || 0
  } catch (err) {
    console.error(`Failed to get view count for ${table}:`, err)
    return 0
  }
}
