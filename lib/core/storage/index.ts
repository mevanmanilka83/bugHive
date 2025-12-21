/**
 * File Storage Operations
 * 
 * Handles file uploads to AWS S3:
 * - Processes file attachments from form data
 * - Uploads files to S3 with organized folder structure
 * - Returns public URLs for uploaded files
 */
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { s3Client } from "../config"
import { generateUUID } from "../utils/utils"
import { parseFormData } from "../form/form"

/**
 * Handles file uploads to S3
 * 
 * @param formData - Form data containing file attachments
 * @param folder - S3 folder name (default: 'bugs')
 * @returns Array of public URLs for uploaded files
 */
export async function handleFileUploads(formData: any, folder: string = 'bugs'): Promise<string[]> {
  const attachments: File[] = []
  
  // Extract file attachments from form data
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

/**
 * Processes form data and uploads any file attachments
 * 
 * @param request - Next.js request object
 * @param folder - S3 folder name (default: 'bugs')
 * @returns Form data with attachment URLs added
 */
export async function processFormDataWithUploads(
  request: any, 
  folder: string = 'bugs'
): Promise<any> {
  const formData = await parseFormData(request)
  const attachment_urls = await handleFileUploads(formData, folder)
  
  return {
    ...formData,
    attachments: attachment_urls.length ? attachment_urls : null
  }
}
