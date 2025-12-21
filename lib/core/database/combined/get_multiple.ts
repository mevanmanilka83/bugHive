/**
 * Get Multiple Records
 * 
 * Fetches multiple records with optional filtering from the database with Supabase/PostgreSQL fallback.
 */
import { executeWithFallback } from "./fallback"
import { wrapSupabaseOperation } from "./fallback/wrapper"
import { getMultipleRecordsSupabase } from "../supabase/get_multiple_supabase"
import { getMultipleRecordsPostgres } from "../postgres/get_multiple_postgres"

/**
 * Fetches multiple records with optional filtering
 */
export async function getMultipleRecords(
  table: string,
  filterField?: string,
  filterValue?: string,
  orderBy: string = 'created_at',
  orderDirection: 'asc' | 'desc' = 'desc'
): Promise<any[]> {
  return executeWithFallback(
    () => wrapSupabaseOperation(() => getMultipleRecordsSupabase(table, filterField, filterValue, orderBy, orderDirection)),
    () => getMultipleRecordsPostgres(table, filterField, filterValue, orderBy, orderDirection),
    `Failed to fetch ${table} records`
  )
}
