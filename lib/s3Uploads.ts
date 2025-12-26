/**
 * File Storage Operations
 * 
 * Handles file uploads to AWS S3:
 * - Processes file attachments from form data
 * - Uploads files to S3 with organized folder structure
 * - Returns public URLs for uploaded files
 */
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getS3Client, generateUUID, parseFormData, env } from "@/lib"

/**
 * Determines the correct S3 folder path for bug attachments
 * 
 * @param formData - Form data containing visibility and cluster_id
 * @returns S3 folder path (bugs/clusters, bugs/private, or bugs/public)
 */
function determineBugFolder(formData: any): string {
  // If cluster_id exists, use clusters folder
  if (formData.cluster_id) {
    return 'bugs/clusters'
  }
  
  // Otherwise, use visibility-based folder
  const visibility = (formData.visibility || 'public').toLowerCase()
  if (visibility === 'private') {
    return 'bugs/private'
  }
  
  return 'bugs/public'
}

/**
 * Type guard to check if a value is a File or Blob
 */
function isFileOrBlob(value: unknown): value is File | Blob {
  return value !== null && 
         typeof value === 'object' && 
         ('constructor' in value && 
          (value.constructor.name === 'File' || value.constructor.name === 'Blob'))
}

/**
 * Handles file uploads to S3
 * 
 * @param formData - Form data containing file attachments
 * @param folder - S3 folder name (default: 'bugs'). If 'bugs' is passed, will auto-determine based on formData
 * @returns Array of public URLs for uploaded files
 */
export async function handleFileUploads(formData: any, folder: string = 'bugs'): Promise<string[]> {
  // Auto-determine folder if 'bugs' is passed and formData contains visibility/cluster_id
  const uploadFolder = folder === 'bugs' && (formData.visibility || formData.cluster_id)
    ? determineBugFolder(formData)
    : folder
  const attachments: File[] = []
  
  // Extract file attachments from form data
  // Handle both FormData entries and plain object entries
  // In Node.js, FormData may return File or Blob objects
  if (formData instanceof FormData) {
    // If formData is FormData, iterate directly
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('attachment_') && isFileOrBlob(value)) {
        attachments.push(value as File)
      }
    }
  } else {
    // If formData is a plain object, iterate over entries
    for (const [key, value] of Object.entries(formData)) {
      if (key.startsWith('attachment_') && isFileOrBlob(value)) {
        attachments.push(value as File)
      }
    }
  }

  if (attachments.length === 0) {
    return []
  }

  // Validate S3 configuration and get client (this will throw if config is invalid)
  if (!process.env.AWS_S3_BUCKET) {
    console.error('AWS_S3_BUCKET environment variable is not set')
    throw new Error('S3 bucket configuration is missing. Please check your .env file.')
  }

  if (!process.env.AWS_REGION) {
    console.error('AWS_REGION environment variable is not set')
    throw new Error('AWS region configuration is missing. Please check your .env file.')
  }

  // Get S3 client (will validate credentials)
  let client
  try {
    client = getS3Client()
  } catch (configError: any) {
    console.error('S3 client configuration error:', configError)
    throw new Error(`S3 configuration error: ${configError?.message || 'Invalid AWS credentials. Please check your .env file.'}`)
  }

  try {
    const uploadPromises = attachments.map(async (file, index) => {
      // Get file name - File objects have .name, Blob objects might not
      const fileName = `${uploadFolder}/${generateUUID()}_${index}_${file instanceof File ? file.name : `attachment_${index}`}`
      
      // Convert to buffer - works for both File and Blob
      const arrayBuffer = await file.arrayBuffer()
      const fileBuffer = Buffer.from(arrayBuffer)
      
      // Get content type
      const contentType = file.type || 'application/octet-stream'

      const command = new PutObjectCommand({
        Bucket: env.awsS3Bucket!,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
      })

      await client.send(command)
      const url = `https://${env.awsS3Bucket}.s3.${env.awsRegion}.amazonaws.com/${fileName}`
      return url
    })

    const urls = await Promise.all(uploadPromises)
    return urls
  } catch (uploadError: any) {
    console.error('Error uploading files to S3:', uploadError)
    
    // Provide more specific error messages
    if (uploadError?.name === 'InvalidAccessKeyId' || uploadError?.name === 'SignatureDoesNotMatch') {
      throw new Error('Invalid AWS credentials. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file.')
    }
    if (uploadError?.name === 'NoSuchBucket') {
      throw new Error(`S3 bucket "${process.env.AWS_S3_BUCKET}" does not exist or is not accessible. Please check your AWS_S3_BUCKET configuration.`)
    }
    if (uploadError?.name === 'AccessDenied') {
      throw new Error(`Access denied to S3 bucket "${process.env.AWS_S3_BUCKET}". Please check your AWS credentials and bucket permissions.`)
    }
    
    throw new Error(`Failed to upload attachments: ${uploadError?.message || 'Unknown error'}`)
  }
}

/**
 * Processes form data and uploads any file attachments
 * 
 * @param request - Next.js request object
 * @param folder - S3 folder name (default: 'bugs'). If 'bugs' is passed, will auto-determine based on formData
 * @returns Form data with attachment URLs added
 */
export async function processFormDataWithUploads(
  request: any, 
  folder: string = 'bugs'
): Promise<any> {
  const formData = await parseFormData(request)
  // Auto-determine folder for bugs based on visibility and cluster_id
  const uploadFolder = folder === 'bugs' && (formData.visibility || formData.cluster_id)
    ? determineBugFolder(formData)
    : folder
  const attachment_urls = await handleFileUploads(formData, uploadFolder)
  
  return {
    ...formData,
    attachments: attachment_urls.length ? attachment_urls : null
  }
}
