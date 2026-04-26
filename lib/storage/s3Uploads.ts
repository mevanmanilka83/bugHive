import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getS3Client } from "../config"
import { generateUUID } from "../utils/client"
import { parseFormData } from "../api/parseForms"
import { env } from "../config/environment"

function determineBugFolder(formData: any): string {
  if (formData.cluster_id) {
    return 'bugs/clusters'
  }
  
  const visibility = (formData.visibility || 'public').toLowerCase()
  if (visibility === 'private') {
    return 'bugs/private'
  }
  
  return 'bugs/public'
}

function isFileOrBlob(value: unknown): value is File | Blob {
  return value !== null && 
         typeof value === 'object' && 
         ('constructor' in value && 
          (value.constructor.name === 'File' || value.constructor.name === 'Blob'))
}

export async function handleFileUploads(formData: any, folder: string = 'bugs'): Promise<string[]> {
  const uploadFolder = folder === 'bugs' && (formData.visibility || formData.cluster_id)
    ? determineBugFolder(formData)
    : folder
  const attachments: File[] = []
  
  if (formData instanceof FormData) {
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('attachment_') && isFileOrBlob(value)) {
        attachments.push(value as File)
      }
    }
  } else {
    for (const [key, value] of Object.entries(formData)) {
      if (key.startsWith('attachment_') && isFileOrBlob(value)) {
        attachments.push(value as File)
      }
    }
  }

  if (attachments.length === 0) {
    return []
  }

  if (!process.env.AWS_S3_BUCKET) {
    console.error('AWS_S3_BUCKET environment variable is not set')
    throw new Error('S3 bucket configuration is missing. Please check your .env file.')
  }

  if (!process.env.AWS_REGION) {
    console.error('AWS_REGION environment variable is not set')
    throw new Error('AWS region configuration is missing. Please check your .env file.')
  }

  let client
  try {
    client = getS3Client()
  } catch (configError: any) {
    console.error('S3 client configuration error:', configError)
    throw new Error(`S3 configuration error: ${configError?.message || 'Invalid AWS credentials. Please check your .env file.'}`)
  }

  try {
    const uploadPromises = attachments.map(async (file, index) => {
      const fileName = `${uploadFolder}/${generateUUID()}_${index}_${file instanceof File ? file.name : `attachment_${index}`}`
      
      const arrayBuffer = await file.arrayBuffer()
      const fileBuffer = Buffer.from(arrayBuffer)
      
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

const AVATAR_MAX_BYTES = 2 * 1024 * 1024 // 2MB
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function uploadAvatarFile(
  file: File | Blob,
  userId: string
): Promise<string> {
  if (!env.awsS3Bucket || !env.awsRegion) {
    throw new Error("S3 bucket configuration is missing. Please check your .env file.")
  }
  const buffer = await file.arrayBuffer()
  const size = buffer.byteLength
  if (size > AVATAR_MAX_BYTES) {
    throw new Error("Image must be 2MB or smaller.")
  }
  const type = file instanceof File ? file.type : "application/octet-stream"
  if (!AVATAR_TYPES.includes(type)) {
    throw new Error("Please use a JPEG, PNG, WebP, or GIF image.")
  }
  const ext = type === "image/jpeg" ? "jpg" : type.split("/")[1] || "jpg"
  const key = `avatars/${userId}_${Date.now()}.${ext}`
  const client = getS3Client()
  await client.send(
    new PutObjectCommand({
      Bucket: env.awsS3Bucket,
      Key: key,
      Body: Buffer.from(buffer),
      ContentType: type,
    })
  )
  return `https://${env.awsS3Bucket}.s3.${env.awsRegion}.amazonaws.com/${key}`
}

export async function processFormDataWithUploads(
  request: any, 
  folder: string = 'bugs'
): Promise<any> {
  const formData = await parseFormData(request)
  const uploadFolder = folder === 'bugs' && (formData.visibility || formData.cluster_id)
    ? determineBugFolder(formData)
    : folder
  const attachment_urls = await handleFileUploads(formData, uploadFolder)
  
  return {
    ...formData,
    attachments: attachment_urls.length ? attachment_urls : null
  }
}
