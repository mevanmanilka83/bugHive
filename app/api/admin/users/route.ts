import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib"
import { requireRole } from "@/lib/auth/helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type AdminUserSummary = {
  id: string
  email: string | null
  name: string | null
  image: string | null
  role: string | null
}

type AdminUsersResponse = {
  users: AdminUserSummary[]
  total: number
  page: number
  pageSize: number
}

// GET /api/admin/users?q=&page=&pageSize=
export async function GET(request: NextRequest) {
  const roleResult = await requireRole("admin")
  if (!roleResult.success) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(request.url)
  const q = url.searchParams.get("q")?.trim() || ""
  const page = Math.max(parseInt(url.searchParams.get("page") || "1", 10) || 1, 1)
  const pageSize = Math.min(
    Math.max(parseInt(url.searchParams.get("pageSize") || "25", 10) || 25, 1),
    200
  )
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = (await getSupabaseAdmin()) as any

  let query = supabase
    .from("users")
    .select("id, email, name, image, role", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (q) {
    // Basic search on email or name
    query = query.or(
      `email.ilike.%${q.replace(/%/g, "\\%").replace(/_/g, "\\_")}%,name.ilike.%${q
        .replace(/%/g, "\\%")
        .replace(/_/g, "\\_")}%`
    )
  }

  const { data, error, count } = await query

  if (error) {
    console.error("Admin users GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }

  const users: AdminUserSummary[] = (data || []).map((u: any) => ({
    id: String(u.id),
    email: u.email ?? null,
    name: u.name ?? null,
    image: u.image ?? null,
    role: u.role ?? null,
  }))

  const payload: AdminUsersResponse = {
    users,
    total: count ?? users.length,
    page,
    pageSize,
  }

  return NextResponse.json(payload)
}

// PATCH /api/admin/users  { id, role }
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
  const role = typeof body?.role === "string" ? body.role : null

  if (!id || (role !== "user" && role !== "admin")) {
    return NextResponse.json(
      { error: "id and role ('user' | 'admin') are required" },
      { status: 400 }
    )
  }

  const supabase = (await getSupabaseAdmin()) as any

  const { data, error } = await supabase
    .from("users")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, email, name, image, role")
    .single()

  if (error) {
    console.error("Admin users PATCH error:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }

  const user: AdminUserSummary = {
    id: String(data.id),
    email: data.email ?? null,
    name: data.name ?? null,
    image: data.image ?? null,
    role: data.role ?? null,
  }

  return NextResponse.json({ user })
}

