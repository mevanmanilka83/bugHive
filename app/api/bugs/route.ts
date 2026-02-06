import { createBugHandler, getMultipleRecords } from "@/lib"
import { NextRequest, NextResponse } from "next/server"

const bugHandler = createBugHandler()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET: List bugs. Public (no auth required) so public bugs show when logged out. */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const filterField = url.searchParams.get('filter_field') ?? url.searchParams.get('created_by') ? 'created_by' : undefined
    const filterValue = url.searchParams.get('filter_value') ?? url.searchParams.get('created_by') ?? undefined
    const limitParam = url.searchParams.get('limit')

    const records = await getMultipleRecords(
      'bugs',
      filterField || undefined,
      filterValue || undefined
    )
    const bugs = limitParam ? records.slice(0, parseInt(limitParam, 10) || 500) : records

    return NextResponse.json({ bugs })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to fetch bugs' },
      { status: 500 }
    )
  }
}

export const POST = bugHandler.POST
