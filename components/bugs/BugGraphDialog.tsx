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
import { Loader2, ExternalLink, Bug, Tag, Globe, Code, Github, MessageSquare, AlertCircle } from "lucide-react"
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
  EdgeTypes,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { cn } from "@/lib/utils-client"
import type { GraphData, GraphNode, GraphEdge } from "@/app/api/bugs/[id]/graph/route"

interface BugGraphDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bugId: string
}

const nodeTypeColors: Record<string, string> = {
  bug: "bg-blue-500",
  cluster: "bg-purple-500",
  tag: "bg-green-500",
  environment: "bg-orange-500",
  component: "bg-pink-500",
  github_issue: "bg-gray-700",
  stack_overflow: "bg-orange-600",
  bugzilla: "bg-red-500",
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
}

function CustomNode({ data, selected }: { data: any; selected: boolean }) {
  const nodeType = data.type || "bug"
  const color = nodeTypeColors[nodeType] || "bg-gray-500"
  const icon = nodeTypeIcons[nodeType] || <Bug className="h-4 w-4" />

  return (
    <div
      className={cn(
        "rounded-lg border-2 shadow-lg min-w-[120px] max-w-[200px]",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border",
        color
      )}
    >
      <div className="bg-white/90 dark:bg-gray-900/90 p-3 rounded-t-lg">
        <div className="flex items-center gap-2 mb-1">
          <div className={cn("text-white p-1 rounded", color)}>{icon}</div>
          <Badge variant="secondary" className="text-xs">
            {nodeType.replace(/_/g, " ")}
          </Badge>
        </div>
        <div className="text-sm font-semibold text-foreground line-clamp-2">
          {data.label || "Untitled"}
        </div>
      </div>
      {data.description && (
        <div className="px-3 py-2 bg-muted/50 rounded-b-lg">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {data.description}
          </p>
        </div>
      )}
    </div>
  )
}

const nodeTypes: NodeTypes = {
  default: CustomNode,
}

export function BugGraphDialog({ open, onOpenChange, bugId }: BugGraphDialogProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = React.useState(false)
  const [selectedNode, setSelectedNode] = React.useState<Node | null>(null)
  const [graphData, setGraphData] = React.useState<GraphData | null>(null)

  React.useEffect(() => {
    if (open && bugId) {
      fetchGraphData()
    }
  }, [open, bugId])

  async function fetchGraphData() {
    try {
      setLoading(true)
      const res = await fetch(`/api/bugs/${bugId}/graph`)
      if (!res.ok) return
      const data = await res.json()
      const graph: GraphData = data?.data || data

      // Convert to React Flow format
      const flowNodes: Node[] = graph.nodes.map((node, idx) => ({
        id: node.id,
        type: "default",
        position: node.position || {
          x: Math.cos((idx / graph.nodes.length) * Math.PI * 2) * 200 + 400,
          y: Math.sin((idx / graph.nodes.length) * Math.PI * 2) * 200 + 300,
        },
        data: { ...node.data, type: node.type, label: node.label },
      }))

      const flowEdges: Edge[] = graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        label: edge.label || edge.type.replace(/_/g, " "),
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: {
          strokeWidth: Math.max(1, edge.weight * 3),
          stroke: edge.weight > 0.7 ? "#ef4444" : edge.weight > 0.5 ? "#f59e0b" : "#6b7280",
        },
        labelStyle: {
          fill: "#6b7280",
          fontSize: 10,
        },
      }))

      setNodes(flowNodes)
      setEdges(flowEdges)
      setGraphData(graph)
    } catch (error) {
      console.error("Failed to fetch graph:", error)
    } finally {
      setLoading(false)
    }
  }

  const onNodeClick = React.useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    // Highlight connected nodes
    const connectedNodeIds = new Set([node.id])
    edges.forEach((edge) => {
      if (edge.source === node.id) connectedNodeIds.add(edge.target)
      if (edge.target === node.id) connectedNodeIds.add(edge.source)
    })

    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: n.id === node.id,
        data: {
          ...n.data,
          highlighted: connectedNodeIds.has(n.id),
        },
      }))
    )
  }, [edges, setNodes])

  const onPaneClick = React.useCallback(() => {
    setSelectedNode(null)
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false, data: { ...n.data, highlighted: false } })))
  }, [setNodes])

  const selectedNodeData = selectedNode?.data

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Bug Relationship Graph
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 p-6 min-h-0 overflow-hidden">
          {/* Graph Canvas */}
          <div className="flex-1 rounded-lg border bg-background overflow-hidden relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                className="bg-muted/20"
              >
                <Background />
                <Controls />
                <MiniMap
                  nodeColor={(node) => {
                    const type = node.data?.type || "bug"
                    return nodeTypeColors[type]?.replace("bg-", "#") || "#6b7280"
                  }}
                  maskColor="rgba(0, 0, 0, 0.1)"
                />
              </ReactFlow>
            )}
          </div>

          {/* Insights Panel */}
          <div className="w-80 shrink-0 space-y-4 overflow-y-auto">
            {selectedNode ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Node Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">{selectedNodeData?.label}</p>
                    <Badge variant="secondary" className="mt-1">
                      {selectedNodeData?.type?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  {selectedNodeData?.description && (
                    <p className="text-xs text-muted-foreground">
                      {selectedNodeData.description}
                    </p>
                  )}
                  {selectedNodeData?.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <a href={selectedNodeData.url} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Open
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : null}

            {graphData?.insights && (
              <>
                {graphData.insights.rootCausePatterns.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Root Cause Patterns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        {graphData.insights.rootCausePatterns.map((pattern, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {graphData.insights.recurringEnvironments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recurring Environments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {graphData.insights.recurringEnvironments.map((env, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span>{env.environment}</span>
                            <Badge variant="secondary">{env.count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {graphData.insights.externalReferences.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">External References</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {graphData.insights.externalReferences.map((ref, idx) => (
                          <a
                            key={idx}
                            href={ref.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block p-2 rounded-md border hover:bg-muted text-sm"
                          >
                            <div className="font-medium">{ref.title}</div>
                            <div className="text-xs text-muted-foreground">{ref.type}</div>
                          </a>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
