/**
 * Cluster Bug GET Handler
 * 
 * Handles fetching cluster-specific bugs with access control:
 * - Single cluster bug: GET /api/bugs/[id] (when bug has cluster_id)
 * - Multiple cluster bugs: GET /api/bugs?cluster_id=xxx&limit=100
 * 
 * Cluster Bug Rules:
 * - Only returns bugs that belong to clusters the user is a member/owner of
 * - Validates cluster access before returning bugs
 */
import { extractRouteId, parseQueryFilters, ensureValidUUID } from "@/lib/utils"
import { getSingleRecord, getMultipleRecords } from "@/lib/shared/database/database"
import { supabase } from "@/lib/shared/config/config"
import { createApiHandler } from "../../../handlerFactory"

// Helper: Get user's cluster IDs (where user is owner or member)
async function getUserClusterIds(userId: string): Promise<Set<string>> {
  const userUuid = ensureValidUUID(userId)
  const clusterIds = new Set<string>()
  const { data: clusters } = await supabase.from('clusters').select('id, owner_id, members')
  if (clusters) {
    for (const cluster of clusters) {
      const isOwner = cluster.owner_id === userUuid
      const isMember = cluster.members && Array.isArray(cluster.members) && cluster.members.includes(userUuid)
      if (isOwner || isMember) {
        clusterIds.add(cluster.id)
      }
    }
  }
  return clusterIds
}

// Helper: Check if user is owner or member of a cluster
async function isClusterOwnerOrMember(userId: string, clusterId: string): Promise<boolean> {
  const userUuid = ensureValidUUID(userId)
  const { data: cluster } = await supabase
    .from('clusters')
    .select('id, owner_id, members')
    .eq('id', clusterId)
    .single()
  
  if (!cluster) return false
  
  const isOwner = cluster.owner_id === userUuid
  const isMember = cluster.members && Array.isArray(cluster.members) && cluster.members.includes(userUuid)
  
  return isOwner || isMember
}

// Helper: Filter bugs by cluster access (only owner/member)
function filterBugsByClusterAccess(bugs: any[], userClusterIds: Set<string>): any[] {
  return bugs.filter(bug => bug.cluster_id && userClusterIds.has(bug.cluster_id))
}

// Helper: Validate bug cluster access (only owner/member)
async function validateBugClusterAccess(userId: string, bug: any): Promise<boolean> {
  if (!bug?.cluster_id) return false
  return await isClusterOwnerOrMember(userId, bug.cluster_id)
}

// Helper: Enrich bug with cluster name
async function enrichBugWithCluster(bug: any): Promise<any> {
  if (bug?.cluster_id) {
    try {
      const cluster = await getSingleRecord('clusters', bug.cluster_id)
      if (cluster) bug.cluster_name = cluster.name
    } catch {}
  }
  return bug
}

// Helper: Enrich multiple bugs with cluster names
async function enrichBugsWithClusters(bugs: any[]): Promise<any[]> {
  return Promise.all(bugs.map(bug => enrichBugWithCluster(bug)))
}

/**
 * Creates GET handler for cluster-specific bugs
 * 
 * Features:
 * - Fetches single or multiple cluster bugs
 * - Enriches bugs with cluster names
 * - Filters bugs by user's cluster membership
 * - Validates cluster access for all operations
 * - Supports filtering by cluster_id
 * - Supports limit parameter
 */
export const createClusterBugGetHandler = () => 
  createApiHandler(async (request, context, authResult) => {
    if (!authResult?.user?.id) {
      throw new Error("Unauthorized")
    }

    if (context?.params) {
      // Single cluster bug fetch - validate access
      const id = await extractRouteId(context)
      const bug = await getSingleRecord('bugs', id)
      
      if (!bug) {
        return { bug: null }
      }

      // Cluster bugs require cluster access validation
      if (!bug.cluster_id) {
        // Not a cluster bug, return null (use general bug handler instead)
        return { bug: null }
      }
      
      // Validate cluster access
      const hasAccess = await validateBugClusterAccess(authResult.user.id, bug)
      if (!hasAccess) {
        // User doesn't have access to this cluster bug
        return { bug: null }
      }
      
      const enrichedBug = await enrichBugWithCluster(bug)
      return { bug: enrichedBug }
    }
    
    // Multiple cluster bugs fetch - filter by cluster access
    const searchParams = request?.nextUrl?.searchParams
    if (!searchParams) {
      return { bugs: [] }
    }
    
    const { filterField, filterValue, limit } = parseQueryFilters(searchParams)
    
    // Only fetch bugs with cluster_id (cluster-specific bugs)
    const records = await getMultipleRecords('bugs', filterField, filterValue)
    
    // Filter to only cluster bugs
    const clusterBugs = records.filter(bug => bug.cluster_id)
    
    // Filter bugs by user's cluster membership
    const userClusterIds = await getUserClusterIds(authResult.user.id)
    const filteredBugs = filterBugsByClusterAccess(clusterBugs, userClusterIds)
    
    // Enrich bugs with cluster names
    const bugsWithClusters = await enrichBugsWithClusters(filteredBugs)
    
    // Apply limit if specified
    const limitedRecords = limit ? bugsWithClusters.slice(0, limit) : bugsWithClusters
    
    return { bugs: limitedRecords }
  })
