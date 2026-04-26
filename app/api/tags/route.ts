import { NextRequest, NextResponse } from "next/server"
import { getMultipleRecords } from "@/lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const bugs = await getMultipleRecords("bugs")
    
    const publicBugs = bugs.filter((bug: any) => {
      const visibility = String(bug?.visibility || "public").toLowerCase().trim()
      return visibility !== "private"
    })

    const tagCounts = new Map<string, number>()
    
    publicBugs.forEach((bug: any) => {
      if (Array.isArray(bug.tags)) {
        bug.tags.forEach((tag: string) => {
          if (tag && typeof tag === "string" && tag.trim()) {
            const normalizedTag = tag.trim()
            tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1)
          }
        })
      }
    })

    const tags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return a.tag.localeCompare(b.tag)
      })

    return NextResponse.json({ tags })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch tags" },
      { status: 500 }
    )
  }
}
