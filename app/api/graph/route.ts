import { NextResponse } from "next/server"
import { checkAuth, ensureValidUUID, supabase } from "@/lib"
import { buildBugSubgraph } from "@/lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const bugId = searchParams.get("bugId")
        const userIdParam = searchParams.get("userId")

        if (userIdParam) {
            const authResult = await checkAuth()
            if (authResult instanceof NextResponse) return authResult

            const sessionUserId = ensureValidUUID(authResult.user.id)
            const requestedUserId = ensureValidUUID(userIdParam)
            if (sessionUserId !== requestedUserId) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }

            const { data: userBugs } = await supabase
                .from("bugs")
                .select("id, title, description, created_at, upvotes_count, downvotes_count")
                .eq("created_by", requestedUserId)
                .order("created_at", { ascending: false })
                .limit(120)

            if (!userBugs || userBugs.length === 0) {
                return NextResponse.json({ error: "No user bugs found" }, { status: 404 })
            }

            const bugIds = userBugs.map((b: any) => b.id).filter(Boolean)
            const { data: rels } = await supabase
                .from("bug_relationships")
                .select("id, source_id, target_id, relationship_type, confidence, created_at")
                .in("source_id", bugIds)
                .in("target_id", bugIds)
                .order("confidence", { ascending: false })
                .limit(300)

            const nodeMap = new Map<string, any>()
            for (const b of userBugs) {
                nodeMap.set(String(b.id), {
                    id: String(b.id),
                    type: "bug",
                    label: String(b.title || "Untitled").slice(0, 60),
                    data: {
                        title: b.title,
                        description: b.description,
                        type: "bug",
                        url: `/dashboard/bugs/${b.id}`,
                        upvotes: b.upvotes_count ?? 0,
                        downvotes: b.downvotes_count ?? 0,
                        created_at: b.created_at ?? undefined,
                    },
                })
            }

            const edges = (rels || []).map((rel: any, idx: number) => {
                const type = normalizeEdgeType(String(rel.relationship_type || "related_to"))
                const confidence = Number(rel.confidence) || 0.5
                return {
                    id: `user-rel-${rel.id || idx}`,
                    source: String(rel.source_id),
                    target: String(rel.target_id),
                    type,
                    weight: confidence,
                    label: `${type.replace(/_/g, " ")} (${Math.round(confidence * 100)}%)`,
                    data: { type, confidence, created_at: rel.created_at ?? undefined },
                }
            })

            if (edges.length === 0 && userBugs.length > 1) {
                const maxPairs = 80
                let added = 0
                for (let i = 0; i < userBugs.length; i++) {
                    for (let j = i + 1; j < userBugs.length; j++) {
                        if (added >= maxPairs) break
                        const a = userBugs[i]
                        const b = userBugs[j]
                        const score = simpleSimilarityScore(a, b)
                        if (score < 0.25) continue
                        edges.push({
                            id: `fallback-sim-${a.id}-${b.id}`,
                            source: String(a.id),
                            target: String(b.id),
                            type: "SIMILAR",
                            weight: score,
                            label: `Similar (${Math.round(score * 100)}%)`,
                            data: {
                                type: "SIMILAR",
                                confidence: score,
                                created_at: new Date().toISOString(),
                            },
                        })
                        added++
                    }
                    if (added >= maxPairs) break
                }
            }

            const nodes = Array.from(nodeMap.values())
            const radius = Math.max(220, 220 + nodes.length * 4)
            nodes.forEach((n, i) => {
                const angle = (i / Math.max(1, nodes.length)) * 2 * Math.PI
                n.position = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
            })

            const center = nodes[0]?.id ?? String(userBugs[0].id)
            const insights = {
                rootCausePatterns: [
                    "Showing connectivity across your bugs only",
                    `${nodes.length} bug node${nodes.length === 1 ? "" : "s"} in scope`,
                ],
                recurringEnvironments: [],
                aiMetrics: { precision: 1.0 },
            }

            return NextResponse.json({ center, nodes, edges, insights })
        }

        let mainBug: any = null
        if (bugId) {
            const { data } = await supabase.from("bugs").select("*").eq("id", bugId).single()
            mainBug = data
        } else {
            const { data } = await supabase.from("bugs").select("*").order("created_at", { ascending: false }).limit(1).single()
            mainBug = data
        }

        if (!mainBug) {
            return NextResponse.json({ error: "No bug found" }, { status: 404 })
        }

        const { center, nodes, edges } = await buildBugSubgraph(mainBug)

        const insights = {
            rootCausePatterns: ["Generated from real relationships"],
            recurringEnvironments: [],
            aiMetrics: { precision: 1.0 }
        }

        return NextResponse.json({ center, nodes, edges, insights })
    } catch (error) {
        console.error("Graph API Error:", error)
        return NextResponse.json({ error: "Failed to fetch graph data" }, { status: 500 })
    }
}

function normalizeEdgeType(input: string): string {
    const raw = (input || "").toUpperCase().replace(/-/g, "_")
    if (raw.includes("SIMILAR")) return "SIMILAR"
    if (raw.includes("DUPLICATE")) return "DUPLICATE"
    if (raw.includes("CAUSE")) return "CAUSE_OF"
    if (raw.includes("EVIDENCE") || raw.includes("VERIFIED")) return "EVIDENCE_FOR"
    if (raw.includes("SOLUTION") || raw.includes("FIX")) return "SOLUTION_FOR"
    return "RELATE"
}

function simpleSimilarityScore(a: any, b: any): number {
    const titleA = String(a?.title || "").toLowerCase()
    const titleB = String(b?.title || "").toLowerCase()
    const descA = String(a?.description || "").toLowerCase()
    const descB = String(b?.description || "").toLowerCase()
    const tagsA = new Set(Array.isArray(a?.tags) ? a.tags.map((t: any) => String(t).toLowerCase()) : [])
    const tagsB = new Set(Array.isArray(b?.tags) ? b.tags.map((t: any) => String(t).toLowerCase()) : [])

    const wordsA = new Set(titleA.split(/\W+/).filter((w) => w.length > 2))
    const wordsB = new Set(titleB.split(/\W+/).filter((w) => w.length > 2))
    const overlapTitle = [...wordsA].filter((w) => wordsB.has(w)).length
    const unionTitle = new Set([...wordsA, ...wordsB]).size || 1
    const titleScore = overlapTitle / unionTitle

    const overlapTags = [...tagsA].filter((t) => tagsB.has(t)).length
    const unionTags = new Set([...tagsA, ...tagsB]).size || 1
    const tagScore = unionTags > 0 ? overlapTags / unionTags : 0

    const keywordScore =
        ["crash", "error", "login", "freeze", "submit", "button", "render", "timeout"]
            .filter((k) => (titleA + " " + descA).includes(k) && (titleB + " " + descB).includes(k))
            .length / 8

    return Math.min(1, titleScore * 0.5 + tagScore * 0.3 + keywordScore * 0.2)
}
