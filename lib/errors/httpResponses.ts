
import { NextResponse } from "next/server"

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return "Internal server error"
}

export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status })
}

export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status })
}

export function createErrorResponse(
  error: unknown, 
  defaultMessage: string = "Internal server error"
): { success: false; error: string } {
  return {
    success: false,
    error: getErrorMessage(error) || defaultMessage
  }
}

export function handleSupabaseError(
  error: any, 
  defaultMessage: string
): { success: false; error: string; details?: any } {
  return {
    success: false,
    error: error?.message || defaultMessage,
    details: error?.code || 'UNKNOWN_ERROR'
  }
}
