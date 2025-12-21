import { z } from "zod"

/**
 * Shared Zod Schema Utilities
 * 
 * Common validation patterns used across multiple schemas
 */

/**
 * File schema that works in both browser and Node.js environments
 * Builds at runtime to avoid SSR issues with File in Node
 */
export function getFileSchema() {
  return typeof window !== "undefined" && typeof File !== "undefined"
    ? z.instanceof(File)
    : z.any()
}

/**
 * Allowed file types for attachments
 */
export const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'text/plain', 'text/csv', 'application/json',
  'application/pdf', 'application/zip'
] as const

/**
 * Maximum file size in bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * Maximum number of attachments allowed
 */
export const MAX_ATTACHMENTS = 5

/**
 * Priority levels enum
 */
export const PRIORITY_ENUM = ["low", "medium", "high", "critical"] as const

/**
 * Creates a file attachment schema with validation
 * 
 * Validates:
 * - File size (max 10MB each)
 * - File type (allowed types only)
 * - Total attachment count (max 5)
 */
export function getAttachmentSchema() {
  const FileSchema = getFileSchema()
  
  return z.array(FileSchema)
    .refine((files) => {
      // Check file size (max 10MB each)
      return files.every((file) => file.size <= MAX_FILE_SIZE)
    }, "File size must be less than 10MB")
    .refine((files) => {
      // Check file type
      return files.every((file) => ALLOWED_FILE_TYPES.includes(file.type))
    }, "File type not supported")
    .refine((files) => {
      // Check total attachment count
      return files.length <= MAX_ATTACHMENTS
    }, "Maximum 5 attachments allowed")
    .optional()
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
  const urlRegex = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i
  return urlRegex.test(url)
}

/**
 * Creates a links validation schema
 * Accepts comma-separated URLs and validates each one
 */
export function getLinksSchema() {
  return z.string()
    .refine((val) => {
      if (!val) return true // Optional field
      const links = val.split(',').map(s => s.trim()).filter(Boolean)
      return links.every((link) => isValidUrl(link))
    }, "All links must be valid URLs starting with http(s)://")
    .optional()
}

/**
 * Common string validation patterns
 */
export const STRING_VALIDATIONS = {
  title: {
    min: 3,
    max: 100,
    minMessage: "Title must be at least 3 characters",
    maxMessage: "Title must be less than 100 characters"
  },
  description: {
    min: 3,
    max: 2000,
    minMessage: "Description must be at least 3 characters",
    maxMessage: "Description must be less than 2000 characters"
  }
} as const
