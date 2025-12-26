/**
 * Bug GET Handler
 * 
 * Handles fetching general bugs (without cluster_id) and applies cluster filtering:
 * - Single bug: GET /api/bugs/[id]
 * - Multiple bugs: GET /api/bugs?created_by=xxx&limit=100
 * 
 * Note: For cluster-specific bugs, use clusterBugGet handler
 * 
 * Cluster filtering:
 * - Bugs without cluster_id are visible to all users (global bugs)
 * - Bugs with cluster_id are filtered by user's cluster membership
 */
import { extractRouteId, parseQueryFilters, ensureValidUUID } from "@/lib/utils"
import { getSingleRecord, getMultipleRecords } from "@/lib/database/database"
import { supabase } from "@/lib/config"
import { createApiHandler } from "../../../handlerFactory"

// Helper: Get user's cluster IDs
async function getUserClusterIds(userId: string): Promise<Set<string>> {
  const userUuid = ensureValidUUID(userId)
  const clusterIds = new Set<string>()
  const { data: clusters } = await supabase.from('clusters').select('id, owner_id, members')
  if (clusters) {
    for (const cluster of clusters) {
      if (cluster.owner_id === userUuid || (cluster.members?.includes(userUuid))) {
        clusterIds.add(cluster.id)
      }
    }
  }
  return clusterIds
}

// Helper: Filter bugs by cluster access
function filterBugsByClusterAccess(bugs: any[], userClusterIds: Set<string>): any[] {
  return bugs.filter(bug => !bug.cluster_id || userClusterIds.has(bug.cluster_id))
}

// Helper: Validate bug cluster access
async function validateBugClusterAccess(userId: string, bug: any): Promise<boolean> {
  if (!bug?.cluster_id) return true
  const userClusterIds = await getUserClusterIds(userId)
  return userClusterIds.has(bug.cluster_id)
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
 * Creates GET handler for bugs
 * 
 * Features:
 * - Fetches single or multiple bugs
 * - Enriches bugs with cluster names
 * - Filters bugs by user's cluster membership
 * - Supports filtering by created_by or cluster_id
 * - Supports limit parameter
 */
export const createBugGetHandler = () => 
  createApiHandler(async (request, context, authResult) => {
    if (context?.params) {
      // Single bug fetch - include cluster name and check access
      const id = await extractRouteId(context)
      const bug = await getSingleRecord('bugs', id)
      
      if (!bug) {
        return { bug: null }
      }
      
      // Check if user has access to this bug's cluster
      if (authResult?.user?.id) {
        const hasAccess = await validateBugClusterAccess(authResult.user.id, bug)
        if (!hasAccess) {
          // User doesn't have access to this cluster bug
          return { bug: null }
        }
      }
      
      const enrichedBug = await enrichBugWithCluster(bug)
      return { bug: enrichedBug }
    }
    
    // Multiple bugs fetch - include cluster names and filter by access
    const searchParams = request?.nextUrl?.searchParams
    if (!searchParams) {
      return { bugs: [] }
    }
    
    const { filterField, filterValue, limit } = parseQueryFilters(searchParams)
    const records = await getMultipleRecords('bugs', filterField, filterValue)
    
    // Exclude cluster bugs when no cluster_id filter is provided
    // This ensures Bug Explore, Dashboard, and Recent Bugs only show general bugs
    const excludeClusterBugs = filterField !== 'cluster_id'
    let filteredBugs = excludeClusterBugs 
      ? records.filter(bug => !bug.cluster_id) // Only show bugs without cluster_id
      : records // If cluster_id filter is provided, show those cluster bugs
    
    // Filter bugs by user's cluster membership (only if cluster_id filter is provided)
    if (!excludeClusterBugs && authResult?.user?.id) {
      const userClusterIds = await getUserClusterIds(authResult.user.id)
      filteredBugs = filterBugsByClusterAccess(filteredBugs, userClusterIds)
    }
    
    // Enrich bugs with cluster names
    const bugsWithClusters = await enrichBugsWithClusters(filteredBugs)
    
    // Apply limit if specified
    const limitedRecords = limit ? bugsWithClusters.slice(0, limit) : bugsWithClusters
    
    return { bugs: limitedRecords }
  })
