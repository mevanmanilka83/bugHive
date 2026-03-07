import { supabase } from "../config"
import { findRelatedItems } from "./findRelated"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type SubgraphOptions = {
  /** Max total nodes (center + related). Default 25. */
  limit?: number
  /** Min relevance (0–1) for similar internal bugs. Default 0.35. */
  similarityThreshold?: number
  /** Max internal similar bugs to add. Default 8. */
  internalLimit?: number
  /** Max external refs (GitHub/Stack Overflow). Default 6. */
  externalLimit?: number
  /** Min confidence (0–1) for stored relationships. Default 0.5. */
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

/**
 * Build a focused subgraph for one bug: center node + direct relationships from DB
 * + top-ranked similar/internal bugs and external refs above thresholds.
 * Returns graph-shaped { center, nodes, edges }; no global dump.
 */
export async function buildBugSubgraph(
  mainBug: { id: string; title?: string; description?: string; upvotes_count?: number; downvotes_count?: number },
  options: SubgraphOptions = {}
): Promise<BugSubgraphResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const nodes: BugSubgraphResult["nodes"] = []
  const edges: BugSubgraphResult["edges"] = []
  const centerId = mainBug.id

  // 1. Primary node (center)
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
    },
    position: { x: 0, y: 0 },
  })

  const connectedIds = new Set<string>([centerId])

  // 2. Stored relationships (direct: CAUSE_OF, EVIDENCE_FOR, SOLUTION_FOR, SIMILAR, DUPLICATE)
  const { data: rels } = await supabase
    .from("bug_relationships")
    .select("id, source_id, target_id, relationship_type, confidence, origin")
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
        if (!nodes.some((n) => n.id === nodeId)) {
          nodes.push({
            id: nodeId,
            type: "bug",
            label: (otherBug.title || "Bug").slice(0, 40),
            data: {
              title: otherBug.title,
              description: otherBug.description?.slice(0, 100),
              type: "bug",
              url: `/bugs/${otherBug.id}`,
              upvotes: otherBug.upvotes_count ?? 0,
            },
          })
        }
        const edgeType = normalizeRelationshipType(rel.relationship_type)
        edges.push({
          id: `rel-${rel.id}`,
          source: isSourceCenter ? centerId : nodeId,
          target: isSourceCenter ? nodeId : centerId,
          type: edgeType,
          weight: Number(rel.confidence) || 0.8,
          label: `${edgeType.replace(/_/g, " ")} (${Math.round(Number(rel.confidence) * 100)}%)`,
          data: { confidence: rel.confidence, origin: rel.origin },
        })
      }
    }
  }

  // 3. Top-ranked similar bugs (above threshold)
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
      data: { similarity: score },
      style: { strokeDasharray: "5,5" },
    })
  }

  // 4. External refs (GitHub, Stack Overflow) — only top N
  let externalAdded = 0
  for (const ext of external) {
    if (nodes.length >= opts.limit || externalAdded >= opts.externalLimit) break
    if (connectedIds.has(ext.id)) continue
    connectedIds.add(ext.id)
    externalAdded++
    let nType = "github_issue"
    let eType = "EVIDENCE_FOR"
    if (ext.source === "stack_overflow_question") {
      nType = "stack_overflow"
      eType = "SOLUTION_FOR"
    }
    nodes.push({
      id: ext.id,
      type: nType,
      label: (ext.title || "External").slice(0, 40),
      data: {
        title: ext.title,
        description: ext.snippet,
        type: nType,
        url: ext.url,
      },
    })
    edges.push({
      id: `ext-${centerId}-${ext.id}`,
      source: centerId,
      target: ext.id,
      type: eType,
      weight: 0.6,
      label: "Reference",
      style: { strokeDasharray: "2,2" },
    })
  }

  // Layout: circular around center
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
