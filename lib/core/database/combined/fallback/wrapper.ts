/**
 * Supabase Operation Wrapper
 * 
 * Wraps Supabase operations to convert thrown errors into {data, error} format for fallback mechanism.
 */

/**
 * Wraps a Supabase operation to return {data, error} format instead of throwing
 */
export async function wrapSupabaseOperation<T>(
  operation: () => Promise<T>
): Promise<{ data: T | null; error: any }> {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error }
  }
}

/**
 * Wraps a void Supabase operation to return {data, error} format instead of throwing
 * For operations that don't return a value (like delete)
 */
export async function wrapSupabaseVoidOperation(
  operation: () => Promise<void>
): Promise<{ data: true | null; error: any }> {
  try {
    await operation()
    return { data: true, error: null }
  } catch (error: any) {
    return { data: null, error }
  }
}
