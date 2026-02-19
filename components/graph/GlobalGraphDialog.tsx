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
import { Loader2, ExternalLink, Bug, Tag, Globe, Code, Github, MessageSquare, AlertCircle, Share2, Layers, AlertTriangle, FileText, CheckCircle } from "lucide-react"
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
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { cn } from "@/lib/utils-client"

interface GlobalGraphDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const nodeTypeColors: Record<string, string> = {
    bug: "bg-blue-500/10 border-blue-500/50 text-blue-500",
    cluster: "bg-purple-500/10 border-purple-500/50 text-purple-500",
    tag: "bg-green-500/10 border-green-500/50 text-green-500",
    environment: "bg-orange-500/10 border-orange-500/50 text-orange-500",
    component: "bg-pink-500/10 border-pink-500/50 text-pink-500",
    github_issue: "bg-zinc-700/10 border-zinc-500/50 text-zinc-500",
    stack_overflow: "bg-orange-600/10 border-orange-600/50 text-orange-600",
    cause: "bg-red-500/10 border-red-500/50 text-red-500",
    evidence: "bg-cyan-500/10 border-cyan-500/50 text-cyan-500",
    solution: "bg-emerald-500/10 border-emerald-500/50 text-emerald-500",
}

const nodeTypeIcons: Record<string, React.ReactNode> = {
    bug: <Bug className="h-4 w-4" />,
    cluster: <Layers className="h-4 w-4" />,
    tag: <Tag className="h-4 w-4" />,
    environment: <Globe className="h-4 w-4" />,
    component: <Code className="h-4 w-4" />,
    github_issue: <Github className="h-4 w-4" />,
    stack_overflow: <MessageSquare className="h-4 w-4" />,
    cause: <AlertTriangle className="h-4 w-4" />,
    evidence: <FileText className="h-4 w-4" />,
    solution: <CheckCircle className="h-4 w-4" />,
}

// Responsive node sizing
function CustomNode({ data, selected }: { data: any; selected: boolean }) {
    const nodeType = data.type || "bug"
    const styles = nodeTypeColors[nodeType] || "bg-muted/50 border-border text-foreground"
    const icon = nodeTypeIcons[nodeType] || <Bug className="h-4 w-4" />

    return (
        <div
            className={cn(
                "rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300",
                "w-[140px] sm:w-[180px] max-w-[240px]", // Responsive width
                selected ? "ring-2 ring-primary border-primary shadow-primary/20 scale-105" : "hover:border-primary/50",
                "bg-card/80"
            )}
        >
            <div className={cn("p-2 sm:p-3 flex items-start gap-2 sm:gap-3", styles)}>
                <div className={cn("p-1.5 sm:p-2 rounded-lg bg-background/50 shadow-sm shrink-0 text-foreground")}>
                    <div className="h-3 w-3 sm:h-4 sm:w-4 flex items-center justify-center">
                        {icon}
                    </div>
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-80 mb-0.5 truncate">
                        {nodeType.replace(/_/g, " ")}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold leading-tight text-foreground line-clamp-2 break-words">
                        {data.label || "Untitled"}
                    </div>
                </div>
            </div>

            {data.description && (
                <div className="px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs text-muted-foreground bg-muted/30 rounded-b-xl border-t border-border/10 line-clamp-2 hidden sm:block">
                    {data.description}
                </div>
            )}
        </div>
    )
}

const nodeTypes: NodeTypes = {
    bug: CustomNode,
    cluster: CustomNode,
    tag: CustomNode,
    environment: CustomNode,
    component: CustomNode,
    github_issue: CustomNode,
    stack_overflow: CustomNode,
    cause: CustomNode,
    evidence: CustomNode,
    solution: CustomNode,
    default: CustomNode,
}

export function GlobalGraphDialog({ open, onOpenChange }: GlobalGraphDialogProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
    const [loading, setLoading] = React.useState(false)
    const [selectedNode, setSelectedNode] = React.useState<Node | null>(null)
    const [insights, setInsights] = React.useState<any>(null)

    React.useEffect(() => {
        if (open) {
            fetchGraphData()
        }
    }, [open])

    async function fetchGraphData() {
        try {
            setLoading(true)
            const res = await fetch(`/api/graph`)
            if (!res.ok) return
            const data = await res.json()

            // Convert to React Flow format
            const flowNodes: Node[] = (data.nodes || []).map((node: any) => ({
                id: node.id,
                type: node.type || "default",
                position: node.position || { x: 0, y: 0 },
                data: { ...node.data, type: node.type, label: node.label },
            }))

            const flowEdges: Edge[] = (data.edges || []).map((edge: any) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                type: "smoothstep", // 'smoothstep', 'step', 'default', 'straight'
                animated: true,
                label: edge.label,
                style: { stroke: "hsl(var(--primary))", strokeWidth: 1.5, opacity: 0.6 },
                labelStyle: { fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: "hsl(var(--primary))",
                },
            }))

            setNodes(flowNodes)
            setEdges(flowEdges)
            setInsights(data.insights)
        } catch (error) {
            console.error("Failed to fetch graph:", error)
        } finally {
            setLoading(false)
        }
    }

    const onNodeClick = React.useCallback((_event: React.MouseEvent, node: Node) => {
        setSelectedNode(node)
    }, [])

    const onPaneClick = React.useCallback(() => {
        setSelectedNode(null)
    }, [])

    const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null)

    // Handle fitView on open or data change
    React.useEffect(() => {
        if (open && !loading && nodes.length > 0 && reactFlowInstance) {
            window.requestAnimationFrame(() => {
                reactFlowInstance.fitView({ padding: 0.2 })
            })
        }
    }, [open, loading, nodes.length, reactFlowInstance])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="p-0 gap-0 border-none shadow-2xl bg-background/95 backdrop-blur-xl focus:outline-none"
                style={{
                    maxWidth: '95vw',
                    width: '95vw',
                    height: '90vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                aria-describedby={undefined}
                showCloseButton={false}
            >
                <DialogHeader className="px-4 py-3 border-b border-border/40 shrink-0 flex flex-row items-center justify-between space-y-0 bg-background/50">
                    <DialogTitle className="flex items-center gap-2.5 text-lg">
                        <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                            <Share2 className="h-4 w-4" />
                        </div>
                        <span className="font-semibold tracking-tight">Bug Relationship Graph</span>
                    </DialogTitle>

                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-full p-2 hover:bg-muted/50 transition-colors"
                    >
                        <ExternalLink className="h-4 w-4 rotate-45" />
                        <span className="sr-only">Close</span>
                    </button>
                </DialogHeader>

                <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden bg-muted/5">
                    {/* Graph Canvas - Absolute Full Fill */}
                    <div className="absolute inset-0 z-0">
                        {loading && (
                            <div className="absolute inset-0 flex flex-col gap-3 items-center justify-center bg-background/50 backdrop-blur-sm z-50">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="text-sm font-medium text-muted-foreground animate-pulse">Analyzing relationships...</p>
                            </div>
                        )}

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
                            className="bg-dots-pattern"
                            minZoom={0.1}
                            maxZoom={2}
                            defaultEdgeOptions={{
                                type: 'smoothstep',
                                animated: true,
                            }}
                            defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
                            style={{ width: '100%', height: '100%' }}
                        >
                            <Background color="hsl(var(--muted-foreground))" gap={20} size={1} className="opacity-10" />

                            <Controls
                                className="bg-background border shadow-md rounded-lg p-1 m-4"
                                position="bottom-left"
                                showInteractive={false}
                            />

                            <div className="absolute top-4 right-4 z-10 pointer-events-none">
                                <div className="bg-background/90 backdrop-blur border shadow-sm rounded-lg p-3 space-y-2 max-w-[200px] pointer-events-auto">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Legend</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" /> Bug
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <div className="w-2 h-2 rounded-full bg-primary" /> Cluster
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <div className="w-2 h-2 rounded-full bg-red-500" /> Cause
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <div className="w-2 h-2 rounded-full bg-cyan-500" /> Evidence
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" /> Solution
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <MiniMap
                                nodeColor={(node) => {
                                    const type = node.data?.type
                                    if (type === 'cluster') return 'hsl(var(--primary))'
                                    if (type === 'bug') return '#3b82f6'
                                    if (type === 'cause') return '#ef4444'
                                    if (type === 'evidence') return '#06b6d4'
                                    if (type === 'solution') return '#10b981'
                                    return '#64748b'
                                }}
                                className="bg-background border shadow-md rounded-lg m-4"
                                position="bottom-right"
                                maskColor="rgba(0, 0, 0, 0.05)"
                            />
                        </ReactFlow>
                    </div>

                    {/* Insights Sidebar - Absolute Overlay */}
                    <div className={cn(
                        "absolute top-0 right-0 bottom-0 w-80 bg-background/90 backdrop-blur-md border-l border-border/40 shadow-xl z-20 transition-transform duration-300 ease-in-out",
                        selectedNode ? "translate-x-0" : "translate-x-full"
                    )}>
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/20">
                                <h3 className="font-semibold text-sm flex items-center gap-2">
                                    Graph Insights
                                </h3>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedNode(null)}>
                                    <span className="sr-only">Close</span>
                                    <ExternalLink className="h-3 w-3 rotate-180" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {selectedNode && selectedNode.data ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-1">
                                            <Badge variant="outline" className="capitalize mb-2 w-fit">
                                                {String((selectedNode.data as any).type || "bug").replace(/_/g, " ")}
                                            </Badge>
                                            <h4 className="text-lg font-bold leading-tight">{String((selectedNode.data as any).label || "")}</h4>
                                        </div>

                                        {(selectedNode.data as any).description && (
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {(selectedNode.data as any).description}
                                            </p>
                                        )}

                                        {(selectedNode.data as any).url && (
                                            <Button className="w-full gap-2" size="sm" asChild>
                                                <a href={(selectedNode.data as any).url} target="_blank" rel="noopener noreferrer">
                                                    Open Details <ExternalLink className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        )}

                                        <div className="pt-4 border-t border-border/40">
                                            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Connections</h5>
                                            <ul className="space-y-2">
                                                {edges
                                                    .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
                                                    .map(e => {
                                                        const isSource = e.source === selectedNode.id
                                                        const otherId = isSource ? e.target : e.source
                                                        const otherNode = nodes.find(n => n.id === otherId)
                                                        return (
                                                            <li key={e.id} className="text-xs p-2 rounded bg-muted/50 flex items-center justify-between">
                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                                                                        (otherNode?.type === 'cause') ? "bg-red-500" :
                                                                            (otherNode?.type === 'evidence') ? "bg-cyan-500" :
                                                                                (otherNode?.type === 'solution') ? "bg-emerald-500" :
                                                                                    "bg-primary"
                                                                    )} />
                                                                    <span className="font-medium text-foreground/80 truncate">{(otherNode?.data as any)?.label}</span>
                                                                </div>
                                                                <Badge variant="secondary" className="text-[10px] h-5 shrink-0 ml-2">{e.label || (e as any).type}</Badge>
                                                            </li>
                                                        )
                                                    })}
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                        <p className="text-sm">Select a node to view details</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
