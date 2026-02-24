"use client"

import * as React from "react"
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
    Handle,
    Position,
    BaseEdge,
    EdgeLabelRenderer,
    getSmoothStepPath,
    addEdge,
    Connection,
    type EdgeProps
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Plus, Lightbulb, Wrench, Sparkles, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn, generateUUID } from "@/lib/utils-client"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type GraphIdea = { id: string; kind: string; title: string; content: string | null; created_at: string }

const nodeTypeColors: Record<string, string> = {
    bug: "bg-blue-500/10 border-blue-500/50 text-blue-500",
    cluster: "bg-purple-500/10 border-purple-500/50 text-purple-500",
    cause: "bg-orange-500/10 border-orange-500/50 text-orange-500",
    solution: "bg-emerald-500/10 border-emerald-500/50 text-emerald-500",
    idea: "bg-yellow-500/10 border-yellow-500/50 text-yellow-600",
}

function IdeaNode({ data, selected }: { data: any; selected: boolean }) {
    return (
        <div className={cn(
            "w-[180px] rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300 relative",
            selected ? "ring-2 ring-yellow-400 border-yellow-400 scale-105" : "hover:border-yellow-400/50",
            "bg-card/90"
        )}>
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <div className={cn("p-2 sm:p-3 flex items-start gap-2", nodeTypeColors.idea)}>
                <div className="p-1.5 rounded-lg bg-background/50 shadow-sm shrink-0">
                    <Lightbulb className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase opacity-80 mb-0.5">Idea / Note</div>
                    <div className="text-sm font-semibold leading-tight line-clamp-2">
                        {data.label || "New Idea"}
                    </div>
                </div>
            </div>
            {data.description && (
                <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/30 rounded-b-xl border-t border-border/10">
                    {data.description}
                </div>
            )}
            <Handle type="source" position={Position.Bottom} className="opacity-0" />
        </div>
    )
}

function LegacyCustomNode({ data, selected }: { data: any; selected: boolean }) {
    const nodeType = data.type || "bug"
    const styles = nodeTypeColors[nodeType] || "bg-muted/50 border-border text-foreground"

    return (
        <div className={cn(
            "w-[160px] sm:w-[200px] rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300 relative",
            selected ? "ring-2 ring-primary border-primary scale-105" : "hover:border-primary/50",
            "bg-card/85"
        )}>
            <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !bg-muted-foreground/30 !border-[1.5px] !border-background !top-[-5px]" />
            <div className={cn("p-2 sm:p-3 flex items-start gap-2", styles)}>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase opacity-80 mb-0.5">{nodeType.replace(/_/g, " ")}</div>
                    <div className="text-sm font-semibold leading-tight line-clamp-2">{data.label || "Untitled"}</div>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !bg-muted-foreground/30 !border-[1.5px] !border-background !bottom-[-5px]" />
        </div>
    )
}

function CustomBadgeEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, label }: EdgeProps) {
    const [edgePath, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} id={id} />
            <EdgeLabelRenderer>
                <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all' }} className="nodrag nopan z-[100]">
                    {label && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 border shadow-sm cursor-pointer">{label}</Badge>}
                </div>
            </EdgeLabelRenderer>
        </>
    )
}

const nodeTypes: NodeTypes = {
    idea: IdeaNode,
    bug: LegacyCustomNode,
    cause: LegacyCustomNode,
    solution: LegacyCustomNode,
    cluster: LegacyCustomNode,
    github_issue: LegacyCustomNode,
    stack_overflow: LegacyCustomNode,
    bugzilla: LegacyCustomNode,
    default: LegacyCustomNode,
}

const edgeTypes = {
    custom: CustomBadgeEdge,
}

export function WorkspaceCanvas({ initialWorkspace, isOwner }: { initialWorkspace: any; isOwner: boolean }) {
    const router = useRouter()
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialWorkspace.nodes || [])
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialWorkspace.edges || [])
    const [rfInstance, setRfInstance] = React.useState<ReactFlowInstance | null>(null)
    const [saving, setSaving] = React.useState(false)
    const [ideas, setIdeas] = React.useState<GraphIdea[]>([])
    const [ideasLoading, setIdeasLoading] = React.useState(true)
    const [addTitle, setAddTitle] = React.useState("")
    const [addContent, setAddContent] = React.useState("")
    const [addKind, setAddKind] = React.useState<"idea" | "solution" | "fix">("idea")
    const [addingIdea, setAddingIdea] = React.useState(false)

    const fetchIdeas = React.useCallback(async () => {
        try {
            setIdeasLoading(true)
            const res = await fetch(`/api/workspaces/${initialWorkspace.id}/ideas`)
            if (!res.ok) return
            const data = await res.json()
            setIdeas(data.ideas ?? [])
        } catch {
            // ignore
        } finally {
            setIdeasLoading(false)
        }
    }, [initialWorkspace.id])

    React.useEffect(() => {
        fetchIdeas()
    }, [fetchIdeas])

    const onConnect = React.useCallback(
        (params: Connection) => setEdges((eds) => addEdge({
            ...params,
            type: 'custom',
            animated: true,
            label: "Connected",
            style: { stroke: "#94a3b8", strokeDasharray: "5,5", strokeWidth: 2 }
        }, eds)),
        [setEdges],
    )

    const handleAddIdea = () => {
        const newNode: Node = {
            id: `idea-${generateUUID()}`,
            type: 'idea',
            position: { x: Math.random() * 200, y: Math.random() * 200 },
            data: { label: "New Solution Idea", type: "idea", description: "Double click me to edit (simulated)" },
        }
        setNodes((nds) => nds.concat(newNode))
    }

    const handleSave = async () => {
        if (!rfInstance) return
        try {
            setSaving(true)
            const flow = rfInstance.toObject()
            const res = await fetch(`/api/workspaces/${initialWorkspace.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: initialWorkspace.title,
                    description: initialWorkspace.description,
                    nodes: flow.nodes,
                    edges: flow.edges,
                })
            })
            if (!res.ok) throw new Error("Failed to save workspace")
            toast.success("Workspace saved successfully")
        } catch (e: any) {
            toast.error(e.message || "Failed to save")
        } finally {
            setSaving(false)
        }
    }

    async function handleAddIdeaSubmit(e: React.FormEvent) {
        e.preventDefault()
        const title = addTitle.trim()
        if (!title || addingIdea) return
        try {
            setAddingIdea(true)
            const res = await fetch(`/api/workspaces/${initialWorkspace.id}/ideas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kind: addKind, title, content: addContent.trim() || null }),
            })
            if (!res.ok) throw new Error("Failed to add idea")
            setAddTitle("")
            setAddContent("")
            toast.success("Idea added")
            fetchIdeas()
        } catch (err: any) {
            toast.error(err.message || "Failed to add idea")
        } finally {
            setAddingIdea(false)
        }
    }

    const kindIcon = { idea: Lightbulb, solution: Wrench, fix: Sparkles }

    return (
        <div className="w-full h-full relative" style={{ height: "calc(100vh - 56px)" }}>
            <Panel position="top-right" className="bg-background/80 backdrop-blur-sm p-2 rounded-xl border flex gap-2 flex-wrap">
                {isOwner && (
                    <>
                        <Button variant="outline" size="sm" onClick={handleAddIdea}>
                            <Plus className="h-4 w-4 mr-1" /> Idea Node
                        </Button>
                        <Button variant="default" size="sm" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                            Save Changes
                        </Button>
                    </>
                )}
                <Button variant="outline" size="sm" onClick={() => router.push("/workspaces")}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
            </Panel>

            <Panel position="top-left" className="bg-background/95 backdrop-blur-sm rounded-xl border shadow-lg w-72 max-h-[70vh] overflow-hidden flex flex-col">
                <div className="p-2 border-b font-semibold text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Ideas & solutions
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {ideasLoading ? (
                        <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    ) : ideas.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">No ideas yet. Add one below to fix the issue.</p>
                    ) : (
                        ideas.map((i) => {
                            const Icon = kindIcon[i.kind as keyof typeof kindIcon] || Lightbulb
                            return (
                                <div key={i.id} className="rounded-lg border bg-muted/30 p-2 text-left">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <Badge variant="secondary" className="text-[10px] capitalize">{i.kind}</Badge>
                                    </div>
                                    <div className="font-medium text-sm">{i.title}</div>
                                    {i.content && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{i.content}</div>}
                                </div>
                            )
                        })
                    )}
                </div>
                {isOwner && (
                    <form onSubmit={handleAddIdeaSubmit} className="p-2 border-t space-y-2 bg-muted/20">
                        <div>
                            <Label className="text-xs">Kind</Label>
                            <select
                                value={addKind}
                                onChange={(e) => setAddKind(e.target.value as "idea" | "solution" | "fix")}
                                className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                            >
                                <option value="idea">Idea</option>
                                <option value="solution">Solution</option>
                                <option value="fix">Fix</option>
                            </select>
                        </div>
                        <div>
                            <Label className="text-xs">Title</Label>
                            <Input
                                value={addTitle}
                                onChange={(e) => setAddTitle(e.target.value)}
                                placeholder="e.g. Add null check"
                                className="mt-0.5 h-8 text-sm"
                                required
                            />
                        </div>
                        <div>
                            <Label className="text-xs">Details (optional)</Label>
                            <textarea
                                value={addContent}
                                onChange={(e) => setAddContent(e.target.value)}
                                placeholder="Steps or notes..."
                                className="mt-0.5 w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs min-h-[60px] resize-y"
                                rows={2}
                            />
                        </div>
                        <Button type="submit" size="sm" className="w-full gap-1.5" disabled={addingIdea || !addTitle.trim()}>
                            {addingIdea ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                            Add idea / solution
                        </Button>
                    </form>
                )}
            </Panel>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setRfInstance}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
            >
                <Background color="#ccc" gap={20} size={1} />
                <Controls showInteractive={false} />
                <MiniMap zoomable pannable
                    nodeColor={(n) => {
                        if (n.type === 'bug') return '#3b82f6'
                        if (n.type === 'idea') return '#eab308'
                        return '#94a3b8'
                    }}
                />
            </ReactFlow>
        </div>
    )
}
