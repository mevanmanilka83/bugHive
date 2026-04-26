
import { notFound } from "next/navigation"
import { supabase } from "../config"
import { ensureValidUUID } from "../utils/client"
import type { ActionResponse } from "../auth/helpers"

export async function getSingleRecord(
  table: string,
  id: string,
  idField: string = 'id'
): Promise<any> {
  const { data, error } = await supabase.from(table).select('*').eq(idField, id).single()
  if (error) throw error
  if (data === null) throw new Error("Record not found")
  return data
}

export async function getRecordOrNotFound(
  table: string,
  id: string,
  idField: string = 'id'
): Promise<any> {
  try {
    return await getSingleRecord(table, id, idField)
  } catch {
    notFound()
  }
}

export async function getMultipleRecords(
  table: string,
  filterField?: string,
  filterValue?: string,
  orderBy: string = 'created_at',
  orderDirection: 'asc' | 'desc' = 'desc'
): Promise<any[]> {
  let query = supabase.from(table).select('*')
  
  if (filterField && filterValue) {
    query = query.eq(filterField, filterValue)
  }
  
  query = query.order(orderBy, { ascending: orderDirection === 'asc' })
  
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function insertRecord(
  table: string,
  data: Record<string, any>
): Promise<any> {
  const { data: result, error } = await supabase.from(table).insert(data).select().single()
  if (error) throw error
  return result
}

export async function updateRecord(
  table: string,
  id: string,
  data: Record<string, any>,
  idField: string = 'id',
  additionalFilter?: { field: string; value: string }
): Promise<any> {
  let query = supabase.from(table).update(data).eq(idField, id)
  
  if (additionalFilter) {
    query = query.eq(additionalFilter.field, additionalFilter.value)
  }
  
  const { data: result, error } = await query.select().single()
  if (error) throw error
  return result
}

export async function deleteRecord(
  table: string,
  id: string,
  idField: string = 'id',
  additionalFilter?: { field: string; value: string }
): Promise<void> {
  let query = supabase.from(table).delete().eq(idField, id)
  
  if (additionalFilter) {
    query = query.eq(additionalFilter.field, additionalFilter.value)
  }
  
  const { error } = await query
  if (error) throw error
}

export async function getClusterById(
  clusterId: string
): Promise<ActionResponse<{ cluster: any }>> {
  const { data: cluster, error: clusterError } = await supabase
    .from('clusters')
    .select('*')
    .eq('id', clusterId)
    .single()

  if (clusterError || !cluster) {
    return { 
      success: false, 
      error: "Cluster not found",
      cluster: null as any
    }
  }

  return { success: true, cluster }
}

export function verifyClusterOwnership(cluster: any, userId: string): boolean {
  return cluster.owner_id === userId
}

export async function getUserClusterIds(userId: string): Promise<Set<string>> {
  const userUuid = ensureValidUUID(userId)
  const clusterIds = new Set<string>()
  
  const { data: clusters } = await supabase.from('clusters').select('id, owner_id, members')
  
  if (clusters) {
    for (const cluster of clusters) {
      if (cluster.owner_id === userUuid) {
        clusterIds.add(cluster.id)
      } else if (Array.isArray(cluster.members) && cluster.members.includes(userUuid)) {
        clusterIds.add(cluster.id)
      }
    }
  }
  
  return clusterIds
}

export async function isClusterOwnerOrMember(userId: string, clusterId: string): Promise<boolean> {
  const userUuid = ensureValidUUID(userId)
  const { data: cluster } = await supabase
    .from('clusters')
    .select('id, owner_id, members')
    .eq('id', clusterId)
    .single()
  
  if (!cluster) return false
  
  if (cluster.owner_id === userUuid) return true
  
  if (Array.isArray(cluster.members) && cluster.members.includes(userUuid)) {
    return true
  }
  
  return false
}

export async function canUserViewBug(userId: string, bug: any): Promise<boolean> {
  if (!bug.cluster_id) return true
  
  return await isClusterOwnerOrMember(userId, bug.cluster_id)
}
