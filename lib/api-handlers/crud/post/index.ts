/**
 * POST Handler Factory
 * 
 * Creates handlers for creating new records
 * 
 * Features:
 * - Form data parsing (multipart/form-data or JSON)
 * - File upload support
 * - Required field validation
 * - Automatic timestamp and created_by field addition
 */
import { 
  parseFormData,
  validateRequiredFields,
  addTimestamps,
  ensureValidUUID,
  processFormDataWithUploads
} from "@/lib/core"
import { createApiHandler } from "../../base"
import { insertRecord } from "@/lib/core"

/**
 * Creates a POST handler for creating new records
 * 
 * @param table - Database table name
 * @param requiredFields - Array of field names that must be present
 * @param dataTransformer - Optional function to transform form data before saving
 * @param options - Configuration options (file upload, folder name, etc.)
 * @returns POST handler function
 */
export const createPostHandler = (
  table: string, 
  requiredFields: string[],
  dataTransformer?: (formData: any, authResult: any, context?: any) => any | Promise<any>,
  options?: { enableFileUpload?: boolean; uploadFolder?: string }
) => 
  createApiHandler(async (request, context, authResult) => {
    const { enableFileUpload = false, uploadFolder = 'default' } = options || {}
    
    // Parse form data (with or without file uploads)
    const formData = enableFileUpload 
      ? await processFormDataWithUploads(request, uploadFolder)
      : await parseFormData(request)
    
    // Validate required fields
    validateRequiredFields(formData, requiredFields)

    const { user } = authResult
    
    // Transform data if transformer function provided
    const transformedData = dataTransformer 
      ? await (dataTransformer(formData, authResult, context) as Promise<any>)
      : formData

    // Add timestamps and created_by field
    const recordData = addTimestamps({
      ...transformedData,
      created_by: ensureValidUUID(user.id)
    })

    const record = await insertRecord(table, recordData)
    return { [table.slice(0, -1)]: record }
  }, 201)
