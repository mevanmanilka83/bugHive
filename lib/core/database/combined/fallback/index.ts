/**
 * Database Fallback Mechanism
 * 
 * Executes operations with Supabase first, falling back to SQL if Supabase fails.
 */

/**
 * Executes an operation with Supabase first, falling back to SQL if Supabase fails
 */
export async function executeWithFallback<T>(
  supabaseOperation: () => Promise<{ data: T | null; error: any }>,
  sqlOperation: () => Promise<T>,
  errorMessage: string = "Database operation failed"
): Promise<T> {
  const { data, error } = await supabaseOperation()
  
  if (error) {
    try {
      return await sqlOperation()
    } catch (sqlErr: any) {
      throw new Error(error.message || sqlErr?.message || errorMessage)
    }
  }
  
  // For void operations (like delete), data will be true, not null
  // For other operations, null indicates record not found
  if (data === null) {
    throw new Error("Record not found")
  }
  
  return data
}
