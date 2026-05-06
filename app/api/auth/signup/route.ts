import { NextRequest } from "next/server"
import { errorResponse, successResponse, validateWithSchema } from "@/lib"
import { hashPassword } from "@/lib/password"
import { saveUserToSupabase } from "@/app/actions/User"
import { getSignupValidationSchema } from "@/lib"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = validateWithSchema(getSignupValidationSchema(), body)
    if (!validation.success) {
      return errorResponse(validation.error, 400)
    }

    const { email, password, name } = validation.data

    const passwordHash = await hashPassword(password)

    const result = await saveUserToSupabase(
      email,
      name,
      null,
      null,
      passwordHash
    )

    if (!result.success) {
      return errorResponse(result.error || "Failed to create user", 500)
    }

    return successResponse({ 
      message: "User created successfully", 
      user: result.data
    }, 201)
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error", 
      500
    )
  }
}
