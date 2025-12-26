import { checkAuth } from "@/lib/auth/helpers"
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
}
