/**
 * Bug Handler Utilities
 * 
 * Helper functions for bug-related operations:
 * - Cluster name enrichment
 * - Bug data transformation utilities
 */
import { getSingleRecord } from "@/lib/shared/shared"

/**
 * Enriches a single bug with cluster name if it belongs to a cluster
 * 
 * @param bug - Bug object with cluster_id
 * @returns Bug object with cluster_name added if cluster exists
 */
export async function enrichBugWithCluster(bug: any): Promise<any> {
  if (bug?.cluster_id) {
    try {
      const cluster = await getSingleRecord('clusters', bug.cluster_id)
      if (cluster) {
        bug.cluster_name = cluster.name
      }
    } catch {
      // Cluster not found, ignore
    }
  }
  return bug
}

/**
 * Enriches multiple bugs with cluster names
 * 
 * @param bugs - Array of bug objects
 * @returns Array of bugs with cluster_name added where applicable
 */
export async function enrichBugsWithClusters(bugs: any[]): Promise<any[]> {
  return Promise.all(bugs.map(bug => enrichBugWithCluster(bug)))
}
