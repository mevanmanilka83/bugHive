"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ExternalLink, Bug, Tag, Globe, Code, Github, MessageSquare, AlertCircle, Lightbulb, Search, ShieldAlert, GitBranch } from "lucide-react"
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
  NodeTypes,
  ReactFlowInstance,
  Panel,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { cn } from "@/lib/utils-client"

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
  nodes: GraphNode[]
  edges: GraphEdge[]
  insights: {
    rootCausePatterns: string[]
    recurringEnvironments: Array<{ environment: string; count: number }>
    externalReferences: Array<{ type: string; title: string; url: string }>
  }
}

// --- Visual Configuration ---

const nodeTypeColors: Record<string, string> = {
  bug: "bg-blue-500 border-blue-600",
  cluster: "bg-purple-500 border-purple-600",
  tag: "bg-green-500 border-green-600",
  environment: "bg-orange-500 border-orange-600",
  component: "bg-pink-500 border-pink-600",
  github_issue: "bg-gray-700 border-gray-800",
  stack_overflow: "bg-orange-600 border-orange-700",
  bugzilla: "bg-red-500 border-red-600",
  cause: "bg-amber-500 border-amber-600",
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
  bugzilla: <Bug className="h-4 w-4" />,
  cause: <Search className="h-4 w-4" />,
  solution: <Lightbulb className="h-4 w-4" />,
  evidence: <ShieldAlert className="h-4 w-4" />,
}

const edgeTypeStyles: Record<string, { stroke: string; strokeDasharray?: string }> = {
  similar_to: { stroke: "#94a3b8", strokeDasharray: "5,5" }, // Slate 400
  duplicate_of: { stroke: "#64748b", strokeDasharray: "5,5" }, // Slate 500
  solution_for: { stroke: "#10b981" }, // Emerald 500
  verified_by: { stroke: "#0ea5e9" }, // Sky 500
  cause_of: { stroke: "#f59e0b" }, // Amber 500
  contradicts: { stroke: "#ef4444", strokeDasharray: "4,2" }, // Red 500
  related_to: { stroke: "#cbd5e1" }, // Slate 300
  supports: { stroke: "#8b5cf6" }, // Violet 500
  fix_reference: { stroke: "#10b981", strokeDasharray: "2,2" },
}

function CustomNode({ data, selected }: { data: any; selected: boolean }) {
  const nodeType = data.type || "bug"
  const colorClass = nodeTypeColors[nodeType] || "bg-slate-500 border-slate-600"
  const icon = nodeTypeIcons[nodeType] || <Bug className="h-4 w-4" />
  const isFocus = data.isFocus

  return (
    <div
      className={cn(
        "rounded-xl border shadow-sm transition-all duration-200 min-w-[160px] max-w-[240px] bg-background",
        selected ? "ring-2 ring-primary border-primary shadow-md" : "border-border",
        isFocus ? "ring-4 ring-primary/20 scale-105 shadow-xl" : ""
      )}
    >
      <div className={cn("text-white p-2 rounded-t-xl flex items-center gap-2", colorClass)}>
        <div className="bg-white/20 p-1 rounded-full backdrop-blur-sm">{icon}</div>
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
        </div>
      </div>
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
}

export function BugGraphDialog({ open, onOpenChange, bugId }: BugGraphDialogProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedNode, setSelectedNode] = React.useState<Node | null>(null)
  const [graphData, setGraphData] = React.useState<GraphData | null>(null)
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null)

  React.useEffect(() => {
    if (open && bugId) {
      setSelectedNode(null)
      fetchGraphData()
    }
  }, [open, bugId])

  async function fetchGraphData() {
    try {
      setLoading(true)
      const res = await fetch(`/api/bugs/${bugId}/graph`)
      if (!res.ok) throw new Error("Failed to fetch graph")
      const wrapper = await res.json()
      // API returns { success: true, data: { ... } } or just data depending on format
      const graph: GraphData = wrapper.data || wrapper

      if (!graph || !graph.nodes || !graph.edges) {
        console.error("Invalid graph data format:", graph)
        return
      }

      // Convert to React Flow format
      const flowNodes: Node[] = graph.nodes.map((node, idx) => ({
        id: node.id,
        type: node.type, // Map directly to registered types
        position: node.position || {
          x: Math.cos((idx / graph.nodes.length) * Math.PI * 2) * 300,
          y: Math.sin((idx / graph.nodes.length) * Math.PI * 2) * 300,
        },
        data: { ...node.data, type: node.type, label: node.label },
      }))

      const flowEdges: Edge[] = graph.edges.map((edge) => {
        const baseStyle = edgeTypeStyles[edge.type] || { stroke: "#94a3b8" }
        const weight = edge.weight || 0.5

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: "smoothstep", // Consider "bezier" or "straight" if preferred
          label: edge.label || edge.type.replace(/_/g, " "),
          labelShowBg: true,
          labelBgStyle: { fill: "#f8fafc", opacity: 0.95, rx: 4, ry: 4 },
          labelBgPadding: [8, 4],
          labelBgBorderRadius: 4,
          animated: edge.type === "solution_for" || edge.type === "cause_of" || edge.type === "contradicts",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: baseStyle.stroke,
          },
          style: {
            ...baseStyle,
            strokeWidth: Math.max(2, weight * 3),
            opacity: 0.9,
            ...edge.style, // Allow API override
          },
          labelStyle: {
            fill: "#334155", // slate-700
            fontWeight: 600,
            fontSize: 10,
          },
          data: { weight, type: edge.type }
        }
      })

      setNodes(flowNodes)
      setEdges(flowEdges)
      setGraphData(graph)
      // Do not auto-select the focus node — show the graph first; user can click a node to see details.

    } catch (error) {
      console.error("Failed to fetch graph:", error)
    } finally {
      setLoading(false)
    }
  }

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

  const selectedNodeData = selectedNode?.data as any

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden outline-none">
          <DialogHeader className="px-6 py-4 border-b shrink-0 bg-background z-10">
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              Bug Relationship Graph
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 w-full h-full min-h-0 relative">
            {/* Graph Canvas */}
            <div className="absolute inset-0 w-full h-full bg-muted/5">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center z-50 bg-background/50 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 font-medium text-muted-foreground">Generating Graph...</span>
                </div>
              ) : (
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={onNodeClick}
                  onPaneClick={onPaneClick}
                  onInit={setReactFlowInstance}
                  nodeTypes={nodeTypes}
                  connectionMode={ConnectionMode.Loose}
                  fitView
                  className="h-full w-full"
                  minZoom={0.2}
                  maxZoom={2}
                  defaultEdgeOptions={{ type: 'smoothstep' }}
                >
                  <Background color="#94a3b8" gap={20} size={1} />
                  <Controls showInteractive={false} />
                  <MiniMap
                    nodeColor={(node) => {
                      const type = node.data?.type || "bug"
                      // Extract simplistic color mapping for minimap
                      if (type === 'bg-blue-500') return '#3b82f6'
                      return '#64748b'
                    }}
                    maskColor="rgba(0, 0, 0, 0.1)"
                    className="!bottom-4 !left-4"
                  />

                  {/* Legend Panel */}
                  <Panel position="top-right" className="bg-background/95 backdrop-blur-sm p-3 rounded-lg border shadow-lg text-xs w-[200px]">
                    <div className="font-semibold mb-2 flex items-center gap-2">
                      <GitBranch className="h-3 w-3" />
                      <span>Legend</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {Object.entries(nodeTypeColors).slice(0, 8).map(([type, color]) => (
                        <div key={type} className="flex items-center gap-2">
                          <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", color.split(" ")[0])} />
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
                        <Card className="bg-background/90 backdrop-blur-md border-amber-200/50 shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
                          <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-600 flex items-center gap-2">
                              <Search className="h-3 w-3" />
                              Detected Patterns
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-1">
                            <ul className="space-y-1">
                              {graphData.insights.rootCausePatterns.map((pattern, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-[11px] leading-tight text-foreground/80">
                                  <span className="text-amber-500 text-[10px]">•</span>
                                  <span>{pattern}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {/* Environments Card */}
                      {graphData.insights.recurringEnvironments.length > 0 && (
                        <Card className="bg-background/90 backdrop-blur-md border-blue-200/50 shadow-sm animate-in fade-in slide-in-from-left-4 duration-700">
                          <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-2">
                              <Globe className="h-3 w-3" />
                              Affected Envs
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-3 pt-1">
                            <div className="flex flex-wrap gap-2">
                              {graphData.insights.recurringEnvironments.map((env, idx) => (
                                <Badge key={idx} variant="outline" className="text-[10px] h-5 px-1.5 bg-blue-50/50 text-blue-700 border-blue-100">
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
              )}
            </div>
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
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-0">
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
