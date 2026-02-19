
import { NextResponse } from "next/server"
import { supabase } from "@/lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const [clustersRes, bugsRes] = await Promise.all([
            supabase.from("clusters").select("id, name, description").limit(8),
            supabase.from("bugs").select("id, title, description, created_at, tags").order("created_at", { ascending: false }).limit(25),
        ])

        const clusters = clustersRes.data || []
        const bugs = bugsRes.data || []

        const nodes: any[] = []
        const edges: any[] = []

        // Layout styling constants
        const CLUSTER_RADIUS = 500
        const BUG_RADIUS = 900
        const CENTER_X = 0
        const CENTER_Y = 0

        // 1. Cluster nodes - Inner Ring
        clusters.forEach((cluster, idx) => {
            const angle = (idx / (clusters.length || 1)) * 2 * Math.PI
            nodes.push({
                id: `cluster-${cluster.id}`,
                type: "cluster",
                label: cluster.name,
                data: {
                    title: cluster.name,
                    description: cluster.description,
                    type: "cluster"
                },
                position: {
                    x: CENTER_X + Math.cos(angle) * CLUSTER_RADIUS,
                    y: CENTER_Y + Math.sin(angle) * CLUSTER_RADIUS
                }
            })
        })

        // 2. Bug nodes - Middle Ring
        bugs.forEach((bug, idx) => {
            const bugId = `bug-${bug.id}`
            // Distribute evenly
            const angle = (idx / (bugs.length || 1)) * 2 * Math.PI
            // Cloud effect
            const radiusVariation = (idx % 2 === 0 ? 0 : 150)
            const r = BUG_RADIUS + radiusVariation

            const bugX = CENTER_X + Math.cos(angle) * r
            const bugY = CENTER_Y + Math.sin(angle) * r

            nodes.push({
                id: bugId,
                type: "bug",
                label: (bug.title || "Untitled").slice(0, 30),
                data: {
                    title: bug.title,
                    description: bug.description,
                    url: `/bugs/${bug.id}`,
                    type: "bug"
                },
                position: {
                    x: bugX,
                    y: bugY
                }
            })

            // Link to clusters (Mock semantic clustering)
            if (clusters.length > 0) {
                const clusterIndex = (bug.title.length + idx) % clusters.length
                const cluster = clusters[clusterIndex]
                edges.push({
                    id: `e-${bug.id}-${cluster.id}`,
                    source: bugId,
                    target: `cluster-${cluster.id}`,
                    type: "belongs_to",
                    label: "in cluster"
                })
            }

            // 3. AI-Extracted Entities (Mocked Logic)
            // In a real implementation, this would come from the 'embeddings' and 'relationship_metadata' columns
            // populated by Gemini/OpenAI processing.

            // CAUSE Node (30% chance)
            if ((idx + bug.title.length) % 3 === 0) {
                const causeId = `cause-${bug.id}`
                nodes.push({
                    id: causeId,
                    type: "cause",
                    label: "Root Cause",
                    data: {
                        title: `Root Cause: ${bug.title.substring(0, 20)}...`,
                        description: "AI analysis detected a potential root cause in the module logic.",
                        type: "cause"
                    },
                    position: {
                        x: bugX + 150,
                        y: bugY + 50
                    }
                })
                edges.push({
                    id: `e-cause-${bug.id}`,
                    source: causeId,
                    target: bugId,
                    type: "caused_by",
                    label: "caused by"
                })
            }

            // EVIDENCE Node (30% chance)
            if ((idx + bug.title.length) % 3 === 1) {
                const evidenceId = `evidence-${bug.id}`
                nodes.push({
                    id: evidenceId,
                    type: "evidence",
                    label: "Evidence",
                    data: {
                        title: `Log Trace: ${bug.id.substring(0, 8)}`,
                        description: "Stack trace and logs correlated with this issue patterns.",
                        type: "evidence"
                    },
                    position: {
                        x: bugX - 150,
                        y: bugY + 50
                    }
                })
                edges.push({
                    id: `e-evidence-${bug.id}`,
                    source: bugId,
                    target: evidenceId,
                    type: "evidenced_by",
                    label: "has evidence"
                })
            }

            // SOLUTION Node (20% chance)
            if ((idx + bug.title.length) % 5 === 0) {
                const solutionId = `solution-${bug.id}`
                nodes.push({
                    id: solutionId,
                    type: "solution",
                    label: "Fix",
                    data: {
                        title: `Fix for: ${bug.title.substring(0, 15)}...`,
                        description: "Recommended code change based on similar customized patches.",
                        type: "solution"
                    },
                    position: {
                        x: bugX,
                        y: bugY + 180
                    }
                })
                edges.push({
                    id: `e-solution-${bug.id}`,
                    source: solutionId,
                    target: bugId,
                    type: "solved_by",
                    label: "solves"
                })
            }
        })

        // 4. Semantic Relationships (Mocked)
        // Connect random bugs to simulate "related" or "duplicate" edges
        for (let i = 0; i < bugs.length; i++) {
            if (i > 0 && i % 4 === 0) {
                const source = bugs[i]
                const target = bugs[i - 1] // Connect to previous
                edges.push({
                    id: `e-related-${source.id}-${target.id}`,
                    source: `bug-${source.id}`,
                    target: `bug-${target.id}`,
                    type: "related",
                    label: "semantically related (0.89)"
                })
            }
        }

        const insights = {
            rootCausePatterns: ["Authentication timeout", "Database connection pool exhausted", "Race condition in rendering"],
            recurringEnvironments: [
                { environment: "Production-US-East", count: 12 },
                { environment: "Staging", count: 5 },
                { environment: "Dev", count: 2 }
            ],
            aiMetrics: {
                precision: 0.92,
                recall: 0.88,
                f1Score: 0.90,
                processingTime: "1.2s"
            }
        }

        return NextResponse.json({ nodes, edges, insights })
    } catch (error) {
        console.error("Graph API Error:", error)
        return NextResponse.json({ error: "Failed to fetch graph data" }, { status: 500 })
    }
}
