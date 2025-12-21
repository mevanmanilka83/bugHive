"use server"

import { auth } from "@/auth"
import { supabase, ensureValidUUID } from "@/lib/core"

export async function createCluster(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; error?: string; cluster?: any }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    if (!formData) {
      return { success: false, error: "Form data is required" }
    }

    const name = (formData.get('name') as string) || ''
    const description = (formData.get('description') as string) || ''

    // Validate
    if (!name.trim()) {
      return { success: false, error: "Cluster name is required" }
    }
    if (name.trim().length < 3) {
      return { success: false, error: "Cluster name must be at least 3 characters" }
    }
    if (name.trim().length > 100) {
      return { success: false, error: "Cluster name must be less than 100 characters" }
    }

    // Get owner username
    const ownerEmail = session.user.email || ''
    const ownerUsername = session.user.name || (ownerEmail ? ownerEmail.split('@')[0] : 'User')

    const clusterData = {
      name: name.trim(),
      description: description.trim() || null,
      owner_id: ensureValidUUID(session.user.id),
      owner_username: ownerUsername,
      members: [ensureValidUUID(session.user.id)], // Owner is automatically a member
      members_usernames: [ownerUsername], // Owner is automatically a member
      invites: [],
    }

    const { data, error } = await supabase
      .from('clusters')
      .insert(clusterData)
      .select()
      .single()

    if (error) {
      return { 
        success: false, 
        error: error.message || 'Failed to create cluster'
      }
    }

    return { 
      success: true, 
      cluster: data 
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Internal server error" 
    }
  }
}

