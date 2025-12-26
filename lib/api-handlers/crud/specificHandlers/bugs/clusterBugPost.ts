/**
 * Cluster Bug POST Handler
 * 
 * Handles creating new cluster-specific bugs:
 * - POST /api/bugs (when cluster_id is provided)
 * - Supports file uploads for attachments
 * - Validates cluster access before creation
 * - Transforms form data into cluster bug record format
 */
import { 
  parseArrayField, 
  ensureValidUUID,
  addTimestamps
} from "@/lib/utils"
import { parseFormData } from "@/lib/shared/formParser"
import { processFormDataWithUploads } from "@/lib/shared/s3Uploads"
import { supabase } from "@/lib/shared/config/config"
import { insertRecord } from "@/lib/shared/database/database"
import { createApiHandler } from "../../../handlerFactory"
import { getBugReportSchema } from "@/lib/schemas/zod/bugReport"
import { validateWithSchema } from "@/app/actions/shared/validation"

// Helper: Check if user is owner or member of a cluster
async function isClusterOwnerOrMember(userId: string, clusterId: string): Promise<boolean> {
  const userUuid = ensureValidUUID(userId)
  const { data: cluster } = await supabase
    .from('clusters')
    .select('id, owner_id, members')
    .eq('id', clusterId)
    .single()
  
  if (!cluster) return false
  
  const isOwner = cluster.owner_id === userUuid
  const isMember = cluster.members && Array.isArray(cluster.members) && cluster.members.includes(userUuid)
  
  return isOwner || isMember
}

/**
 * Transforms form data into cluster bug record format
 * 
 * @param formData - Form data from request
 * @param authResult - Authentication result with user info
 * @returns Transformed cluster bug data ready for database insertion
 */
async function transformClusterBugData(formData: any, authResult: any) {
  // Cluster bugs require cluster_id
  if (!formData.cluster_id) {
    throw new Error("cluster_id is required for cluster bugs")
  }

  // Validate cluster access
  if (!authResult?.user?.id) {
    throw new Error("Unauthorized")
  }

  const clusterId = ensureValidUUID(formData.cluster_id)
  const isAuthorized = await isClusterOwnerOrMember(authResult.user.id, clusterId)
  if (!isAuthorized) {
    throw new Error("Only cluster owners and members can create bugs in this cluster")
  }
  
  return {
    title: formData.title.trim(),
    description: formData.description.trim(),
    priority: formData.priority || "medium",
    visibility: formData.visibility || "public",
    environment: formData.environment || null,
    expected_behavior: formData.expected_behavior || null,
    actual_behavior: formData.actual_behavior || null,
    steps_to_reproduce: formData.steps_to_reproduce || null,
    tags: parseArrayField(formData.tags),
    sources: parseArrayField(formData.sources),
    attachments: formData.attachments || null,
    cluster_id: clusterId,
  }
}

/**
 * Creates POST handler for cluster-specific bugs
 * 
 * Features:
 * - Validates required fields (title, description, cluster_id)
 * - Validates cluster access before creation
 * - Transforms form data to cluster bug format
 * - Supports file uploads (attachments)
 * - Uploads files to 'bugs' folder in S3
 */
export const createClusterBugPostHandler = () => 
  createApiHandler(async (request, context, authResult) => {
    if (!authResult?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Parse form data (with file uploads)
    const formData = await processFormDataWithUploads(request, 'bugs')
    
    // Prepare data for validation
    const validationData = {
      title: formData.title || '',
      description: formData.description || '',
      priority: formData.priority || 'medium',
      visibility: formData.visibility || 'public',
      environment: formData.environment || undefined,
      expected_behavior: formData.expected_behavior || undefined,
      actual_behavior: formData.actual_behavior || undefined,
      steps_to_reproduce: formData.steps_to_reproduce || undefined,
      tags: parseArrayField(formData.tags) || undefined,
      sources: parseArrayField(formData.sources) || undefined,
      attachments: [], // Will be validated separately
      cluster_id: formData.cluster_id || undefined,
    }

    // Validate with zod schema
    const validation = validateWithSchema(getBugReportSchema(), validationData)
    if (!validation.success) {
      throw new Error(validation.error)
    }

    // Transform data
    const transformedData = await transformClusterBugData(formData, authResult)

    // Add timestamps and created_by field
    const recordData = addTimestamps({
      ...transformedData,
      created_by: ensureValidUUID(authResult.user.id)
    })

    const record = await insertRecord('bugs', recordData)
    return { bug: record }
  }, 201)
