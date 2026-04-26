import { auth, checkAuth, addTimestamps, ensureValidUUID, getSingleRecord, updateRecord, deleteRecord, supabase, normalizeClusterDescription } from "@/lib"
import { NextRequest, NextResponse } from "next/server"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const session = await auth()

  if (!session?.user?.id) {
    const { data: cluster, error } = await supabase
      .from("clusters")
      .select("*")
      .eq("id", id)
      .eq("visibility", "public")
      .single()

    if (error || !cluster) {
      return NextResponse.json({ error: "Cluster not found" }, { status: 404 })
    }

    return NextResponse.json({ cluster })
  }

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

  const cluster = await getSingleRecord('clusters', id)
  if (cluster.owner_id !== ensureValidUUID(user.id)) {
    return NextResponse.json({ error: "Only cluster owners can update clusters" }, { status: 403 })
  }

  const allowedFields = ['name', 'description', 'visibility']
  const updateData: any = {}

  if (body.name !== undefined) {
    const nextName = String(body.name).trim()
    if (nextName.length < 3) {
      return NextResponse.json({ error: "Cluster name must be at least 3 characters" }, { status: 400 })
    }
    if (nextName.length > 100) {
      return NextResponse.json({ error: "Cluster name must be less than 100 characters" }, { status: 400 })
    }
    updateData.name = nextName
  }

  if (body.description !== undefined) {
    const descriptionResult = normalizeClusterDescription(body.description)
    if (!descriptionResult.success) {
      return NextResponse.json({ error: descriptionResult.error }, { status: 400 })
    }
    updateData.description = descriptionResult.value
  }

  if (body.visibility !== undefined) {
    const nextVisibility = String(body.visibility).toLowerCase().trim()
    if (nextVisibility !== "private" && nextVisibility !== "public") {
      return NextResponse.json({ error: "Visibility must be private or public" }, { status: 400 })
    }

    const currentVisibility = (cluster.visibility || "private").toString().toLowerCase().trim()
    const isVisibilityChanged = nextVisibility !== currentVisibility
    const hasConfirmedChange = body.confirmVisibilityChange === true

    if (isVisibilityChanged && !hasConfirmedChange) {
      return NextResponse.json(
        {
          error: `You are changing visibility from ${currentVisibility} to ${nextVisibility}. Please confirm to continue.`,
          code: "VISIBILITY_CONFIRM_REQUIRED",
        },
        { status: 409 }
      )
    }

    updateData.visibility = nextVisibility
  }
  
  for (const field of allowedFields) {
    if (body[field] !== undefined && updateData[field] === undefined) {
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

  const cluster = await getSingleRecord('clusters', id)
  if (cluster.owner_id !== ensureValidUUID(user.id)) {
    return NextResponse.json({ error: "Only cluster owners can delete clusters" }, { status: 403 })
  }

  await deleteRecord('clusters', id)
  return NextResponse.json({ message: "Cluster deleted successfully" })
}
