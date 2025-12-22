/**
 * Bug POST Handler
 * 
 * Handles creating new bugs:
 * - POST /api/bugs
 * - Supports file uploads for attachments
 * - Transforms form data into bug record format
 */
import { parseArrayField } from "@/lib/shared/shared"
import { createPostHandler } from "../../genericHandlers/postHandler"

/**
 * Transforms form data into bug record format
 * 
 * @param formData - Form data from request
 * @param authResult - Authentication result with user info
 * @returns Transformed bug data ready for database insertion
 */
export function transformBugData(formData: any, authResult: any) {
  return {
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
  }
}

/**
 * Creates POST handler for bugs
 * 
 * Features:
 * - Validates required fields (title, description)
 * - Transforms form data to bug format
 * - Supports file uploads (attachments)
 * - Uploads files to 'bugs' folder in S3
 */
export const createBugPostHandler = () => 
  createPostHandler(
    'bugs',
    ['title', 'description'],
    transformBugData,
    { enableFileUpload: true, uploadFolder: 'bugs' }
  )
