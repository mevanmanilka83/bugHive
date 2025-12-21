import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { Pool } from 'pg'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

// ============================================================================
// CORE CONFIGURATIONS
// ============================================================================

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export { pool }

// S3 configuration
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// ============================================================================
// COMMON UTILITIES
// ============================================================================

// UUID generation
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function ensureValidUUID(userId: string | undefined): string {
  if (!userId) return '00000000-0000-0000-0000-000000000000'
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(userId)) {
    return userId
  }
  
  return generateUUID()
}

// Response helpers
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status })
}

export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status })
}

// Data processing utilities
export function addTimestamps(data: Record<string, any>): Record<string, any> {
  const now = new Date().toISOString()
  return {
    ...data,
    updated_at: now,
    ...(data.created_at ? {} : { created_at: now })
  }
}

export function parseArrayField(value: string | null): string[] | null {
  if (!value) return null
  
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.map(s => s.toString())
    }
  } catch {
    return value.split(',').map(s => s.trim()).filter(Boolean)
  }
  
  return null
}

export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !data[field] || data[field].toString().trim().length === 0)
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
  }
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

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
  
  if (data === null) {
    throw new Error("Record not found")
  }
  
  return data
}

export async function getSingleRecord(
  table: string,
  id: string,
  idField: string = 'id'
): Promise<any> {
  return executeWithFallback(
    async () => await supabase.from(table).select('*').eq(idField, id).single(),
    () => query(`SELECT * FROM public.${table} WHERE ${idField} = $1`, [id]).then(result => {
      if (result.rows.length === 0) throw new Error("Record not found")
      return result.rows[0]
    }),
    `Failed to fetch ${table} record`
  )
}

export async function getMultipleRecords(
  table: string,
  filterField?: string,
  filterValue?: string,
  orderBy: string = 'created_at',
  orderDirection: 'asc' | 'desc' = 'desc'
): Promise<any[]> {
  return executeWithFallback(
    async () => {
      let query = supabase.from(table).select('*')
      if (filterField && filterValue) {
        query = query.eq(filterField, filterValue)
      }
      return await query.order(orderBy, { ascending: orderDirection === 'asc' })
    },
    () => {
      let sql = `SELECT * FROM public.${table}`
      const params: any[] = []
      if (filterField && filterValue) {
        sql += ` WHERE ${filterField} = $1`
        params.push(filterValue)
      }
      sql += ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`
      return query(sql, params).then(result => result.rows)
    },
    `Failed to fetch ${table} records`
  )
}

export async function insertRecord(
  table: string,
  data: Record<string, any>
): Promise<any> {
  return executeWithFallback(
    async () => await supabase.from(table).insert(data).select().single(),
    () => {
      const fields = Object.keys(data)
      const values = Object.values(data)
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ')
      const sql = `INSERT INTO public.${table} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`
      return query(sql, values).then(result => result.rows[0])
    },
    `Failed to create ${table} record`
  )
}

export async function updateRecord(
  table: string,
  id: string,
  data: Record<string, any>,
  idField: string = 'id',
  additionalFilter?: { field: string; value: string }
): Promise<any> {
  return executeWithFallback(
    async () => {
      let query = supabase.from(table).update(data).eq(idField, id)
      if (additionalFilter) {
        query = query.eq(additionalFilter.field, additionalFilter.value)
      }
      return await query.select().single()
    },
    () => {
      const fields = Object.keys(data)
      const values = Object.values(data)
      const setClause = fields.map((field, index) => `${field} = $${index + 3}`).join(', ')
      let sql = `UPDATE public.${table} SET ${setClause} WHERE ${idField} = $1`
      const params = [id, ...values]
      
      if (additionalFilter) {
        sql += ` AND ${additionalFilter.field} = $${params.length + 1}`
        params.push(additionalFilter.value)
      }
      
      sql += ' RETURNING *'
      return query(sql, params).then(result => {
        if (result.rows.length === 0) throw new Error("Record not found")
        return result.rows[0]
      })
    },
    `Failed to update ${table} record`
  )
}

export async function deleteRecord(
  table: string,
  id: string,
  idField: string = 'id',
  additionalFilter?: { field: string; value: string }
): Promise<void> {
  await executeWithFallback(
    async () => {
      let query = supabase.from(table).delete().eq(idField, id)
      if (additionalFilter) {
        query = query.eq(additionalFilter.field, additionalFilter.value)
      }
      return await query.select().single()
    },
    () => {
      let sql = `DELETE FROM public.${table} WHERE ${idField} = $1`
      const params = [id]
      
      if (additionalFilter) {
        sql += ` AND ${additionalFilter.field} = $2`
        params.push(additionalFilter.value)
      }
      
      sql += ' RETURNING *'
      return query(sql, params).then(result => {
        if (result.rows.length === 0) throw new Error("Record not found")
        return result.rows[0]
      })
    },
    `Failed to delete ${table} record`
  )
}

// ============================================================================
// FILE UPLOAD OPERATIONS
// ============================================================================

export async function handleFileUploads(formData: any, folder: string = 'bugs'): Promise<string[]> {
  const attachments: File[] = []
  
  for (const [key, value] of Object.entries(formData)) {
    if (key.startsWith('attachment_') && value instanceof File) {
      attachments.push(value)
    }
  }

  if (attachments.length === 0) {
    return []
  }

  try {
    const uploadPromises = attachments.map(async (file, index) => {
      const fileName = `${folder}/${generateUUID()}_${index}_${file.name}`
      const fileBuffer = Buffer.from(await file.arrayBuffer())

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: fileName,
        Body: fileBuffer,
        ContentType: file.type,
      })

      await s3Client.send(command)
      return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`
    })

    return await Promise.all(uploadPromises)
  } catch (uploadError) {
    return []
  }
}

export async function processFormDataWithUploads(
  request: NextRequest, 
  folder: string = 'bugs'
): Promise<any> {
  const formData = await parseFormData(request)
  const attachment_urls = await handleFileUploads(formData, folder)
  
  return {
    ...formData,
    attachments: attachment_urls.length ? attachment_urls : null
  }
}

// ============================================================================
// FORM DATA PARSING
// ============================================================================

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

// ============================================================================
// AUTHENTICATION & CONTEXT
// ============================================================================

export async function checkAuth() {
  const { auth } = await import("@/auth")
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return { session, user: session.user }
}

export async function extractBugId(context: { params: Promise<{ id: string }> }): Promise<string> {
  const { id } = await context.params
  return id
}
