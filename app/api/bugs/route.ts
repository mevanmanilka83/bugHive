import { createBugHandler, getMultipleRecords } from "@/lib"
import { NextRequest, NextResponse } from "next/server"

const bugHandler = createBugHandler()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const createdBy = url.searchParams.get('created_by') ?? undefined
    const clusterId = url.searchParams.get('cluster_id') ?? undefined
    const filterField = url.searchParams.get('filter_field') ?? (createdBy ? 'created_by' : clusterId ? 'cluster_id' : undefined)
    const filterValue = url.searchParams.get('filter_value') ?? createdBy ?? clusterId ?? undefined
    const limitParam = url.searchParams.get('limit')

    const records = await getMultipleRecords(
      'bugs',
      filterField || undefined,
      filterValue || undefined
    )
    const publicScoped = filterField ? records : records.filter((bug: any) => !bug?.cluster_id)
    const bugs = limitParam ? publicScoped.slice(0, parseInt(limitParam, 10) || 500) : publicScoped

    return NextResponse.json({ bugs })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to fetch bugs' },
      { status: 500 }
    )
  }
}

export const POST = bugHandler.POST
