import { NextRequest } from "next/server"
import { extractRouteId, getSingleRecord, successResponse, errorResponse, supabase } from "@/lib"
import { stripHtml } from "@/lib/utils-client"
import { findRelatedItems } from "@/lib/related"
import { BugSignature } from "@/lib/bug-relationships"

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
  | "cause"
  | "evidence"
  | "solution"

type RelationshipType =
  | "duplicate_of"
  | "tagged_with"
  | "occurs_on"
  | "affects"
  | "similar_to"
  | "fix_reference"
  | "belongs_to"
  | "related_to"
  | "cause_of"
  | "solution_for"
  | "verified_by"
  | "contradicts"
  | "supports"
  | "disputes"
  | "conflicts"
  | "complements"
  | "support"
  | "condractary"
  | "complement"
  | "condractary-dispute"
  | "conflict"
  | "complementary -support"
  | "relate"

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
  data?: any
  style?: any
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

async function analyzeWithGemini(bug: any, relatedInternal: any[], relatedExternal: any[], clusters: any[]): Promise<GraphData> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return generateFallbackGraph(bug, relatedInternal, relatedExternal)
  }

  const bugText = [
    `Title: ${bug.title || ""}`,
    `Description: ${bug.description || ""}`,
    `Environment: ${bug.environment || ""}`,
    `Tags: ${Array.isArray(bug.tags) ? bug.tags.join(", ") : ""}`,
    `Error: ${bug.actual_behavior || ""}`,
    `Votes: Upvotes (${bug.upvotes_count || 0}), Downvotes (${bug.downvotes_count || 0})`,
  ].join("\n")

  const relatedText = relatedInternal
    .slice(0, 8)
    .map((b, i) => `Internal Bug ${i + 1}: ${b.title} (Matches: ${b.relevanceScore?.toFixed(2)}) | Upvotes: ${b.upvotes_count || 0}, Downvotes: ${b.downvotes_count || 0} - ${b.relevanceReasons?.join(", ")}`)
    .join("\n")

  const externalText = relatedExternal
    .slice(0, 8)
    .map((e) => `${e.source}: ${e.title} - ${e.snippet}`)
    .join("\n")

  const clustersText = clusters
    .slice(0, 5)
    .map((c: any) => `Public Cluster (ID: ${c.id}): ${c.name} - ${c.description || "No description"}`)
    .join("\n")

  const prompt = `Analyze this bug report and its related ecosystem to generate a strictly focused "Ego-Graph".
  
GOAL: Construct a subgraph centered EXCLUSIVELY on the Main Bug.
- FILTER: The graph must NOT be a global dump. Only include nodes with a direct, justified, and strong relationship to the Main Bug.
- CENTRAL NODE: The Main Bug (${bug.id}) is the primary anchor.
- RELATIONSHIPS: Every edge must be backed by a clear justification metric.
    - "support" -> Must be a supporting reference/metric.
    - "condractary" -> Must demonstrate a high Contradiction score (or if downvote ratio is significant).
    - "complement" -> Must be a complementary reference/metric (or high upvote matched logic).
    - "condractary-dispute" -> For competing discussions or disputes.
    - "conflict" -> For conflicting methods.
    - "complementary -support" -> For complementary supporting rationale.
    - "relate" -> General metric for relation or reference.
    - "belongs_to" -> For grouping into Public Clusters.
- METRICS: The "label" of each edge MUST explicitly state the relationship rationale (e.g., "95% Stack Trace Overlap", "Fixes Memory Leak", "Contradicts Root Cause"). Be sure to weigh upvotes and downvotes into scoring and mapping.

Bug Report:
${bugText}

Related Internal Bugs (Context for Similarity & Votes):
${relatedText}

Available Public Clusters (Context for Grouping):
${clustersText}

External References (Context for Evidence/Solutions):
${externalText}

Return JSON with this structure:
{
  "nodes": [
    {"id": "bug-${bug.id}", "type": "bug", "label": "Focus Bug", "data": {"isFocus": true}},
    {"id": "cause-1", "type": "cause", "label": "Null Check Missing", "data": {"confidence": 0.9, "description": "Logic error in map function."}},
    {"id": "sol-1", "type": "solution", "label": "Guard Clause", "data": {"impact": "High"}},
    {"id": "similar-1", "type": "bug", "label": "Bug #402", "data": {"url": "..."}}
  ],
  "edges": [
    {"id": "e1", "source": "cause-1", "target": "bug-${bug.id}", "type": "cause_of", "weight": 0.95, "label": "Direct Root Cause"},
    {"id": "e2", "source": "sol-1", "target": "bug-${bug.id}", "type": "support", "weight": 0.85, "label": "Verifies Fix"},
    {"id": "e3", "source": "bug-${bug.id}", "target": "similar-1", "type": "relate", "weight": 0.75, "label": "High Text Overlap"},
    {"id": "e4", "source": "bug-${bug.id}", "target": "sol-1", "type": "condractary", "weight": 0.80, "label": "Contradicts Method"}
  ],
  "insights": {
    "rootCausePatterns": ["Pattern 1"],
    "recurringEnvironments": [{"environment": "Prod", "count": 2}],
    "externalReferences": []
  }
}

Use these node types: bug, cause, solution, evidence, github_issue, stack_overflow, cluster.
Use these edge types: cause_of, solution_for, verified_by, similar_to, support, condractary, complement, condractary-dispute, conflict, complementary -support, relate, belongs_to.
Ensure the Main Bug (${bug.id}) is the central node.`

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4000,
            responseMimeType: "application/json",
          },
        }),
      }
    )

    if (!response.ok) return generateFallbackGraph(bug, relatedInternal, relatedExternal)

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return generateFallbackGraph(bug, relatedInternal, relatedExternal)

    const parsed = JSON.parse(text)
    return validateAndEnrichGraph(parsed, bug, relatedInternal, relatedExternal)
  } catch {
    return generateFallbackGraph(bug, relatedInternal, relatedExternal)
  }
}

function generateFallbackGraph(bug: any, relatedInternal: any[], relatedExternal: any[]): GraphData {
  // If AI fails, we build a deterministic graph from the high-quality related items we found
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  const bugId = `bug-${bug.id}`
  nodes.push({
    id: bugId,
    type: "bug",
    label: (bug.title || "Untitled").slice(0, 30),
    data: { ...bug, isFocus: true },
    position: { x: 0, y: 0 }
  })

  // Add highly relevant internal bugs
  relatedInternal.slice(0, 5).forEach((item, i) => {
    const nodeId = item.id
    const angle = (2 * Math.PI * i) / 5
    const radius = 300
    nodes.push({
      id: nodeId,
      type: "bug",
      label: item.title.slice(0, 20),
      data: item,
      position: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
    })
    edges.push({
      id: `e-${bugId}-${nodeId}`,
      source: bugId,
      target: nodeId,
      type: "similar_to",
      weight: item.relevanceScore || 0.5,
      label: item.relevanceScore ? `Match ${(item.relevanceScore * 100).toFixed(0)}%` : "Similar"
    })
  })

  // Add external refs
  relatedExternal.slice(0, 5).forEach((item, i) => {
    const nodeId = item.id
    const angle = (2 * Math.PI * i) / 5 + Math.PI / 5 // offset
    const radius = 450
    const type = item.source === "stack_overflow_question" ? "stack_overflow" : "github_issue"
    nodes.push({
      id: nodeId,
      type: type as any,
      label: item.title.slice(0, 20),
      data: item,
      position: { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
    })
    edges.push({
      id: `e-${bugId}-${nodeId}`,
      source: bugId,
      target: nodeId,
      type: "related_to",
      weight: 0.5,
      label: "Reference"
    })
  })

  return {
    nodes,
    edges,
    insights: {
      rootCausePatterns: [],
      recurringEnvironments: [],
      externalReferences: relatedExternal.map(e => ({ type: e.source, title: e.title, url: e.url }))
    }
  }
}

function validateAndEnrichGraph(parsed: any, bug: any, internal: any[], external: any[]): GraphData {
  const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : []
  const edges = Array.isArray(parsed.edges) ? parsed.edges : []
  const insights = parsed.insights || { rootCausePatterns: [], recurringEnvironments: [], externalReferences: [] }

  // Ensure focus node exists
  const focusId = `bug-${bug.id}`
  if (!nodes.find((n: any) => n.id === focusId)) {
    nodes.unshift({
      id: focusId,
      type: "bug",
      label: "Focus Bug",
      data: { title: bug.title, isFocus: true }
    })
  }

  // Calculate better positions (Basic Star Layout)
  const center = { x: 0, y: 0 }
  const others = nodes.filter((n: any) => n.id !== focusId)
  others.forEach((n: any, i: number) => {
    const angle = (2 * Math.PI * i) / others.length
    const r = n.type === 'solution' || n.type === 'cause' ? 200 : 400
    n.position = { x: Math.cos(angle) * r, y: Math.sin(angle) * r }
  })
  const focusNode = nodes.find((n: any) => n.id === focusId)
  if (focusNode) focusNode.position = center

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

    // Smart Fetching using Shared Logic
    const { internal, external } = await findRelatedItems(bug)

    // Fetch Public Clusters that could be suitable for grouping/matching
    const { data: publicClusters } = await supabase
      .from('clusters')
      .select('id, name, description, visibility')
      .eq('visibility', 'public')
      .limit(10)

    const graphData = await analyzeWithGemini(bug, internal, external, publicClusters || [])

    return successResponse(graphData)
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to generate graph")
  }
}
