import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib"
import { requireRole } from "@/lib/auth/helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type AdminBugSummary = {
  id: string
  title: string
  visibility: "public" | "private" | null
  priority: string | null
  cluster_id: string | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
}

type AdminBugsResponse = {
  bugs: AdminBugSummary[]
  total: number
  page: number
  pageSize: number
}

// GET /api/admin/bugs?q=&visibility=&page=&pageSize=
export async function GET(request: NextRequest) {
  const roleResult = await requireRole("admin")
  if (!roleResult.success) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(request.url)
  const q = url.searchParams.get("q")?.trim() || ""
  const visibility = url.searchParams.get("visibility")?.trim() || ""
  const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10) || 1, 1)
  const pageSize = Math.min(
    Math.max(parseInt(url.searchParams.get("pageSize") || "25", 10) || 25, 1),
    200
  )
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = (await getSupabaseAdmin()) as any

  let query = supabase
    .from("bugs")
    .select(
      "id, title, visibility, priority, cluster_id, created_by, created_at, updated_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to)

  if (visibility === "public" || visibility === "private") {
    query = query.eq("visibility", visibility)
  }

  if (q) {
    query = query.ilike(
      "title",
      `%${q.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`
    )
  }

  const { data, error, count } = await query

  if (error) {
    console.error("Admin bugs GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch bugs" },
      { status: 500 }
    )
  }

  const bugs: AdminBugSummary[] = (data || []).map((b: any) => ({
    id: String(b.id),
    title: String(b.title ?? "Untitled"),
    visibility: (b.visibility as "public" | "private" | null) ?? null,
    priority: b.priority ?? null,
    cluster_id: b.cluster_id ?? null,
    created_by: b.created_by ?? null,
    created_at: b.created_at ?? null,
    updated_at: b.updated_at ?? null,
  }))

  const payload: AdminBugsResponse = {
    bugs,
    total: count ?? bugs.length,
    page,
    pageSize,
  }

  return NextResponse.json(payload)
}

// PATCH /api/admin/bugs  { id, visibility?, priority? }
export async function PATCH(request: NextRequest) {
  const roleResult = await requireRole("admin")
  if (!roleResult.success) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const id = typeof body?.id === "string" ? body.id : null
  const visibility = body?.visibility as string | undefined
  const priority = body?.priority as string | undefined

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  const update: Record<string, any> = {}

  if (visibility) {
    if (visibility !== "public" && visibility !== "private") {
      return NextResponse.json(
        { error: "visibility must be 'public' or 'private'" },
        { status: 400 }
      )
    }
    update.visibility = visibility
  }

  if (priority) {
    const allowed = ["low", "medium", "high", "critical"]
    if (!allowed.includes(priority)) {
      return NextResponse.json(
        { error: "priority must be one of: low, medium, high, critical" },
        { status: 400 }
      )
    }
    update.priority = priority
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "At least one of visibility or priority must be provided" },
      { status: 400 }
    )
  }

  update.updated_at = new Date().toISOString()

  const supabase = (await getSupabaseAdmin()) as any

  const { data, error } = await supabase
    .from("bugs")
    .update(update)
    .eq("id", id)
    .select(
      "id, title, visibility, priority, cluster_id, created_by, created_at, updated_at"
    )
    .single()

  if (error) {
    console.error("Admin bugs PATCH error:", error)
    return NextResponse.json(
      { error: "Failed to update bug" },
      { status: 500 }
    )
  }

  const bug: AdminBugSummary = {
    id: String(data.id),
    title: String(data.title ?? "Untitled"),
    visibility: (data.visibility as "public" | "private" | null) ?? null,
    priority: data.priority ?? null,
    cluster_id: data.cluster_id ?? null,
    created_by: data.created_by ?? null,
    created_at: data.created_at ?? null,
    updated_at: data.updated_at ?? null,
  }

  return NextResponse.json({ bug })
}

