import { NextRequest } from "next/server"
import { extractRouteId, getSingleRecord, successResponse, errorResponse } from "@/lib"
import { buildBugSubgraph } from "@/lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export type GraphNode = {
  id: string
  type: string
  label: string
  data: Record<string, unknown>
  position?: { x: number; y: number }
}

export type GraphEdge = {
  id: string
  source: string
  target: string
  type: string
  weight: number
  label?: string
  data?: Record<string, unknown>
  style?: Record<string, unknown>
}

export type GraphResponse = {
  center: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  insights?: {
    rootCausePatterns: string[]
    recurringEnvironments: Array<{ environment: string; count: number }>
    externalReferences: Array<{ type: string; title: string; url: string }>
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const bugId = await extractRouteId(context)
    const bug = await getSingleRecord("bugs", bugId)

    if (!bug) {
      return errorResponse("Bug not found", 404)
    }

    const { searchParams } = new URL(request.url)
    const depth = Math.min(2, Math.max(1, parseInt(searchParams.get("depth") ?? "1", 10) || 1))
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get("limit") ?? "25", 10) || 25))
    const similarityThreshold = parseFloat(searchParams.get("threshold") ?? "0.35") || 0.35

    const { center, nodes, edges } = await buildBugSubgraph(bug, {
      limit,
      similarityThreshold: Number.isFinite(similarityThreshold) ? similarityThreshold : 0.35,
      internalLimit: Math.min(15, Math.ceil(limit * 0.5)),
      externalLimit: Math.min(10, Math.ceil(limit * 0.4)),
      relationshipConfidenceMin: 0.5,
    })

    const response: GraphResponse = {
      center,
      nodes,
      edges,
      insights: {
        rootCausePatterns: [],
        recurringEnvironments: [],
        externalReferences: [],
      },
    }

    return successResponse(response)
  } catch (error) {
    console.error("Bug graph error:", error)
    return errorResponse(error instanceof Error ? error.message : "Failed to generate graph")
  }
}
