import { NextRequest } from "next/server"

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
