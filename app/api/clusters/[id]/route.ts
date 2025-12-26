import { checkAuth, addTimestamps, ensureValidUUID, getSingleRecord, updateRecord, deleteRecord } from "@/lib"
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

  const { id } = await context.params
  const cluster = await getSingleRecord('clusters', id)
  return NextResponse.json({ cluster })
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id } = await context.params
  const body = await request.json().catch(() => ({}))

  // Verify ownership
  const cluster = await getSingleRecord('clusters', id)
  if (cluster.owner_id !== ensureValidUUID(user.id)) {
    return NextResponse.json({ error: "Only cluster owners can update clusters" }, { status: 403 })
  }

  const allowedFields = ['name', 'description']
  const updateData: any = {}
  
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  const updated = await updateRecord('clusters', id, addTimestamps(updateData))
  return NextResponse.json({ cluster: updated })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { id } = await context.params

  // Verify ownership
  const cluster = await getSingleRecord('clusters', id)
  if (cluster.owner_id !== ensureValidUUID(user.id)) {
    return NextResponse.json({ error: "Only cluster owners can delete clusters" }, { status: 403 })
  }

  await deleteRecord('clusters', id)
  return NextResponse.json({ message: "Cluster deleted successfully" })
}
