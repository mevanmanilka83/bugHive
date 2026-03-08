import { NextRequest, NextResponse } from "next/server"
import { findPotentialDuplicates } from "@/lib/graph/findRelated"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RequestBody = {
  title?: string
  description?: string
  tags?: string[]
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as RequestBody | null
    const title = body?.title != null ? String(body.title).slice(0, 500) : ""
    const description = body?.description != null ? String(body.description).slice(0, 2000) : ""
    const tags = Array.isArray(body?.tags)
      ? body.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 30)
      : []

    const duplicates = await findPotentialDuplicates({ title, description, tags })
    return NextResponse.json({ duplicates })
  } catch (error) {
    console.error("Potential duplicates error:", error)
    return NextResponse.json(
      { error: "Failed to check for duplicates" },
      { status: 500 }
    )
  }
}
