import { NextRequest } from "next/server"
import { extractRouteId, getSingleRecord, getMultipleRecords, successResponse, errorResponse } from "@/lib"
import { stripHtml } from "@/lib/utils-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const GEMINI_MODEL = "gemini-1.5-flash"
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

type NodeType =
  | "bug"
  | "cluster"
  | "tag"
  | "environment"
  | "component"
  | "github_issue"
  | "stack_overflow"
  | "bugzilla"

type RelationshipType =
  | "duplicate_of"
  | "tagged_with"
  | "occurs_on"
  | "affects"
  | "similar_to"
  | "fix_reference"
  | "belongs_to"
  | "related_to"

export type GraphNode = {
  id: string
  type: NodeType
  label: string
  data: {
    title?: string
    description?: string
    url?: string
    count?: number
    [key: string]: any
  }
  position?: { x: number; y: number }
}

export type GraphEdge = {
  id: string
  source: string
  target: string
  type: RelationshipType
  weight: number // 0-1, higher = stronger relationship
  label?: string
}

export type GraphData = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  insights: {
    rootCausePatterns: string[]
    recurringEnvironments: Array<{ environment: string; count: number }>
    externalReferences: Array<{ type: string; title: string; url: string }>
  }
}

async function analyzeWithGemini(bug: any, relatedBugs: any[], relatedExternal: any[]): Promise<GraphData> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return generateFallbackGraph(bug, relatedBugs, relatedExternal)
  }

  const bugText = [
    `Title: ${bug.title || ""}`,
    `Description: ${bug.description || ""}`,
    `Environment: ${bug.environment || ""}`,
    `Tags: ${Array.isArray(bug.tags) ? bug.tags.join(", ") : ""}`,
    `Error: ${bug.actual_behavior || ""}`,
  ].join("\n")

  const relatedText = relatedBugs
    .slice(0, 10)
    .map((b, i) => `Bug ${i + 1}: ${b.title || ""} - ${(b.description || "").slice(0, 200)}`)
    .join("\n")

  const externalText = relatedExternal
    .slice(0, 10)
    .map((e) => `${e.source}: ${e.title || ""}`)
    .join("\n")

  const prompt = `Analyze this bug report and its related items. Generate a JSON graph structure with nodes and relationships.

Bug Report:
${bugText}

Related Bugs:
${relatedText}

External References:
${externalText}

Return JSON with this structure:
{
  "nodes": [
    {"id": "bug-123", "type": "bug", "label": "Short Title", "data": {...}},
    {"id": "tag-js", "type": "tag", "label": "javascript", "data": {"count": 5}},
    {"id": "env-safari", "type": "environment", "label": "Safari", "data": {...}},
    {"id": "gh-456", "type": "github_issue", "label": "Issue Title", "data": {"url": "..."}}
  ],
  "edges": [
    {"id": "e1", "source": "bug-123", "target": "tag-js", "type": "tagged_with", "weight": 0.9},
    {"id": "e2", "source": "bug-123", "target": "bug-124", "type": "similar_to", "weight": 0.8},
    {"id": "e3", "source": "bug-123", "target": "gh-456", "type": "fix_reference", "weight": 0.7}
  ],
  "insights": {
    "rootCausePatterns": ["Pattern 1", "Pattern 2"],
    "recurringEnvironments": [{"environment": "Safari", "count": 5}],
    "externalReferences": [{"type": "GitHub", "title": "...", "url": "..."}]
  }
}

Node types: bug, cluster, tag, environment, component, github_issue, stack_overflow, bugzilla
Relationship types: duplicate_of, tagged_with, occurs_on, affects, similar_to, fix_reference, belongs_to, related_to
Weight: 0.0-1.0, where 1.0 is strongest relationship.`

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4000,
            responseMimeType: "application/json",
          },
        }),
      }
    )

    if (!response.ok) {
      return generateFallbackGraph(bug, relatedBugs, relatedExternal)
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return generateFallbackGraph(bug, relatedBugs, relatedExternal)

    try {
      const parsed = JSON.parse(text)
      return validateAndEnrichGraph(parsed, bug, relatedBugs, relatedExternal)
    } catch {
      return generateFallbackGraph(bug, relatedBugs, relatedExternal)
    }
  } catch {
    return generateFallbackGraph(bug, relatedBugs, relatedExternal)
  }
}

function generateFallbackGraph(bug: any, relatedBugs: any[], relatedExternal: any[]): GraphData {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const insights = {
    rootCausePatterns: [] as string[],
    recurringEnvironments: [] as Array<{ environment: string; count: number }>,
    externalReferences: [] as Array<{ type: string; title: string; url: string }>,
  }

  // Main bug node
  const bugId = `bug-${bug.id}`
  nodes.push({
    id: bugId,
    type: "bug",
    label: (bug.title || "Untitled Bug").slice(0, 30),
    data: {
      title: bug.title,
      description: stripHtml(String(bug.description || "")).slice(0, 200),
      url: `/bugs/${bug.id}`,
    },
  })

  // Tags
  if (Array.isArray(bug.tags)) {
    bug.tags.forEach((tag: string) => {
      const tagId = `tag-${tag.toLowerCase().replace(/\s+/g, "-")}`
      if (!nodes.find((n) => n.id === tagId)) {
        nodes.push({
          id: tagId,
          type: "tag",
          label: tag,
          data: { count: 1 },
        })
      }
      edges.push({
        id: `edge-${bugId}-${tagId}`,
        source: bugId,
        target: tagId,
        type: "tagged_with",
        weight: 0.8,
      })
    })
  }

  // Environment
  if (bug.environment) {
    const envId = `env-${bug.environment.toLowerCase().replace(/\s+/g, "-")}`
    if (!nodes.find((n) => n.id === envId)) {
      nodes.push({
        id: envId,
        type: "environment",
        label: bug.environment.slice(0, 30),
        data: { environment: bug.environment },
      })
    }
    edges.push({
      id: `edge-${bugId}-${envId}`,
      source: bugId,
      target: envId,
      type: "occurs_on",
      weight: 0.7,
    })
  }

  // Related bugs
  relatedBugs.slice(0, 10).forEach((relatedBug: any, idx: number) => {
    const relatedId = `bug-${relatedBug.id}`
    if (!nodes.find((n) => n.id === relatedId)) {
      nodes.push({
        id: relatedId,
        type: "bug",
        label: (relatedBug.title || "Untitled").slice(0, 30),
        data: {
          title: relatedBug.title,
          url: `/bugs/${relatedBug.id}`,
        },
      })
    }
    edges.push({
      id: `edge-${bugId}-${relatedId}`,
      source: bugId,
      target: relatedId,
      type: "similar_to",
      weight: 0.6,
    })
  })

  // External references
  relatedExternal.slice(0, 10).forEach((ext: any, idx: number) => {
    const extId = `ext-${ext.source}-${idx}`
    const nodeType: NodeType =
      ext.source === "github_issue" || ext.source === "github_repo"
        ? "github_issue"
        : ext.source === "stack_overflow_question"
          ? "stack_overflow"
          : ext.source === "bugzilla_bug"
            ? "bugzilla"
            : "bug"

    nodes.push({
      id: extId,
      type: nodeType,
      label: (ext.title || "").slice(0, 30),
      data: {
        title: ext.title,
        url: ext.url,
        snippet: ext.snippet,
      },
    })
    edges.push({
      id: `edge-${bugId}-${extId}`,
      source: bugId,
      target: extId,
      type: "related_to",
      weight: 0.5,
    })

    insights.externalReferences.push({
      type: ext.source.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      title: ext.title,
      url: ext.url,
    })
  })

  return { nodes, edges, insights }
}

function validateAndEnrichGraph(
  parsed: any,
  bug: any,
  relatedBugs: any[],
  relatedExternal: any[]
): GraphData {
  const nodes: GraphNode[] = Array.isArray(parsed.nodes) ? parsed.nodes : []
  const edges: GraphEdge[] = Array.isArray(parsed.edges) ? parsed.edges : []
  const insights = parsed.insights || {
    rootCausePatterns: [],
    recurringEnvironments: [],
    externalReferences: [],
  }

  // Ensure main bug node exists
  const bugId = `bug-${bug.id}`
  if (!nodes.find((n) => n.id === bugId)) {
    nodes.unshift({
      id: bugId,
      type: "bug",
      label: (bug.title || "Untitled Bug").slice(0, 30),
      data: {
        title: bug.title,
        description: stripHtml(String(bug.description || "")).slice(0, 200),
        url: `/bugs/${bug.id}`,
      },
    })
  }

  return { nodes, edges, insights }
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

    // Fetch related bugs
    const allBugs = await getMultipleRecords("bugs")
    const relatedBugs = allBugs
      .filter((b: any) => {
        if (b.id === bugId) return false
        const visibility = String(b?.visibility || "public").toLowerCase().trim()
        return visibility !== "private"
      })
      .slice(0, 20)

    // For now, relatedExternal will be populated by Gemini analysis
    // In a full implementation, you'd fetch from GitHub/Jira/StackOverflow APIs here
    const relatedExternal: any[] = []

    const graphData = await analyzeWithGemini(bug, relatedBugs, relatedExternal)

    return successResponse(graphData)
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to generate graph")
  }
}
