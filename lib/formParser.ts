/**
 * Form Data Parsing
 * 
 * Handles parsing of form data from HTTP requests:
 * - Supports multipart/form-data (with files)
 * - Supports JSON request bodies
 * - Returns normalized data structure
 */
import { NextRequest } from "next/server"

/**
 * Parses form data from a request
 * 
 * Handles both:
 * - multipart/form-data (for file uploads)
 * - application/json (for regular API requests)
 */
export async function parseFormData(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''
  
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const data: Record<string, any> = {}
    
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        data[key] = value
      } else {
        data[key] = value.toString()
      }
    }
    
    return data
  } else {
    return await request.json().catch(() => ({}))
  }
}
