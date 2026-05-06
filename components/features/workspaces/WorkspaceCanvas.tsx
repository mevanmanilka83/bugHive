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
import { Loader2, Save, Plus, Lightbulb, Wrench, Sparkles, X, Pencil, Bug } from "lucide-react"
import { TimeTravelBar, timeToOpacity, useTimeTravelPlayback } from "@/components/features/graph/TimeTravelBar"
import { DeleteIcon } from "@/components/ui/delete"
import { useRouter } from "next/navigation"
import { cn, stripHtml } from "@/lib"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { GraphIdeaDialog } from "@/components/features/graphs/GraphIdeaDialog"
import { SearchAndAddNodesDialog } from "./SearchAndAddNodesDialog"
import { WorkspacePresenceCursors } from "./WorkspacePresenceCursors"
import { useWorkspaceRealtime } from "@/hooks/useWorkspaceRealtime"

type GraphIdea = { id: string; kind: string; title: string; content: string | null; created_at: string }
type IdeaKind = "idea" | "solution" | "fix"

const nodeTypeColors: Record<string, string> = {
    bug: "bg-rose-500/10 border-rose-500/50 text-rose-600",
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
    const kind: IdeaKind = (data.kind as any) || "idea"
    const styles = ideaKindStyles[kind] || ideaKindStyles.idea
    const descriptionText =
        typeof data.description === "string" ? stripHtml(data.description).slice(0, 220) : ""

    const KindIcon = kind === "solution" ? Wrench : kind === "fix" ? Sparkles : Lightbulb

    return (
        <div className={cn(
            "w-[200px] rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 transition-all duration-300 relative",
            selected ? "ring-2 ring-primary border-primary scale-105" : "hover:border-primary/50",
            "bg-card/90"
        )}>
            <div className="absolute right-1.5 top-1.5 z-10 flex items-center gap-1">
                <button
                    type="button"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-background/70 text-muted-foreground hover:bg-primary/10 hover:text-primary shadow-sm transition-colors"
                    aria-label="Edit idea"
                    onClick={(e) => {
                        e.stopPropagation()
                        if (typeof data.onEdit === "function") {
                            data.onEdit(data.ideaId as string | undefined)
                        }
                    }}
                >
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
                    aria-label="Delete idea"
                >
                    <DeleteIcon size={12} className="h-3 w-3" />
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
            "w-[160px] sm:w-[200px] rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 transition-all duration-300 relative",
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
    default: LegacyCustomNode,
}

const edgeTypes = {
    custom: CustomBadgeEdge,
}

export function WorkspaceCanvas({
  initialWorkspace,
  isOwner,
  canEdit,
  userId,
  userName,
}: {
  initialWorkspace: any
  isOwner: boolean
  canEdit: boolean
  userId: string
  userName: string
}) {
    const router = useRouter()
    const [mounted, setMounted] = React.useState(false)
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialWorkspace.nodes || [])
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialWorkspace.edges || [])
    const [rfInstance, setRfInstance] = React.useState<ReactFlowInstance | null>(null)
    const [saving, setSaving] = React.useState(false)
    const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null)
    const [dirty, setDirty] = React.useState(false)
    const [ideas, setIdeas] = React.useState<GraphIdea[]>([])
    const [ideasLoading, setIdeasLoading] = React.useState(true)
    const [addTitle, setAddTitle] = React.useState("")
    const [addContent, setAddContent] = React.useState("")
    const [addKind, setAddKind] = React.useState<IdeaKind>("idea")
    const [addingIdea, setAddingIdea] = React.useState(false)
    const [selectedIdeaId, setSelectedIdeaId] = React.useState<string | null>(null)
    const [showIdeasPanel, setShowIdeasPanel] = React.useState(true)
    const [ideaDialogOpen, setIdeaDialogOpen] = React.useState(false)
    const [ideaDialogInitialKind, setIdeaDialogInitialKind] = React.useState<IdeaKind>("idea")
    const [ideaDialogInitialTitle, setIdeaDialogInitialTitle] = React.useState<string>("")
    const [ideaDialogInitialContent, setIdeaDialogInitialContent] = React.useState<string | null>("")
    const [searchAddDialogOpen, setSearchAddDialogOpen] = React.useState(false)
    const [viewportVersion, setViewportVersion] = React.useState(0)
    const [timeTravelPercent, setTimeTravelPercent] = React.useState(100)
    const autoSaveTimeout = React.useRef<number | null>(null)
    const lastSavedPayloadRef = React.useRef<string>("")
    const viewportRafRef = React.useRef<number | null>(null)

    const { presence, trackCursorThrottled } = useWorkspaceRealtime({
      workspaceId: initialWorkspace.id,
      userId,
      userName,
      nodes,
      edges,
      setNodes,
      setEdges,
      enabled: !!initialWorkspace?.id,
    })

    const bugNodeIds = React.useMemo(() => {
        return nodes
            .filter((n) => n.type === "bug" && n.id && !n.id.startsWith("cluster-") && /^[0-9a-f-]{36}$/i.test(n.id))
            .map((n) => n.id)
    }, [nodes])

    const getTime = (c: string | null | undefined) => (c ? new Date(c).getTime() : 0)
    const { timestamps, minT, maxT, milestones } = React.useMemo(() => {
        const ts: number[] = []
        nodes.forEach((n) => {
            const t = getTime((n.data as any)?.created_at)
            if (t > 0) ts.push(t)
        })
        edges.forEach((e) => {
            const t = getTime((e.data as any)?.created_at)
            if (t > 0) ts.push(t)
        })
        const minT = ts.length > 0 ? Math.min(...ts) : 0
        const maxT = ts.length > 0 ? Math.max(...ts) : 0
        const milestones = [...new Set(ts)].sort((a, b) => a - b)
        return { timestamps: ts, minT, maxT, milestones }
    }, [nodes, edges])

    const selectedTime = React.useMemo(() => {
        if (timestamps.length === 0) return Infinity
        const range = Math.max(maxT - minT, 1)
        return minT + range * (timeTravelPercent / 100)
    }, [minT, maxT, timeTravelPercent, timestamps.length])

    const { isPlaying, toggle: togglePlayback } = useTimeTravelPlayback(
        timeTravelPercent,
        setTimeTravelPercent,
        minT,
        maxT,
        10
    )

    const isFirstRender = React.useRef(true)

    const viewNodes = React.useMemo(() => {
        if (timestamps.length === 0 || timeTravelPercent === 100) return nodes
        return nodes.map((n) => {
            const nodeTime = getTime((n.data as any)?.created_at)
            const opacity = timeToOpacity(nodeTime, selectedTime)
            const style = { ...(n.style || {}), opacity, transition: "opacity 0.3s ease" }
            return { ...n, style }
        })
    }, [nodes, selectedTime, timeTravelPercent, timestamps.length])

    const viewEdges = React.useMemo(() => {
        if (timestamps.length === 0 || timeTravelPercent === 100) return edges
        return edges.map((e) => {
            const edgeTime = getTime((e.data as any)?.created_at)
            const opacity = timeToOpacity(edgeTime, selectedTime)
            const style = { ...(e.style || {}), opacity, transition: "opacity 0.3s ease" }
            return { ...e, style }
        })
    }, [edges, selectedTime, timeTravelPercent, timestamps.length])

    const fetchIdeas = React.useCallback(async () => {
        try {
            setIdeasLoading(true)
            const res = await fetch(`/api/workspaces/${initialWorkspace.id}/ideas`)
            if (!res.ok) return
            const data = await res.json()
            setIdeas(data.ideas ?? [])
        } catch {
        } finally {
            setIdeasLoading(false)
        }
    }, [initialWorkspace.id])

    React.useEffect(() => {
        setMounted(true)
        const initial = JSON.stringify({
            nodes: (initialWorkspace.nodes || []) as Node[],
            edges: (initialWorkspace.edges || []) as Edge[],
        })
        lastSavedPayloadRef.current = initial
        setLastSavedAt(null)
        setDirty(false)
    }, [])

    React.useEffect(() => {
        fetchIdeas()
    }, [fetchIdeas])

    const onConnect = React.useCallback(
        (params: Connection) =>
            setEdges((eds) =>
                addEdge(
                    {
                        ...params,
                        type: "custom",
                        animated: true,
                        label: "Connected",
                        data: { created_at: new Date().toISOString() },
                        style: { stroke: "#94a3b8", strokeDasharray: "5,5", strokeWidth: 2 },
                    },
                    eds
                )
            ),
        [setEdges]
    )

    const handleOpenAddIdea = () => {
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
            const payloadStr = JSON.stringify({ nodes: flow.nodes, edges: flow.edges })
            lastSavedPayloadRef.current = payloadStr
            setLastSavedAt(new Date())
            setDirty(false)
        } catch (e: any) {
            toast.error(e.message || "Failed to save")
        } finally {
            setSaving(false)
        }
    }

    const kindIcon = { idea: Lightbulb, solution: Wrench, fix: Sparkles }

    const handleDeleteIdea = React.useCallback(async (ideaId: string) => {
        const ok = window.confirm("Delete this idea? This cannot be undone.")
        if (!ok) return
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

                    if (dataIdeaId && dataIdeaId === ideaId) return false

                    if (n.id === `idea-${ideaId}`) return false

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

    const handleEditIdea = React.useCallback(
        (ideaId?: string) => {
            if (!ideaId) return
            const matched = ideas.find((i) => i.id === ideaId)
            if (!matched) return
            setSelectedIdeaId(matched.id)
            setIdeaDialogInitialKind(matched.kind as IdeaKind)
            setIdeaDialogInitialTitle(matched.title)
            setIdeaDialogInitialContent(matched.content ?? "")
            setShowIdeasPanel(true)
            setIdeaDialogOpen(true)
        },
        [ideas]
    )

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
                const dataIdeaId = (node.data as any)?.ideaId as string | undefined

                if (dataIdeaId) {
                    const matched = ideas.find((i) => i.id === dataIdeaId)
                    if (matched) {
                        setSelectedIdeaId(matched.id)
                        setIdeaDialogInitialKind(matched.kind as IdeaKind)
                        setIdeaDialogInitialTitle(matched.title)
                        setIdeaDialogInitialContent(matched.content ?? "")
                    } else {
                        setSelectedIdeaId(dataIdeaId)
                        setIdeaDialogInitialKind("idea")
                        setIdeaDialogInitialTitle(label)
                        setIdeaDialogInitialContent(description)
                    }
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

    React.useEffect(() => {
        setNodes((nds) => {
            let changed = false
            const nowIso = new Date().toISOString()

            const next = nds.map((n) => {
                if (n.type === "idea") {
                    const prevData: any = n.data || {}
                    const derivedIdeaId =
                        prevData.ideaId ||
                        (() => {
                            const m = /^idea-([0-9a-f-]{36})$/i.exec(n.id)
                            return m?.[1]
                        })()

                    const needsUpdate =
                        prevData.onDelete !== handleDeleteIdea ||
                        prevData.onEdit !== handleEditIdea ||
                        prevData.ideaId !== derivedIdeaId

                    if (!needsUpdate) return n
                    changed = true
                    return {
                        ...n,
                        data: {
                            ...prevData,
                            onDelete: handleDeleteIdea,
                            onEdit: handleEditIdea,
                            ideaId: derivedIdeaId,
                        },
                    }
                }

                const prevData: any = n.data || {}
                if (prevData.created_at) return n
                changed = true
                return {
                    ...n,
                    data: {
                        ...prevData,
                        created_at: nowIso,
                    },
                }
            })

            return changed ? next : nds
        })
    }, [handleDeleteIdea, handleEditIdea, setNodes])

    React.useEffect(() => {
        setEdges((eds) => {
            let changed = false
            const nowIso = new Date().toISOString()
            const next = eds.map((e) => {
                const prevData: any = e.data || {}
                if (prevData.created_at) return e
                changed = true
                return { ...e, data: { ...prevData, created_at: nowIso } }
            })
            return changed ? next : eds
        })
    }, [setEdges])

    React.useEffect(() => {
        if (!rfInstance) return
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        if (!canEdit) return

        const payloadStr = JSON.stringify({ nodes, edges })
        if (payloadStr !== lastSavedPayloadRef.current) {
            setDirty(true)
        } else {
            setDirty(false)
            return
        }
        if (autoSaveTimeout.current !== null) {
            window.clearTimeout(autoSaveTimeout.current)
        }
        autoSaveTimeout.current = window.setTimeout(() => {
            handleSave(true).catch(() => {
            })
        }, 1500)
    }, [nodes, edges, rfInstance, canEdit])

    return (
        <div className="w-full h-full relative" style={{ height: "calc(100vh - 56px)" }}>
            <Panel position="top-right" className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-xl shadow-black/5 p-3 rounded-2xl flex gap-2 flex-wrap items-center">
                {presence.size > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        {presence.size} {presence.size === 1 ? "person" : "people"} viewing
                    </span>
                )}
                {canEdit && (
                    <>
                        <Button size="sm" onClick={handleOpenAddIdea}>
                            <Plus className="h-4 w-4 mr-1" /> Idea Node
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSearchAddDialogOpen(true)}>
                            <Bug className="h-4 w-4 mr-1" /> Add Bug/Cluster
                        </Button>
                        <Button size="sm" onClick={() => handleSave(false)} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                            Save Changes
                        </Button>
                        {dirty && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                                Unsaved changes
                            </span>
                        )}
                        {lastSavedAt && !dirty && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                                Last saved {lastSavedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        )}
                    </>
                )}
                <Button size="sm" onClick={() => router.push("/workspaces")}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
            </Panel>

            {showIdeasPanel && (
                <Panel position="top-left" className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-xl shadow-black/10 dark:shadow-black/20 rounded-2xl w-72 max-h-[70vh] overflow-hidden flex flex-col">
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
                                                        setIdeaDialogInitialKind(i.kind as IdeaKind)
                                                        setIdeaDialogInitialTitle(i.title)
                                                        setIdeaDialogInitialContent(i.content ?? "")
                                                        setShowIdeasPanel(true)
                                                        setIdeaDialogOpen(true)
                                                    }}
                                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                                                    aria-label="Edit idea"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteIdea(i.id)
                                                    }}
                                                    className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                                    aria-label="Delete idea"
                                                >
                                                    <DeleteIcon size={12} className="h-3 w-3" />
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
                </Panel>
            )}

            <ReactFlow
                nodes={viewNodes}
                edges={viewEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={handleNodeClick}
                onInit={setRfInstance}
                onViewportChange={() => {
                    if (viewportRafRef.current != null) return
                    viewportRafRef.current = window.requestAnimationFrame(() => {
                        viewportRafRef.current = null
                        setViewportVersion((v) => v + 1)
                    })
                }}
                onPaneMouseMove={(event) => {
                  if (!rfInstance) return
                  const pos = rfInstance.screenToFlowPosition({
                    x: event.clientX,
                    y: event.clientY,
                  })
                  trackCursorThrottled(pos.x, pos.y)
                }}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                snapToGrid
                snapGrid={[20, 20]}
            >
                <Background color="#ccc" gap={20} size={1} />
                <Controls showInteractive={false} style={{ marginBottom: "2rem" }} />
                <WorkspacePresenceCursors presence={presence} viewportVersion={viewportVersion} />
                {milestones.length > 0 && (
                    <Panel position="bottom-center" className="w-full px-4 pb-3">
                        <div className="max-w-4xl mx-auto">
                            <TimeTravelBar
                                percent={timeTravelPercent}
                                onPercentChange={setTimeTravelPercent}
                                milestones={milestones}
                                minTime={minT}
                                maxTime={maxT}
                                isPlaying={isPlaying}
                                onPlayPause={togglePlayback}
                            />
                        </div>
                    </Panel>
                )}
            </ReactFlow>

            {canEdit && (
                <SearchAndAddNodesDialog
                    open={searchAddDialogOpen}
                    onOpenChange={setSearchAddDialogOpen}
                    existingNodeIds={new Set(nodes.map((n) => n.id))}
                    onAddBug={(bug) => {
                        if (nodes.some((n) => n.id === bug.id)) return
                        const vp = rfInstance?.getViewport?.()
                        const baseX = vp ? -vp.x + 200 : 0
                        const baseY = vp ? -vp.y + 100 : 0
                        const newNode: Node = {
                            id: bug.id,
                            type: "bug",
                            position: { x: baseX + Math.random() * 80 - 40, y: baseY + Math.random() * 80 - 40 },
                            data: {
                                type: "bug",
                                label: bug.title,
                                created_at: (bug as { created_at?: string }).created_at ?? new Date().toISOString(),
                            },
                        }
                        setNodes((nds) => nds.concat(newNode))
                        toast.success(`Added bug: ${bug.title}`)
                    }}
                    onAddCluster={(cluster) => {
                        const nodeId = `cluster-${cluster.id}`
                        if (nodes.some((n) => n.id === nodeId)) return
                        const vp = rfInstance?.getViewport?.()
                        const baseX = vp ? -vp.x + 200 : 0
                        const baseY = vp ? -vp.y + 100 : 0
                        const newNode: Node = {
                            id: nodeId,
                            type: "cluster",
                            position: { x: baseX + Math.random() * 80 - 40, y: baseY + Math.random() * 80 - 40 },
                            data: { type: "cluster", label: cluster.name, created_at: new Date().toISOString() },
                        }
                        setNodes((nds) => nds.concat(newNode))
                        toast.success(`Added cluster: ${cluster.name}`)
                    }}
                />
            )}

            {canEdit && (
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
                        fetchIdeas()
                        if (idea.id) {
                            setSelectedIdeaId(idea.id)
                        }
                        setShowIdeasPanel(true)

                        setNodes((nds) => {
                            const nodeId = idea.id ? `idea-${idea.id}` : `idea-${Date.now()}`
                            if (
                                idea.id &&
                                nds.some((n) => n.type === "idea" && (((n.data as any)?.ideaId as string | undefined) === idea.id || n.id === `idea-${idea.id}`))
                            ) {
                                return nds
                            }
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
                                    onEdit: handleEditIdea,
                                    created_at: (idea as { created_at?: string }).created_at ?? new Date().toISOString(),
                                },
                            }
                            return nds.concat(newNode)
                        })

                        handleSave(true).catch(() => {
                        })
                    }}
                />
            )}
        </div>
    )
}
