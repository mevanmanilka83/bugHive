"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radioGroup"
import { Loader2, ExternalLink, Bug, Tag, Globe, Code, Github, MessageSquare, AlertCircle, Lightbulb, Search, ShieldAlert, GitBranch, ArrowUp, ArrowDown, X, Save, History } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
  NodeTypes,
  ReactFlowInstance,
  Panel,
  Position,
  Handle as FlowHandle,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { toast } from "sonner"
import { cn } from "@/lib"

interface BugGraphDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bugId: string
}

// --- Local Types to avoid import issues from API routes ---
type NodeType =
  | "bug"
  | "cluster"
  | "tag"
  | "environment"
  | "component"
  | "github_issue"
  | "stack_overflow"
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

interface GraphNode {
  id: string
  type: NodeType
  label: string
  data: {
    title?: string
    description?: string
    url?: string
    count?: number
    isFocus?: boolean
    [key: string]: any
  }
  position?: { x: number; y: number }
}

interface GraphEdge {
  id: string
  source: string
  target: string
  type: RelationshipType
  weight: number
  label?: string
  data?: any
  style?: React.CSSProperties
}

interface GraphData {
  center?: string
  nodes: GraphNode[]
  edges: GraphEdge[]
  insights?: {
    rootCausePatterns: string[]
    recurringEnvironments: Array<{ environment: string; count: number }>
    externalReferences: Array<{ type: string; title: string; url: string }>
  }
}

type RelatedBugSource =
  | "github_issue"
  | "github_repo"
  | "bughive_public"
  | "bughive_cluster"
  | "stack_overflow_question"

type RelatedBugItem = {
  id: string
  title: string
  url: string
  source: RelatedBugSource
  snippet: string
  relevanceScore?: number
}

const GRAPH_DEPTH = 2
const GRAPH_LIMIT = 25

// --- Visual Configuration ---

const nodeTypeColors: Record<string, string> = {
  bug: "bg-blue-500 border-blue-600",
  cluster: "bg-purple-500 border-purple-600",
  tag: "bg-green-500 border-green-600",
  environment: "bg-slate-400 border-slate-500",
  component: "bg-pink-500 border-pink-600",
  github_issue: "bg-gray-700 border-gray-800",
  stack_overflow: "bg-amber-700 border-amber-800",
  cause: "bg-indigo-500 border-indigo-600",
  solution: "bg-emerald-500 border-emerald-600",
  evidence: "bg-cyan-500 border-cyan-600",
}

const nodeTypeIcons: Record<string, React.ReactNode> = {
  bug: <Bug className="h-4 w-4" />,
  cluster: <AlertCircle className="h-4 w-4" />,
  tag: <Tag className="h-4 w-4" />,
  environment: <Globe className="h-4 w-4" />,
  component: <Code className="h-4 w-4" />,
  github_issue: <Github className="h-4 w-4" />,
  stack_overflow: <MessageSquare className="h-4 w-4" />,
  cause: <Search className="h-4 w-4" />,
  solution: <Lightbulb className="h-4 w-4" />,
  evidence: <ShieldAlert className="h-4 w-4" />,
}

const edgeTypeStyles: Record<string, { stroke: string; strokeDasharray?: string }> = {
  // Normalized API types (from subgraph builder)
  SIMILAR: { stroke: "#94a3b8", strokeDasharray: "5,5" },
  DUPLICATE: { stroke: "#64748b", strokeDasharray: "5,5" },
  CAUSE_OF: { stroke: "#475569" },
  EVIDENCE_FOR: { stroke: "#0ea5e9" },
  SOLUTION_FOR: { stroke: "#10b981" },
  RELATE: { stroke: "#cbd5e1" },
  // Legacy / display names
  similar_to: { stroke: "#94a3b8", strokeDasharray: "5,5" },
  duplicate_of: { stroke: "#64748b", strokeDasharray: "5,5" },
  solution_for: { stroke: "#10b981" },
  verified_by: { stroke: "#0ea5e9" },
  cause_of: { stroke: "#475569" },
  contradicts: { stroke: "#ef4444", strokeDasharray: "4,2" }, // Red 500
  disputes: { stroke: "#ef4444", strokeDasharray: "4,2" }, // Red 500
  conflicts: { stroke: "#ef4444", strokeDasharray: "4,2" }, // Red 500
  related_to: { stroke: "#cbd5e1" }, // Slate 300
  supports: { stroke: "#8b5cf6" }, // Violet 500
  complements: { stroke: "#8b5cf6" }, // Violet 500
  support: { stroke: "#8b5cf6" }, // Violet 500
  condractary: { stroke: "#ef4444", strokeDasharray: "4,2" }, // Red 500
  complement: { stroke: "#8b5cf6" }, // Violet 500
  "condractary-dispute": { stroke: "#ef4444", strokeDasharray: "4,2" }, // Red 500
  conflict: { stroke: "#ef4444", strokeDasharray: "4,2" }, // Red 500
  "complementary -support": { stroke: "#8b5cf6" }, // Violet 500
  relate: { stroke: "#cbd5e1" }, // Slate 300
  belongs_to: { stroke: "#a855f7", strokeDasharray: "3,3" }, // Purple 500
  fix_reference: { stroke: "#10b981", strokeDasharray: "2,2" },
}

function CustomNode({ data, selected }: { data: any; selected: boolean }) {
  const nodeType = data.type || "bug"
  const isFocus = data.isFocus
  const colorClass = isFocus ? "bg-indigo-600 border-indigo-700" : (nodeTypeColors[nodeType] || "bg-slate-500 border-slate-600")
  const icon = nodeTypeIcons[nodeType] || <Bug className="h-4 w-4" />

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/30 dark:border-white/10 shadow-xl shadow-black/5 min-w-[160px] max-w-[240px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl relative transition-all duration-200",
        selected ? "ring-2 ring-primary border-primary shadow-md" : "border-border",
        isFocus ? "ring-4 ring-primary/20 scale-105 shadow-xl" : ""
      )}
    >
      <FlowHandle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-muted-foreground/30 !border-[1.5px] !border-background !top-[-5px]" />
      <div className={cn("text-white p-2 rounded-t-xl flex items-center gap-2", colorClass)}>
        <div className="bg-white/20 p-1  backdrop-blur-sm">{icon}</div>
        <span className="text-xs font-bold uppercase tracking-wider text-white/90">
          {nodeType.replace(/_/g, " ")}
        </span>
      </div>

      <div className="p-3">
        <div className="text-sm font-semibold text-foreground line-clamp-2 leading-tight mb-2">
          {data.label || "Untitled"}
        </div>

        {data.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {data.description}
          </p>
        )}

        {/* Metrics Badges */}
        <div className="flex flex-wrap gap-1 mt-2">
          {data.confidence && (
            <Badge variant="outline" className="text-[10px] h-5 px-1">
              {Math.round(data.confidence * 100)}% Conf
            </Badge>
          )}
          {data.impact && (
            <Badge variant="outline" className="text-[10px] h-5 px-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400">
              {data.impact} Impact
            </Badge>
          )}
          {data.upvotes !== undefined && data.upvotes > 0 && (
            <Badge variant="outline" className="text-[10px] h-5 px-1 flex items-center gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400">
              <ArrowUp className="w-2.5 h-2.5" />
              {data.upvotes}
            </Badge>
          )}
          {data.downvotes !== undefined && data.downvotes > 0 && (
            <Badge variant="outline" className="text-[10px] h-5 px-1 flex items-center gap-1 border-red-200 bg-red-50 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
              <ArrowDown className="w-2.5 h-2.5" />
              {data.downvotes}
            </Badge>
          )}
        </div>
      </div>
      <FlowHandle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-muted-foreground/30 !border-[1.5px] !border-background !bottom-[-5px]" />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  default: CustomNode,
  bug: CustomNode,
  cause: CustomNode,
  solution: CustomNode,
  evidence: CustomNode,
  github_issue: CustomNode,
  stack_overflow: CustomNode,
  cluster: CustomNode,
}

function CustomBadgeEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeType = data?.type as string || '';
  const isDestructive = ["contradicts", "condractary", "condractary-dispute", "conflict", "disputes", "conflicts"].includes(edgeType);
  const isPositive = ["solution_for", "verified_by", "supports", "complements", "support", "complement", "complementary -support", "fix_reference", "belongs_to"].includes(edgeType);

  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "secondary";
  let extraClasses = "text-[9px] px-1.5 py-0 h-4 min-h-0 bg-background shadow-sm border font-semibold";

  if (isDestructive) {
    badgeVariant = "destructive";
    extraClasses = "text-[9px] px-1.5 py-0 h-4 min-h-0 shadow-sm";
  } else if (isPositive) {
    badgeVariant = "default";
    extraClasses = "text-[9px] px-1.5 py-0 h-4 min-h-0 shadow-sm bg-emerald-500 hover:bg-emerald-600";
    if (["supports", "complements", "support", "complement", "complementary -support", "belongs_to"].includes(edgeType)) {
      extraClasses = "text-[9px] px-1.5 py-0 h-4 min-h-0 shadow-sm bg-violet-500 hover:bg-violet-600";
    }
  }

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} id={id} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan z-50"
        >
          {label ? (
            <Badge variant={badgeVariant} className={extraClasses}>
              {label}
            </Badge>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const edgeTypes = {
  custom: CustomBadgeEdge,
}

const graphCache = new Map<string, GraphData>()

function mergeStackOverflowIntoGraph(graph: GraphData, relatedItems: RelatedBugItem[], fallbackCenterId: string): GraphData {
  if (!Array.isArray(relatedItems) || relatedItems.length === 0) return graph

  const stackItems = relatedItems.filter((item) => item.source === "stack_overflow_question")
  if (stackItems.length === 0) return graph

  const centerId = graph.center || fallbackCenterId
  const existingNodeIds = new Set(graph.nodes.map((n) => n.id))
  const existingEdgeIds = new Set(graph.edges.map((e) => e.id))

  const mergedNodes = [...graph.nodes]
  const mergedEdges = [...graph.edges]

  const centerNode = graph.nodes.find((n) => n.id === centerId)
  const centerX = centerNode?.position?.x ?? 0
  const centerY = centerNode?.position?.y ?? 0

  // Place Stack Overflow nodes in a vertical column to the right of the main circle (radius 320)
  // so they don't overlap circle nodes and have clear, consistent spacing
  const mainCircleRadius = 320
  const soColumnOffsetX = 220
  const soRowSpacing = 220
  const nowIso = new Date().toISOString()
  const soCount = stackItems.filter((item) => !existingNodeIds.has(item.id)).length
  let soIndex = 0

  stackItems.forEach((item) => {
    if (!existingNodeIds.has(item.id)) {
      const offsetY = soCount <= 1 ? 0 : (soIndex - (soCount - 1) / 2) * soRowSpacing
      soIndex++
      mergedNodes.push({
        id: item.id,
        type: "stack_overflow",
        label: item.title,
        data: {
          title: item.title,
          description: item.snippet,
          type: "stack_overflow",
          url: item.url,
          created_at: nowIso,
        },
        position: {
          x: centerX + mainCircleRadius + soColumnOffsetX,
          y: centerY + offsetY,
        },
      })
      existingNodeIds.add(item.id)
    }

    const edgeId = `so-${centerId}-${item.id}`
    if (!existingEdgeIds.has(edgeId)) {
      const score = item.relevanceScore ?? 0.5
      mergedEdges.push({
        id: edgeId,
        source: centerId,
        target: item.id,
        type: "SIMILAR",
        weight: score,
        label: `Similar (${Math.round(score * 100)}%)`,
        data: { similarity: score, created_at: nowIso },
        style: { strokeDasharray: "5,5" },
      })
      existingEdgeIds.add(edgeId)
    }
  })

  return {
    ...graph,
    center: centerId,
    nodes: mergedNodes,
    edges: mergedEdges,
  }
}

export function BugGraphDialog({ open, onOpenChange, bugId }: BugGraphDialogProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedNode, setSelectedNode] = React.useState<Node | null>(null)
  const [graphData, setGraphData] = React.useState<GraphData | null>(null)
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false)
  const [saveTitle, setSaveTitle] = React.useState("")
  const [saveAsPublic, setSaveAsPublic] = React.useState(false)
  const [timeTravelPercent, setTimeTravelPercent] = React.useState(100)
  const router = useRouter()

  React.useEffect(() => {
    if (open && bugId) {
      setSelectedNode(null)
      setError(null)
      setTimeTravelPercent(100)
      fetchGraphData()
    }
  }, [open, bugId])

  async function fetchGraphData() {
    const cached = graphCache.get(bugId)
    if (cached?.nodes?.length) {
      setGraphData(cached)
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ depth: String(GRAPH_DEPTH), limit: String(GRAPH_LIMIT) })
      const res = await fetch(`/api/bugs/${bugId}/graph?${params}`)
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody?.error || `Failed to load graph (${res.status})`)
      }
      const wrapper = await res.json()
      let graph: GraphData = wrapper.data ?? wrapper

      const relatedRes = await fetch(`/api/bugs/${bugId}/related`, { cache: "no-store" })
      if (relatedRes.ok) {
        const relatedJson = await relatedRes.json()
        const relatedItems = Array.isArray(relatedJson?.results) ? relatedJson.results as RelatedBugItem[] : []
        graph = mergeStackOverflowIntoGraph(graph, relatedItems, bugId)
      }

      if (!graph?.nodes?.length || !Array.isArray(graph.edges)) {
        setError("Graph returned no data.")
        return
      }
      graphCache.set(bugId, graph)
      setGraphData(graph)
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to fetch graph"
      setError(message)
      setNodes([])
      setEdges([])
    } finally {
      setLoading(false)
    }
  }

  function applyGraphToFlow(graph: GraphData) {
    const flowNodes: Node[] = graph.nodes.map((node, idx) => ({
      id: node.id,
      type: node.type,
      position: node.position ?? {
        x: Math.cos((idx / graph.nodes.length) * Math.PI * 2) * 300,
        y: Math.sin((idx / graph.nodes.length) * Math.PI * 2) * 300,
      },
      data: { ...node.data, type: node.type, label: node.label },
    }))

    const flowEdges: Edge[] = graph.edges.map((edge, idx) => {
      const baseStyle = edgeTypeStyles[edge.type] || { stroke: "#94a3b8" }
      const weight = edge.weight ?? 0.5
      return {
        id: edge.id || `e-${edge.source}-${edge.target}-${idx}`,
        source: edge.source,
        target: edge.target,
        type: "custom",
        label: edge.label || edge.type?.replace(/_/g, " ") || "Related",
        animated: ["SOLUTION_FOR", "CAUSE_OF", "solution_for", "cause_of", "contradicts", "condractary", "condractary-dispute", "conflict"].includes(edge.type),
        markerEnd: { type: MarkerType.ArrowClosed, color: baseStyle.stroke },
        style: { ...baseStyle, strokeWidth: Math.max(2, weight * 3), opacity: 0.9, ...edge.style },
        labelStyle: { fill: "#334155", fontWeight: 600, fontSize: 10 },
        data: { weight, type: edge.type, ...(edge.data || {}), created_at: edge.data?.created_at },
      }
    })

    setNodes(flowNodes)
    setEdges(flowEdges)
  }

  // Time-travel: filter graph by created_at and apply to flow
  React.useEffect(() => {
    if (!graphData?.nodes?.length || !Array.isArray(graphData.edges)) return

    const getTime = (createdAt: string | null | undefined): number =>
      createdAt ? new Date(createdAt).getTime() : 0
    const timestamps: number[] = []
    graphData.nodes.forEach((n) => {
      const t = getTime(n.data?.created_at)
      if (t > 0) timestamps.push(t)
    })
    graphData.edges.forEach((e) => {
      const t = getTime(e.data?.created_at)
      if (t > 0) timestamps.push(t)
    })

    let visibleNodes: GraphNode[]
    let visibleEdges: GraphEdge[]
    if (timestamps.length === 0) {
      visibleNodes = graphData.nodes
      visibleEdges = graphData.edges
    } else {
      const minT = Math.min(...timestamps)
      const maxT = Math.max(...timestamps)
      const range = Math.max(maxT - minT, 1)
      const selectedTime = minT + range * (timeTravelPercent / 100)

      visibleNodes = graphData.nodes.filter((n) => {
        const at = n.data?.created_at
        if (!at) return true
        return new Date(at).getTime() <= selectedTime
      })
      const visibleIds = new Set(visibleNodes.map((n) => n.id))
      visibleEdges = graphData.edges.filter(
        (e) =>
          visibleIds.has(e.source) &&
          visibleIds.has(e.target) &&
          (!e.data?.created_at || new Date(e.data.created_at).getTime() <= selectedTime)
      )
    }

    applyGraphToFlow({
      ...graphData,
      nodes: visibleNodes,
      edges: visibleEdges,
    })
  }, [graphData, timeTravelPercent])

  React.useEffect(() => {
    if (!open || loading || nodes.length === 0 || !reactFlowInstance) return

    // Small delay to ensure rendering
    const timer = setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 800 })
    }, 100)

    return () => clearTimeout(timer)
  }, [open, loading, nodes.length, reactFlowInstance])

  const onNodeClick = React.useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)

    // dim other nodes logic could go here
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: n.id === node.id,
      }))
    )
  }, [setNodes])

  const onPaneClick = React.useCallback(() => {
    setSelectedNode(null)
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })))
  }, [setNodes])

  function openSaveDialog() {
    setSaveTitle(`Relationship graph – Bug #${bugId.slice(0, 8)}`)
    setSaveAsPublic(false)
    setSaveDialogOpen(true)
  }

  async function handleSaveWorkspace() {
    if (!reactFlowInstance || !bugId) return
    const title = saveTitle.trim() || `Workspace: Bug #${bugId.slice(0, 8)}`
    try {
      setSaving(true)
      const rfObject = reactFlowInstance.toObject()

      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: `Graph workspace for bug ${bugId.slice(0, 8)}. ${saveAsPublic ? "Public – others can view and copy to build ideas." : "Private – only you can view and add ideas."}`,
          nodes: rfObject.nodes,
          edges: rfObject.edges,
          origin_bug_id: bugId,
          is_public: saveAsPublic,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save workspace")
      }

      const data = await res.json()
      if (data.xpEarned) {
        toast.success(`+${data.xpEarned} BugXP – Graph saved!`, { duration: 4000 })
        window.dispatchEvent(new CustomEvent("hunter:xp", { detail: { xp: data.xpEarned } }))
      }
      setSaveDialogOpen(false)
      onOpenChange(false)
      setTimeout(() => {
        router.push(`/workspaces/${data.graph.id}`)
      }, 150)
    } catch (e: any) {
      console.error("Failed to save workspace:", e)
      setError(e.message || "Failed to save workspace.")
    } finally {
      setSaving(false)
    }
  }

  const selectedNodeData = selectedNode?.data as any

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false} className="fixed inset-0  right-0 bottom-0 w-[100vw] min-w-full h-screen max-w-none sm:max-w-none max-h-none translate-x-0 translate-y-0 rounded-none flex flex-col p-0 gap-0 overflow-hidden outline-none !left-0 !top-0">
          <DialogHeader className="px-6 py-4 border-b border-white/20 dark:border-white/10 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-10 flex flex-row items-center justify-between gap-4 min-h-14">
            <DialogTitle className="flex items-center gap-2 min-w-0 truncate">
              <GitBranch className="h-5 w-5 text-primary shrink-0" />
              <span className="truncate">Bug Relationship Graph</span>
            </DialogTitle>
            <div className="flex items-center gap-2  relative z-10">
              <Button
                className="shrink-0 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                onClick={openSaveDialog}
                disabled={saving || nodes.length === 0}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save relationship diagram
              </Button>
              <DialogClose asChild>
                <Button size="default" className="shrink-0 gap-2">
                  <X className="h-4 w-4" />
                  Close
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="flex-1 w-full h-full min-h-0 flex flex-col">
            {/* Graph Canvas – glassmorphism background */}
            <div className="flex-1 min-h-0 relative w-full overflow-hidden rounded-b-xl bg-gradient-to-br from-white/40 via-slate-50/30 to-slate-100/40 dark:from-slate-800/50 dark:via-slate-900/40 dark:to-slate-800/50 border border-white/40 dark:border-white/10 shadow-inner">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 font-medium text-muted-foreground">Generating Graph...</span>
                </div>
              ) : error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-4">
                  <p className="text-destructive font-medium text-center">{error}</p>
                  <Button size="sm" onClick={() => { setError(null); fetchGraphData(); }}>
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="absolute inset-0 w-full h-full">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={onNodeClick}
                  onPaneClick={onPaneClick}
                  onInit={setReactFlowInstance}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  connectionMode={ConnectionMode.Loose}
                  fitView
                  className="h-full w-full"
                  minZoom={0.2}
                  maxZoom={2}
                  defaultEdgeOptions={{ type: 'smoothstep' }}
                >
                  <Background color="#94a3b8" gap={20} size={1} className="opacity-[0.15] dark:opacity-[0.2]" />
                  <Controls showInteractive={false} style={{ marginBottom: "2rem" }} />

                  {/* Legend Panel */}
                  <Panel position="top-right" className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-xl shadow-black/5 dark:shadow-black/20 p-4 rounded-2xl text-xs w-[200px]">
                    <div className="font-semibold mb-2 flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-3 w-3" />
                        <span>Legend ({edges.length} edges drawn)</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {Object.entries(nodeTypeColors).slice(0, 8).map(([type, color]) => (
                        <div key={type} className="flex items-center gap-2">
                          <div className={cn("w-2.5 h-2.5  shrink-0", color.split(" ")[0])} />
                          <span className="capitalize text-[10px] text-muted-foreground">{type.replace(/_/g, " ")}</span>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  {/* Insights Overlay Panel */}
                  {graphData?.insights && (
                    <Panel position="top-left" className="bg-transparent m-4 max-w-[300px] flex flex-col gap-3">
                      {/* Root Cause Card */}
                      {graphData.insights.rootCausePatterns.length > 0 && (
                        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-indigo-200/40 dark:border-indigo-500/20 shadow-xl shadow-indigo-500/5 dark:shadow-indigo-500/10 animate-in fade-in slide-in-from-left-4 duration-500 rounded-2xl overflow-hidden">
                          <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-2">
                              <Search className="h-3 w-3" />
                              Detected Patterns
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-1">
                            <ul className="space-y-1">
                              {graphData.insights.rootCausePatterns.map((pattern, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-[11px] leading-tight text-foreground/80">
                                  <span className="text-indigo-500 text-[10px]">•</span>
                                  <span>{pattern}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {/* Environments Card */}
                      {graphData.insights.recurringEnvironments.length > 0 && (
                        <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-blue-200/40 dark:border-blue-500/20 shadow-xl shadow-blue-500/5 dark:shadow-blue-500/10 animate-in fade-in slide-in-from-left-4 duration-700 rounded-2xl overflow-hidden">
                          <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-brand-blue flex items-center gap-2">
                              <Globe className="h-3 w-3" />
                              Affected Envs
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-1">
                            <div className="flex flex-wrap gap-2">
                              {graphData.insights.recurringEnvironments.map((env, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px] h-5 px-1.5 bg-brand-blue/5 text-brand-blue border-brand-blue/20">
                                  {env.environment}: {env.count}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Panel>
                  )}
                </ReactFlow>
                </div>
              )}
            </div>

            {/* Time-travel slider: show how the web of issues grew over time */}
            {graphData && !loading && !error && graphData.nodes.length > 0 && (() => {
              const getT = (c: string | null | undefined) => (c ? new Date(c).getTime() : 0)
              const ts: number[] = []
              graphData.nodes.forEach((n) => { const t = getT(n.data?.created_at); if (t > 0) ts.push(t) })
              graphData.edges.forEach((e) => { const t = getT(e.data?.created_at); if (t > 0) ts.push(t) })
              const hasTime = ts.length > 0
              const minT = hasTime ? Math.min(...ts) : 0
              const maxT = hasTime ? Math.max(...ts) : 0
              const range = Math.max(maxT - minT, 1)
              const selectedTime = minT + range * (timeTravelPercent / 100)
              const asOfDate = hasTime ? new Date(selectedTime) : null
              return (
              <div className="shrink-0 border-t border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl px-4 py-3 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <History className="h-4 w-4" />
                  <span>Time travel</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={timeTravelPercent}
                  onChange={(e) => setTimeTravelPercent(Number(e.target.value))}
                  className="flex-1 min-w-[120px] max-w-[400px] h-2 rounded-full appearance-none bg-muted accent-primary cursor-pointer"
                  aria-label="Slide back in time to see how the graph grew"
                />
                <span className="text-xs text-muted-foreground tabular-nums min-w-[140px]">
                  {timeTravelPercent === 100
                    ? "Now (full graph)"
                    : asOfDate
                      ? `As of ${asOfDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                      : `${Math.round(timeTravelPercent)}% of timeline`}
                </span>
              </div>
              )
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save diagram: title + public/private */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" />
              Save relationship diagram
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-7 py-7">
            <div className="grid gap-2">
              <Label htmlFor="save-title" className="text-sm font-semibold mb-1">Title</Label>
              <Input
                id="save-title"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="e.g. Crash on divide by zero – graph"
                className="border-2 border-primary/40 bg-white dark:bg-background text-base font-normal focus:ring-primary focus:border-primary rounded-lg shadow-sm px-4 py-2 transition-all duration-150 outline-none"
                style={{ boxShadow: '0 0 0 2px rgba(59,130,246,0.08)', fontWeight: 400 }}
              />
            </div>
            <div className="grid gap-2 mt-2">
              <Label className="text-sm font-semibold mb-1">Visibility</Label>
              <RadioGroup
                value={saveAsPublic ? "public" : "private"}
                onValueChange={(v) => setSaveAsPublic(v === "public")}
                className="flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="private" id="vis-private" />
                  <Label htmlFor="vis-private" className="font-medium cursor-pointer text-sm text-foreground">
                    Private (only you)
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="public" id="vis-public" />
                  <Label htmlFor="vis-public" className="font-medium cursor-pointer text-sm text-foreground">
                    Public (anyone can view)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)} className="">
              Cancel
            </Button>
            <Button onClick={handleSaveWorkspace} disabled={saving} className=" bg-primary text-primary-foreground font-semibold shadow-md px-6 py-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Node Details Popup Dialog */}
      <Dialog open={!!selectedNode} onOpenChange={(open) => !open && setSelectedNode(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-4">
              <DialogTitle>Node Details</DialogTitle>
              {selectedNodeData?.type && (
                <Badge variant="outline" className="capitalize">
                  {selectedNodeData.type.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <h4 className="font-semibold text-lg leading-tight mb-1">
                {selectedNodeData?.label}
              </h4>
              {selectedNodeData?.title && selectedNodeData.title !== selectedNodeData.label && (
                <p className="text-sm text-muted-foreground">{selectedNodeData.title}</p>
              )}
            </div>

            {selectedNodeData?.description && (
              <div
                className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md prose prose-sm dark:prose-invert max-w-none break-words"
                dangerouslySetInnerHTML={{ __html: selectedNodeData.description }}
              />
            )}

            {/* Helper Metrics */}
            <div className="flex flex-wrap gap-2">
              {selectedNodeData?.confidence && (
                <Badge className="bg-brand-blue text-white hover:bg-brand-blue/90 border-0">
                  Confidence: {Math.round(selectedNodeData.confidence * 100)}%
                </Badge>
              )}
              {selectedNodeData?.impact && (
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-0">
                  Impact: {selectedNodeData.impact}
                </Badge>
              )}
            </div>

            {selectedNodeData?.url && (
              <Button className="w-full mt-2" size="lg" asChild>
                <a href={selectedNodeData.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Resource
                </a>
              </Button>
            )}

            {/* Debug Info Footer */}
            {selectedNode && (
              <div className="border-t pt-4 mt-4 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                <div>ID: {selectedNode.id}</div>
                <div>Pos: {Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)}</div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
