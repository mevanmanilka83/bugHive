import { z } from "zod"


export function getFileSchema() {
  return typeof window !== "undefined" && typeof File !== "undefined"
    ? z.instanceof(File)
    : z.any()
}

export const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'text/plain', 'text/csv', 'application/json',
  'application/pdf', 'application/zip'
] as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024

export const MAX_ATTACHMENTS = 5

export const PRIORITY_ENUM = ["low", "medium", "high", "critical"] as const

export function getAttachmentSchema() {
  const FileSchema = getFileSchema()
  
  return z.array(FileSchema)
    .refine((files) => {
      return files.every((file) => file.size <= MAX_FILE_SIZE)
    }, "File size must be less than 10MB")
    .refine((files) => {
      return files.every((file) => ALLOWED_FILE_TYPES.includes(file.type))
    }, "File type not supported")
    .refine((files) => {
      return files.length <= MAX_ATTACHMENTS
    }, "Maximum 5 attachments allowed")
    .optional()
    .nullable()
}

export function isValidUrl(url: string): boolean {
  const urlRegex = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i
  return urlRegex.test(url)
}

export function getLinksSchema() {
  return z.string()
    .refine((val) => {
      if (!val) return true // Optional field
      const links = val.split(',').map(s => s.trim()).filter(Boolean)
      return links.every((link) => isValidUrl(link))
    }, "All links must be valid URLs starting with http(s)://")
    .optional()
}

export const STRING_VALIDATIONS = {
  title: {
    min: 3,
    max: 100,
    minMessage: "Title must be at least 3 characters",
    maxMessage: "Title must be less than 100 characters"
  },
  description: {
    min: 3,
    max: 10000,
    minMessage: "Description must be at least 3 characters",
    maxMessage: "Description must be less than 10000 characters"
  }
} as const
