import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "../auth/helpers"
import { errorResponse, successResponse } from "../errors/httpResponses"
import { 
  getSingleRecord,
  getMultipleRecords,
  insertRecord,
  updateRecord,
  deleteRecord
} from "../db/crudOperations"
import { parseFormData } from "./parseForms"
import { processFormDataWithUploads } from "../storage/s3Uploads"
import { parseArrayField, addTimestamps, ensureValidUUID, extractRouteId } from "../utils/server"
import { supabase } from "../config"

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

function createGetHandler(table: string, idField: string = 'id') {
  return createApiHandler(async (request, context) => {
    if (context?.params) {
      const id = await extractRouteId(context)
      return { [table.slice(0, -1)]: await getSingleRecord(table, id, idField) }
    }
    
    const url = new URL(request.url)
    const filterField = url.searchParams.get('filter_field')
    const filterValue = url.searchParams.get('filter_value')
    const limit = url.searchParams.get('limit')
    
    let records = await getMultipleRecords(table, filterField || undefined, filterValue || undefined)
    
    if (limit) {
      records = records.slice(0, parseInt(limit))
    }
    
    return { [table]: records }
  })
}

function createPostHandler(
  table: string,
  requiredFields: string[],
  dataMapper: (formData: any, authResult: any, context?: any) => any,
  options?: { enableFileUpload?: boolean; uploadFolder?: string }
) {
  return createApiHandler(async (request, context, authResult) => {
    let formData
    
    if (options?.enableFileUpload) {
      formData = await processFormDataWithUploads(request, options.uploadFolder || 'uploads')
    } else {
      formData = await parseFormData(request)
    }
    
    for (const field of requiredFields) {
      if (!formData[field]) {
        throw new Error(`${field} is required`)
      }
    }
    
    const data = dataMapper(formData, authResult, context)
    const record = await insertRecord(table, addTimestamps({ ...data, created_by: ensureValidUUID(authResult.user.id) }))
    
    return { [table.slice(0, -1)]: record }
  }, 201)
}

function createPatchHandler(table: string, allowedFields: string[], idField: string = 'id') {
  return createApiHandler(async (request, context) => {
    const id = await extractRouteId(context)
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
    
    const record = await updateRecord(table, id, addTimestamps(updateData), idField)
    return { [table.slice(0, -1)]: record }
  })
}

function createDeleteHandler(table: string, idField: string = 'id') {
  return createApiHandler(async (request, context) => {
    const id = await extractRouteId(context)
    await deleteRecord(table, id, idField)
    return { message: `${table.slice(0, -1)} deleted successfully` }
  })
}

export function createBugHandler() {
  return {
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
  }
}

export function createSolutionHandler() {
  return {
    GET: createApiHandler(async (request, context) => {
      const bugId = await extractRouteId(context)
      const solutions = await getMultipleRecords('bug_solution_details', 'bug_id', bugId)
      return { solutions }
    }),
    POST: createPostHandler(
      'bug_solution_details',
      ['title', 'description', 'solution_type', 'priority', 'status'],
      async (formData, authResult, context) => ({
        bug_id: context?.params ? await extractRouteId(context) : null,
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
      const bugId = await extractRouteId(context)
      const body = await request.json().catch(() => ({}))
      
      const solutionId = body.solution_id || request.nextUrl.searchParams.get('solution_id')
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
        'id'
      )
      
      return { solution }
    }),
    DELETE: createApiHandler(async (request, context) => {
      const bugId = await extractRouteId(context)
      const solutionId = request.nextUrl.searchParams.get('solution_id')
      
      if (!solutionId) {
        throw new Error("Solution ID is required")
      }

      await deleteRecord('bug_solution_details', solutionId, 'id')
      return { message: "Solution deleted successfully" }
    })
  }
}
