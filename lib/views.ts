
import { supabase } from "./config"

export async function incrementViewCount(table: string, id: string): Promise<boolean> {
  try {
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
