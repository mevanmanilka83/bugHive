"use client"

import * as React from "react"
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
    Handle,
    Position,
    BaseEdge,
    EdgeLabelRenderer,
    getSmoothStepPath,
    addEdge,
    Connection,
    useReactFlow,
    type EdgeProps
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Save, Plus, Lightbulb, Wrench, Sparkles, X, Trash2, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn, stripHtml } from "@/lib/utils-client"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { GraphIdeaDialog } from "@/components/features/graphs/GraphIdeaDialog"

type GraphIdea = { id: string; kind: string; title: string; content: string | null; created_at: string }

const nodeTypeColors: Record<string, string> = {
    bug: "bg-rose-500/10 border-rose-500/50 text-rose-600",          // issue/bug = red
    cluster: "bg-purple-500/10 border-purple-500/50 text-purple-500",
    cause: "bg-slate-500/10 border-slate-500/50 text-slate-500",
    solution: "bg-emerald-500/10 border-emerald-500/50 text-emerald-600",
    idea: "bg-indigo-500/10 border-indigo-500/50 text-indigo-600",
}

const ideaKindStyles: Record<string, { header: string; label: string }> = {
    idea: {
        header: "bg-indigo-500/10 border-indigo-500/50 text-indigo-700",
        label: "Idea / Note",
    },
    solution: {
        header: "bg-emerald-500/10 border-emerald-500/50 text-emerald-700",
        label: "Solution",
    },
    fix: {
        header: "bg-emerald-500/10 border-emerald-500/50 text-emerald-700",
        label: "Fix",
    },
}

const ideaKindCardStyles: Record<string, { container: string; badge: string }> = {
    idea: {
        container: "bg-indigo-50/50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900",
        badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    },
    solution: {
        container: "bg-emerald-50 border-emerald-200",
        badge: "bg-emerald-100 text-emerald-800",
    },
    fix: {
        container: "bg-emerald-50 border-emerald-200",
        badge: "bg-emerald-100 text-emerald-800",
    },
}

function IdeaNode({ id, data, selected }: { id: string; data: any; selected: boolean }) {
    const reactFlow = useReactFlow()
    const kind: "idea" | "solution" | "fix" = (data.kind as any) || "idea"
    const styles = ideaKindStyles[kind] || ideaKindStyles.idea
    const descriptionText =
        typeof data.description === "string" ? stripHtml(data.description).slice(0, 220) : ""

    const KindIcon = kind === "solution" ? Wrench : kind === "fix" ? Sparkles : Lightbulb

    return (
        <div className={cn(
            "w-[200px] rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300 relative",
            selected ? "ring-2 ring-primary border-primary scale-105" : "hover:border-primary/50",
            "bg-card/90"
        )}>
            {/* Edit & delete icons for this idea node */}
            <div className="absolute right-1.5 top-1.5 z-10 flex items-center gap-1">
                <button
                    type="button"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-background/70 text-muted-foreground hover:bg-primary/10 hover:text-primary shadow-sm transition-colors"
                >
                    {/* Let click bubble so onNodeClick opens editor */}
                    <Pencil className="h-3 w-3" />
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        if (typeof data.onDelete === "function" && data.ideaId) {
                            data.onDelete(data.ideaId as string, data.label as string | undefined)
                        } else {
                            reactFlow.deleteElements({ nodes: [{ id }] })
                        }
                    }}
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-background/70 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground shadow-sm transition-colors"
                >
                    <Trash2 className="h-3 w-3" />
                </button>
            </div>
            <Handle type="target" position={Position.Top} className="opacity-0" />
            <div className={cn("p-2 sm:p-3 flex items-start gap-2 border-b", styles.header)}>
                <div className="p-1.5 rounded-lg bg-background/70 shadow-sm shrink-0">
                    <KindIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase opacity-80 mb-0.5">
                        {styles.label}
                    </div>
                    <div className="text-sm font-semibold leading-tight line-clamp-2">
                        {data.label || "New Idea"}
                    </div>
                </div>
            </div>
            {descriptionText && (
                <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/30 rounded-b-xl">
                    {descriptionText}
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
    const [mounted, setMounted] = React.useState(false)
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
    const [selectedIdeaId, setSelectedIdeaId] = React.useState<string | null>(null)
    const [showIdeasPanel, setShowIdeasPanel] = React.useState(true)
    const [ideaDialogOpen, setIdeaDialogOpen] = React.useState(false)
    const [ideaDialogInitialKind, setIdeaDialogInitialKind] = React.useState<"idea" | "solution" | "fix">("idea")
    const [ideaDialogInitialTitle, setIdeaDialogInitialTitle] = React.useState<string>("")
    const [ideaDialogInitialContent, setIdeaDialogInitialContent] = React.useState<string | null>("")
    const autoSaveTimeout = React.useRef<number | null>(null)
    const isFirstRender = React.useRef(true)

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
        setMounted(true)
    }, [])

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

    const handleOpenAddIdea = () => {
        // When user clicks "Idea Node", prepare the side Ideas & solutions panel
        // for creating a new idea/solution instead of opening a modal.
        setShowIdeasPanel(true)
        setSelectedIdeaId(null)
        setIdeaDialogInitialKind("idea")
        setIdeaDialogInitialTitle("")
        setIdeaDialogInitialContent("")
        setIdeaDialogOpen(true)
    }

    const handleSave = async (isAuto: boolean = false) => {
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
            if (!isAuto) {
                toast.success("Workspace saved successfully")
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to save")
        } finally {
            setSaving(false)
        }
    }

    const kindIcon = { idea: Lightbulb, solution: Wrench, fix: Sparkles }

    const handleDeleteIdea = React.useCallback(async (ideaId: string, title?: string) => {
        try {
            const res = await fetch(`/api/workspaces/${initialWorkspace.id}/ideas`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: ideaId }),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => null)
                throw new Error(err?.error || "Failed to delete idea")
            }

            setIdeas((prev) => prev.filter((i) => i.id !== ideaId))
            setNodes((nds) =>
                nds.filter((n) => {
                    if (n.type !== "idea") return true
                    const data: any = n.data || {}
                    const dataIdeaId = data.ideaId as string | undefined
                    const label = data.label as string | undefined

                    // Preferred: match by explicit ideaId
                    if (dataIdeaId && dataIdeaId === ideaId) return false

                    // Fallbacks for older nodes: id pattern or matching label
                    if (n.id === `idea-${ideaId}`) return false
                    if (title && label && label === title && !dataIdeaId) return false

                    return true
                })
            )
            if (selectedIdeaId === ideaId) {
                setSelectedIdeaId(null)
            }
            toast.success("Idea deleted")
        } catch (e: any) {
            toast.error(e?.message || "Failed to delete idea")
        }
    }, [initialWorkspace.id, selectedIdeaId])

    const handleNodeClick = React.useCallback(
        (_: React.MouseEvent, node: Node) => {
            const nodeType = (node.type || (node.data as any)?.type) as string | undefined
            if (nodeType === "bug") {
                const url = (node.data as any)?.url || `/bugs/${node.id}`
                router.push(url)
                return
            }

            if (nodeType === "idea") {
                const label = (node.data?.label as string) || ""
                const description = (node.data?.description as string) || ""

                const matched = ideas.find((i) => i.title === label)
                if (matched) {
                    setSelectedIdeaId(matched.id)
                    setIdeaDialogInitialKind(matched.kind as "idea" | "solution" | "fix")
                    setIdeaDialogInitialTitle(matched.title)
                    setIdeaDialogInitialContent(matched.content ?? "")
                } else {
                    setSelectedIdeaId(null)
                    setIdeaDialogInitialKind("idea")
                    setIdeaDialogInitialTitle(label)
                    setIdeaDialogInitialContent(description)
                }
                setShowIdeasPanel(true)
                setIdeaDialogOpen(true)
            } else {
                setSelectedIdeaId(null)
            }
        },
        [ideas]
    )

    // Ensure existing idea nodes know how to delete themselves (link to handleDeleteIdea)
    React.useEffect(() => {
        setNodes((nds) =>
            nds.map((n) =>
                n.type === "idea"
                    ? {
                        ...n,
                        data: {
                            ...n.data,
                            onDelete: handleDeleteIdea,
                        },
                    }
                    : n
            )
        )
    }, [handleDeleteIdea, setNodes])

    // Auto-save graph when nodes or edges change (debounced)
    React.useEffect(() => {
        if (!rfInstance) return
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        if (autoSaveTimeout.current !== null) {
            window.clearTimeout(autoSaveTimeout.current)
        }
        autoSaveTimeout.current = window.setTimeout(() => {
            handleSave(true).catch(() => {
                // errors are already handled inside handleSave
            })
        }, 1500)
    }, [nodes, edges, rfInstance])

    return (
        <div className="w-full h-full relative" style={{ height: "calc(100vh - 56px)" }}>
            <Panel position="top-right" className="bg-background/80 backdrop-blur-sm p-2 rounded-xl border flex gap-2 flex-wrap">
                {isOwner && (
                    <>
                        <Button size="sm" onClick={handleOpenAddIdea}>
                            <Plus className="h-4 w-4 mr-1" /> Idea Node
                        </Button>
                        <Button size="sm" onClick={() => handleSave(false)} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                            Save Changes
                        </Button>
                    </>
                )}
                <Button size="sm" onClick={() => router.push("/workspaces")}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
            </Panel>

            {showIdeasPanel && (
                <Panel position="top-left" className="bg-background/95 backdrop-blur-sm rounded-xl border shadow-lg w-72 max-h-[70vh] overflow-hidden flex flex-col">
                    <div className="p-3 px-4 border-b font-semibold text-[15px] flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 stroke-[2.5]" />
                        Ideas & solutions
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {ideasLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : ideas.length === 0 ? (
                            <p className="text-sm text-muted-foreground/80 py-2 px-1">
                                No ideas yet. Add one below to fix the issue.
                            </p>
                        ) : (
                            ideas.map((i) => {
                                const Icon = kindIcon[i.kind as keyof typeof kindIcon] || Lightbulb
                                const isSelected = i.id === selectedIdeaId
                                const kindStyles = ideaKindCardStyles[i.kind] || ideaKindCardStyles.idea
                                const preview = stripHtml(i.content ?? "").slice(0, 160)
                                return (
                                    <div
                                        key={i.id}
                                        className={cn(
                                            "rounded-lg border p-2 text-left cursor-pointer transition-colors",
                                            kindStyles.container,
                                            isSelected && "ring-1 ring-primary"
                                        )}
                                        onClick={() => {
                                            setSelectedIdeaId(i.id)
                                            setAddKind(i.kind as "idea" | "solution" | "fix")
                                            setAddTitle(i.title)
                                            setAddContent(i.content ?? "")
                                        }}
                                    >
                                        <div className="flex items-start justify-between gap-1.5 mb-1">
                                            <div className="flex items-center gap-1.5">
                                                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                <Badge
                                                    variant="secondary"
                                                    className={cn("text-[10px] capitalize border-none", kindStyles.badge)}
                                                >
                                                    {i.kind}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedIdeaId(i.id)
                                                        setIdeaDialogInitialKind(i.kind as "idea" | "solution" | "fix")
                                                        setIdeaDialogInitialTitle(i.title)
                                                        setIdeaDialogInitialContent(i.content ?? "")
                                                        setShowIdeasPanel(true)
                                                        setIdeaDialogOpen(true)
                                                    }}
                                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteIdea(i.id, i.title)
                                                    }}
                                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="font-medium text-sm">{i.title}</div>
                                        {preview && (
                                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {preview}
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                    {/* Creation/edit is handled in GraphIdeaDialog */}
                </Panel>
            )}

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                onInit={setRfInstance}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
            >
                <Background color="#ccc" gap={20} size={1} />
                <Controls showInteractive={false} style={{ marginBottom: "2rem" }} />
            </ReactFlow>

            {isOwner && (
                <GraphIdeaDialog
                    workspaceId={initialWorkspace.id}
                    open={ideaDialogOpen}
                    onOpenChange={(open) => {
                        setIdeaDialogOpen(open)
                        if (!open) {
                            setSelectedIdeaId(null)
                        }
                    }}
                    initialKind={ideaDialogInitialKind}
                    initialTitle={ideaDialogInitialTitle}
                    initialContent={ideaDialogInitialContent}
                    onCreated={(idea) => {
                        // Refresh list
                        fetchIdeas()
                        // Highlight in panel
                        if (idea.id) {
                            setSelectedIdeaId(idea.id)
                        }
                        setShowIdeasPanel(true)

                        // Also place an idea node into the graph
                        setNodes((nds) => {
                            const nodeId = idea.id ? `idea-${idea.id}` : `idea-${Date.now()}`
                            if (nds.some((n) => n.id === nodeId)) return nds

                            const vp = rfInstance?.getViewport?.()
                            const baseX = vp ? -vp.x + 200 : 0
                            const baseY = vp ? -vp.y + 100 : 0

                            const newNode: Node = {
                                id: nodeId,
                                type: "idea",
                                position: {
                                    x: baseX + Math.random() * 80 - 40,
                                    y: baseY + Math.random() * 80 - 40,
                                },
                                data: {
                                    label: idea.title,
                                    type: "idea",
                                    description: idea.content || "",
                                    kind: idea.kind,
                                    ideaId: idea.id,
                                    onDelete: handleDeleteIdea,
                                },
                            }
                            return nds.concat(newNode)
                        })

                        // Immediately persist the new node so it doesn't disappear on reload
                        handleSave(true).catch(() => {
                            // errors are already handled inside handleSave
                        })
                    }}
                />
            )}
        </div>
    )
}
