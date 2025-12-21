/**
 * Solution POST Handler
 * 
 * Handles creating new solutions:
 * - POST /api/bugs/[id]/solutions
 * - Supports file uploads for solution attachments
 */
import { extractBugId, parseArrayField } from "@/lib/core"
import { createPostHandler } from "../post"

/**
 * Creates POST handler for solutions
 * 
 * Features:
 * - Validates required fields
 * - Extracts bug_id from route parameters
 * - Supports file uploads (attachments)
 * - Uploads files to 'solutions' folder in S3
 */
export const createSolutionPostHandler = () => 
  createPostHandler(
    'bug_solution_details',
    ['title', 'description', 'solution_type', 'priority', 'status'],
    async (formData, authResult, context) => {
      // Extract bug_id from route parameters (/api/bugs/[id]/solutions)
      const bugId = context?.params ? await extractBugId(context) : null
      if (!bugId) {
        throw new Error("Bug ID is required")
      }
      
      return {
        bug_id: bugId,
        title: formData.title?.trim() || formData.title,
        description: formData.description?.trim() || formData.description,
        solution_type: formData.solution_type,
        priority: formData.priority,
        status: formData.status,
        assignee: formData.assignee || null,
        estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
        links: parseArrayField(formData.links),
        // attachment_urls will be handled by processFormDataWithUploads if file upload is enabled
        attachment_urls: formData.attachments || null,
      }
    },
    { enableFileUpload: true, uploadFolder: 'solutions' }
  )
