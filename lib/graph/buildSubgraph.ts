import { supabase } from "../config"
import { findRelatedItems } from "./findRelated"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type SubgraphOptions = {
  limit?: number
  similarityThreshold?: number
  internalLimit?: number
  externalLimit?: number
  relationshipConfidenceMin?: number
}

export type BugSubgraphResult = {
  center: string
  nodes: Array<{
    id: string
    type: string
    label: string
    data: Record<string, unknown>
    position?: { x: number; y: number }
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    type: string
    weight: number
    label?: string
    data?: Record<string, unknown>
    style?: Record<string, unknown>
  }>
}

const DEFAULT_OPTIONS: Required<SubgraphOptions> = {
  limit: 25,
  similarityThreshold: 0.35,
  internalLimit: 8,
  externalLimit: 6,
  relationshipConfidenceMin: 0.5,
}

export async function buildBugSubgraph(
  mainBug: { id: string; title?: string; description?: string; upvotes_count?: number; downvotes_count?: number },
  options: SubgraphOptions = {}
): Promise<BugSubgraphResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const nodes: BugSubgraphResult["nodes"] = []
  const edges: BugSubgraphResult["edges"] = []
  const centerId = mainBug.id

  const mainBugCreatedAt = (mainBug as { created_at?: string }).created_at ?? null

  nodes.push({
    id: centerId,
    type: "bug",
    label: (mainBug.title || "Untitled").slice(0, 60),
    data: {
      title: mainBug.title,
      description: mainBug.description,
      type: "bug",
      source: "BugHive",
      url: `/bugs/${mainBug.id}`,
      isFocus: true,
      upvotes: mainBug.upvotes_count ?? 0,
      downvotes: mainBug.downvotes_count ?? 0,
      created_at: mainBugCreatedAt,
    },
    position: { x: 0, y: 0 },
  })

  const connectedIds = new Set<string>([centerId])

  const { data: rels } = await supabase
    .from("bug_relationships")
    .select("id, source_id, target_id, relationship_type, confidence, origin, created_at")
    .or(`source_id.eq.${mainBug.id},target_id.eq.${mainBug.id}`)
    .gte("confidence", opts.relationshipConfidenceMin)
    .order("confidence", { ascending: false })
    .limit(20)

  if (rels?.length) {
    for (const rel of rels) {
      if (nodes.length >= opts.limit) break
      const isSourceCenter = rel.source_id === mainBug.id
      const otherId = String(isSourceCenter ? rel.target_id : rel.source_id)
      if (connectedIds.has(otherId)) continue

      const isUuid = UUID_REGEX.test(otherId)
      if (isUuid) {
        const { data: otherBug } = await supabase.from("bugs").select("id, title, description, upvotes_count").eq("id", otherId).single()
        if (!otherBug) continue
        connectedIds.add(otherId)
        const nodeId = otherId
        const relCreatedAt = (rel as { created_at?: string }).created_at ?? null
        const edgeType = normalizeRelationshipType(rel.relationship_type)
        const nodeType = semanticNodeType(edgeType)
        if (!nodes.some((n) => n.id === nodeId)) {
          nodes.push({
            id: nodeId,
            type: nodeType,
            label: (otherBug.title || "Bug").slice(0, 40),
            data: {
              title: otherBug.title,
              description: otherBug.description?.slice(0, 100),
              type: nodeType,
              url: `/bugs/${otherBug.id}`,
              upvotes: otherBug.upvotes_count ?? 0,
              created_at: relCreatedAt,
            },
          })
        }
        edges.push({
          id: `rel-${rel.id}`,
          source: isSourceCenter ? centerId : nodeId,
          target: isSourceCenter ? nodeId : centerId,
          type: edgeType,
          weight: Number(rel.confidence) || 0.8,
          label: `${edgeType.replace(/_/g, " ")} (${Math.round(Number(rel.confidence) * 100)}%)`,
          data: { confidence: rel.confidence, origin: rel.origin, created_at: relCreatedAt },
        })
      }
    }
  }

  const { internal, external } = await findRelatedItems(mainBug)
  const similarInternal = internal.filter(
    (b: { id: string; relevanceScore?: number }) =>
      !connectedIds.has(b.id.replace(/^bug-/, "")) && (b.relevanceScore ?? 0) >= opts.similarityThreshold
  )

  let internalAdded = 0
  for (const bug of similarInternal) {
    if (nodes.length >= opts.limit || internalAdded >= opts.internalLimit) break
    const id = String(bug.id).replace(/^bug-/, "")
    if (connectedIds.has(id)) continue
    connectedIds.add(id)
    internalAdded++
    const bugCreatedAt = (bug as { created_at?: string }).created_at ?? new Date().toISOString()
    nodes.push({
      id: bug.id,
      type: "bug",
      label: (bug.title || "Similar").slice(0, 40),
      data: {
        title: bug.title,
        description: bug.snippet,
        type: "bug",
        url: bug.url || `/bugs/${id}`,
        relevanceScore: bug.relevanceScore,
        created_at: bugCreatedAt,
      },
    })
    const score = bug.relevanceScore ?? 0.5
    edges.push({
      id: `sim-${centerId}-${bug.id}`,
      source: centerId,
      target: bug.id,
      type: "SIMILAR",
      weight: score,
      label: `Similar (${Math.round(score * 100)}%)`,
      data: { similarity: score, created_at: bugCreatedAt },
      style: { strokeDasharray: "5,5" },
    })
  }

  let externalAdded = 0
  for (const ext of external) {
    if (nodes.length >= opts.limit || externalAdded >= opts.externalLimit) break
    if (connectedIds.has(ext.id)) continue
    connectedIds.add(ext.id)
    externalAdded++
    let nType = "github_issue"
    if (ext.source === "stack_overflow_question") {
      nType = "stack_overflow"
    }
    const extCreatedAt = (ext as { created_at?: string }).created_at ?? new Date().toISOString()
    const score = (ext as { relevanceScore?: number }).relevanceScore ?? 0.5
    nodes.push({
      id: ext.id,
      type: nType,
      label: (ext.title || "External").slice(0, 40),
      data: {
        title: ext.title,
        description: ext.snippet,
        type: nType,
        url: ext.url,
        created_at: extCreatedAt,
      },
    })
    edges.push({
      id: `ext-${centerId}-${ext.id}`,
      source: centerId,
      target: ext.id,
      type: "SIMILAR",
      weight: score,
      label: `Similar (${Math.round(score * 100)}%)`,
      data: { similarity: score, created_at: extCreatedAt },
      style: { strokeDasharray: "5,5" },
    })
  }

  const nonCenter = nodes.filter((n) => n.id !== centerId)
  const radius = 320
  nonCenter.forEach((n, i) => {
    const angle = (i / Math.max(1, nonCenter.length)) * 2 * Math.PI
    n.position = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
  })

  return { center: centerId, nodes, edges }
}

function normalizeRelationshipType(t: string): string {
  const upper = (t || "").toUpperCase().replace(/-/g, "_")
  const allowed = ["SIMILAR", "DUPLICATE", "CAUSE_OF", "EVIDENCE_FOR", "SOLUTION_FOR", "RELATE"]
  if (allowed.includes(upper)) return upper
  const map: Record<string, string> = {
    cause_of: "CAUSE_OF",
    solution_for: "SOLUTION_FOR",
    similar_to: "SIMILAR",
    duplicate_of: "DUPLICATE",
    verified_by: "EVIDENCE_FOR",
    related_to: "RELATE",
  }
  return map[upper.toLowerCase()] || "RELATE"
}

function semanticNodeType(edgeType: string): string {
  if (edgeType === "CAUSE_OF") return "cause"
  if (edgeType === "SOLUTION_FOR") return "solution"
  if (edgeType === "EVIDENCE_FOR") return "evidence"
  return "bug"
}
