import { NextRequest, NextResponse } from "next/server"
import { 
  checkAuth, 
  errorResponse, 
  successResponse, 
  extractBugId,
  getSingleRecord,
  getMultipleRecords,
  insertRecord,
  updateRecord,
  deleteRecord,
  parseFormData,
  parseArrayField,
  validateRequiredFields,
  addTimestamps,
  ensureValidUUID,
  processFormDataWithUploads
} from "@/lib/core"

// Generic API handler wrapper
export function createApiHandler<T = any>(
  handler: (request: NextRequest, context?: any, authResult?: any) => Promise<T>,
  statusCode: number = 200
) {
  return async (request: NextRequest, context?: any) => {
    try {
      const authResult = await checkAuth()
      if (authResult instanceof NextResponse) return authResult

      const result = await handler(request, context, authResult)
      return successResponse(result, statusCode)
    } catch (error: any) {
      return errorResponse(error.message || "Internal server error", 500)
    }
  }
}

// Generic CRUD handlers
export const createGetHandler = (table: string, idField: string = 'id') => 
  createApiHandler(async (request, context) => {
    if (context?.params) {
      const id = await extractBugId(context)
      return { [table.slice(0, -1)]: await getSingleRecord(table, id, idField) }
    }
    // Handle query parameters
    const searchParams = request?.nextUrl?.searchParams
    if (!searchParams) {
      return { [table]: [] }
    }
    const createdByParam = searchParams.get('created_by')
    const clusterIdParam = searchParams.get('cluster_id')
    const filterField = clusterIdParam ? 'cluster_id' : (createdByParam ? 'created_by' : undefined)
    const filterValue: string | undefined = clusterIdParam ?? createdByParam ?? undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    
    const records = await getMultipleRecords(table, filterField, filterValue)
    
    // Apply limit if specified
    const limitedRecords = limit ? records.slice(0, limit) : records
    
    return { [table]: limitedRecords }
  })

export const createPostHandler = (
  table: string, 
  requiredFields: string[],
  dataTransformer?: (formData: any, authResult: any, context?: any) => any,
  options?: { enableFileUpload?: boolean; uploadFolder?: string }
) => 
  createApiHandler(async (request, context, authResult) => {
    const { enableFileUpload = false, uploadFolder = 'default' } = options || {}
    
    const formData = enableFileUpload 
      ? await processFormDataWithUploads(request, uploadFolder)
      : await parseFormData(request)
    
    validateRequiredFields(formData, requiredFields)

    const { user } = authResult
    const transformedData = dataTransformer 
      ? dataTransformer(formData, authResult, context)
      : formData

    const recordData = addTimestamps({
      ...transformedData,
      created_by: ensureValidUUID(user.id)
    })

    const record = await insertRecord(table, recordData)
    return { [table.slice(0, -1)]: record }
  }, 201)

export const createPatchHandler = (
  table: string,
  allowedFields: string[],
  idField: string = 'id',
  additionalFilter?: { field: string; value: string }
) => 
  createApiHandler(async (request, context) => {
    const id = await extractBugId(context)
    const body = await request.json().catch(() => ({}))

    const updateData: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields to update")
    }

    const record = await updateRecord(
      table, 
      id, 
      addTimestamps(updateData), 
      idField, 
      additionalFilter
    )
    
    return { [table.slice(0, -1)]: record }
  })

export const createDeleteHandler = (
  table: string,
  idField: string = 'id',
  additionalFilter?: { field: string; value: string }
) => 
  createApiHandler(async (request, context) => {
    const id = await extractBugId(context)
    await deleteRecord(table, id, idField, additionalFilter)
    return { message: `${table.slice(0, -1)} deleted successfully` }
  })

// Specialized handlers for specific use cases
export const createBugHandler = () => ({
  GET: createGetHandler('bugs'),
  POST: createPostHandler(
    'bugs',
    ['title', 'description'],
    (formData, authResult) => ({
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority || "medium",
      visibility: formData.visibility || "team",
      environment: formData.environment || null,
      expected_behavior: formData.expected_behavior || null,
      actual_behavior: formData.actual_behavior || null,
      steps_to_reproduce: formData.steps_to_reproduce || null,
      tags: parseArrayField(formData.tags),
      sources: parseArrayField(formData.sources),
      attachments: formData.attachments || null,
    }),
    { enableFileUpload: true, uploadFolder: 'bugs' }
  ),
  PATCH: createPatchHandler('bugs', [
    'status', 'priority', 'assigned_to', 'title', 'description', 'visibility'
  ]),
  DELETE: createDeleteHandler('bugs')
})

export const createSolutionHandler = () => ({
  GET: createApiHandler(async (request, context) => {
    const bugId = await extractBugId(context)
    const solutions = await getMultipleRecords('bug_solution_details', 'bug_id', bugId)
    return { solutions }
  }),
  POST: createPostHandler(
    'bug_solution_details',
    ['title', 'description', 'solution_type', 'priority', 'status'],
    (formData, authResult, context) => ({
      bug_id: context?.params ? extractBugId(context) : null,
      title: formData.title,
      description: formData.description,
      solution_type: formData.solution_type,
      priority: formData.priority,
      status: formData.status,
      assignee: formData.assignee || null,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
      links: parseArrayField(formData.links),
    })
  ),
  PATCH: createApiHandler(async (request, context) => {
    const bugId = await extractBugId(context)
    const body = await request.json().catch(() => ({}))
    
    const solutionId = body.solution_id || request?.nextUrl?.searchParams?.get('solution_id')
    if (!solutionId) {
      throw new Error("Solution ID is required")
    }

    const allowedFields = ['status', 'priority', 'assignee', 'title', 'description', 'estimated_hours', 'links']
    const updateData: any = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields to update")
    }

    const solution = await updateRecord(
      'bug_solution_details', 
      solutionId, 
      addTimestamps(updateData), 
      'id', 
      { field: 'bug_id', value: bugId }
    )
    
    return { solution }
  }),
  DELETE: createApiHandler(async (request, context) => {
    const bugId = await extractBugId(context)
    const solutionId = request?.nextUrl?.searchParams?.get('solution_id')
    
    if (!solutionId) {
      throw new Error("Solution ID is required")
    }

    await deleteRecord(
      'bug_solution_details', 
      solutionId, 
      'id', 
      { field: 'bug_id', value: bugId }
    )
    
    return { message: "Solution deleted successfully" }
  })
})
