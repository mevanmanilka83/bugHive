"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radioGroup"
import {
  ExternalLink, Bug, Tag, Globe, Code, Github, MessageSquare,
  AlertCircle, AlertTriangle, CheckCircle2, ShieldCheck,
  GitBranch, ArrowUp, ArrowDown, Loader2,
  X, Save, Network, ScanSearch, Maximize2, Rows3, Columns3, Zap,
  ChevronDown, ChevronUp, Star,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  ReactFlow, Node, Edge, Background, BackgroundVariant,
  Controls, MiniMap, useNodesState, useEdgesState, useReactFlow,
  ReactFlowProvider, ConnectionMode, MarkerType, NodeTypes,
  ReactFlowInstance, Panel, Position, Handle as FlowHandle,
  BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { toast } from "sonner"
import { cn } from "@/lib"
import { TimeTravelBar, timeToOpacity, useTimeTravelPlayback } from "@/components/features/graph/TimeTravelBar"
import dagre from "@dagrejs/dagre"

interface BugGraphDialogProps {
  open: boolean; onOpenChange: (open: boolean) => void
  bugId: string; clusterId?: string
}

type NodeType = "bug"|"cluster"|"tag"|"environment"|"component"|"github_issue"|"stack_overflow"|"cause"|"evidence"|"solution"
type RelationshipType =
  | "duplicate_of"|"tagged_with"|"occurs_on"|"affects"|"similar_to"|"fix_reference"|"belongs_to"
  | "related_to"|"cause_of"|"solution_for"|"verified_by"|"contradicts"|"supports"|"disputes"
  | "conflicts"|"complements"|"support"|"condractary"|"complement"|"condractary-dispute"|"conflict"
  | "complementary -support"|"relate"|"SIMILAR"|"DUPLICATE"|"CAUSE_OF"|"EVIDENCE_FOR"|"SOLUTION_FOR"|"RELATE"

interface GraphNode { id: string; type: NodeType; label: string; data: { title?: string; description?: string; url?: string; count?: number; isFocus?: boolean; [key: string]: any }; position?: { x: number; y: number } }
interface GraphEdge { id: string; source: string; target: string; type: RelationshipType; weight: number; label?: string; data?: any; style?: React.CSSProperties }
interface GraphData {
  center?: string; nodes: GraphNode[]; edges: GraphEdge[]
  insights?: { rootCausePatterns: string[]; recurringEnvironments: Array<{environment: string; count: number}>; externalReferences: Array<{type: string; title: string; url: string}> }
}
type RelatedBugItem = { id: string; title: string; url: string; source: string; snippet: string; relevanceScore?: number; created_at?: string }
type LayoutMode = "radial"|"dagre-tb"|"dagre-lr"

const GRAPH_DEPTH = 2
const GRAPH_LIMIT = 25
const NODE_W = 320
const NODE_H = 190

const NODE_CFG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  bug:            { bg: "#193CB9", text: "#fff", dot: "#193CB9", label: "Bug" },
  cluster:        { bg: "#f97316", text: "#fff", dot: "#f97316", label: "Cluster" },
  tag:            { bg: "#0891B2", text: "#fff", dot: "#0891B2", label: "Tag" },
  environment:    { bg: "#0369A1", text: "#fff", dot: "#0369A1", label: "Environment" },
  component:      { bg: "#9A3412", text: "#fff", dot: "#9A3412", label: "Component" },
  github_issue:   { bg: "#44403C", text: "#fff", dot: "#78716C", label: "GitHub Issue" },
  stack_overflow: { bg: "#EA580C", text: "#fff", dot: "#EA580C", label: "Stack Overflow" },
  cause:          { bg: "#DC2626", text: "#fff", dot: "#DC2626", label: "Cause" },
  solution:       { bg: "#16A34A", text: "#fff", dot: "#16A34A", label: "Solution" },
  evidence:       { bg: "#7C3AED", text: "#fff", dot: "#7C3AED", label: "Evidence" },
}
const FOCUS_BG = "#193CB9"

const NODE_ICONS: Record<string, React.ReactNode> = {
  bug:            <Bug className="h-4 w-4" />,
  cluster:        <AlertCircle className="h-4 w-4" />,
  tag:            <Tag className="h-4 w-4" />,
  environment:    <Globe className="h-4 w-4" />,
  component:      <Code className="h-4 w-4" />,
  github_issue:   <Github className="h-4 w-4" />,
  stack_overflow: <MessageSquare className="h-4 w-4" />,
  cause:          <AlertTriangle className="h-4 w-4" />,
  solution:       <CheckCircle2 className="h-4 w-4" />,
  evidence:       <ShieldCheck className="h-4 w-4" />,
}

const EDGE_STYLES: Record<string, { stroke: string; strokeDasharray?: string }> = {
  SIMILAR:      { stroke: "#A1887F", strokeDasharray: "6,4" },
  DUPLICATE:    { stroke: "#8D6E63", strokeDasharray: "6,4" },
  CAUSE_OF:     { stroke: "#DC2626" },
  EVIDENCE_FOR: { stroke: "#7C3AED" },
  SOLUTION_FOR: { stroke: "#16A34A" },
  RELATE:       { stroke: "#A1887F" },
  similar_to:   { stroke: "#A1887F", strokeDasharray: "6,4" },
  duplicate_of: { stroke: "#8D6E63", strokeDasharray: "6,4" },
  solution_for: { stroke: "#16A34A" },
  verified_by:  { stroke: "#7C3AED" },
  cause_of:     { stroke: "#DC2626" },
  contradicts:  { stroke: "#B91C1C", strokeDasharray: "4,3" },
  disputes:     { stroke: "#B91C1C", strokeDasharray: "4,3" },
  conflicts:    { stroke: "#B91C1C", strokeDasharray: "4,3" },
  related_to:   { stroke: "#A1887F" },
  supports:     { stroke: "#B45309" },
  complements:  { stroke: "#B45309" },
  support:      { stroke: "#B45309" },
  condractary:  { stroke: "#B91C1C", strokeDasharray: "4,3" },
  complement:   { stroke: "#B45309" },
  "condractary-dispute":     { stroke: "#B91C1C", strokeDasharray: "4,3" },
  conflict:                  { stroke: "#B91C1C", strokeDasharray: "4,3" },
  "complementary -support":  { stroke: "#B45309" },
  relate:       { stroke: "#A1887F" },
  belongs_to:   { stroke: "#8B5E3C", strokeDasharray: "3,3" },
  fix_reference:{ stroke: "#16A34A", strokeDasharray: "2,2" },
  condractary_dispute: { stroke: "#B91C1C", strokeDasharray: "4,3" },
}

function radialLayout(nodes: Node[], edges: Edge[], centerId: string): Node[] {
  if (!nodes.length) return nodes
  const adj = new Map<string, Set<string>>()
  nodes.forEach((n) => adj.set(n.id, new Set()))
  edges.forEach((e) => { adj.get(e.source)?.add(e.target); adj.get(e.target)?.add(e.source) })

  const rootId = nodes.some((n) => n.id === centerId) ? centerId : nodes[0].id
  const visited = new Set([rootId])
  const rings: string[][] = [[rootId]]
  let frontier = [rootId]

  while (frontier.length) {
    const next: string[] = []
    frontier.forEach((id) => adj.get(id)?.forEach((nb) => { if (!visited.has(nb)) { visited.add(nb); next.push(nb) } }))
    if (next.length) rings.push(next)
    frontier = next
  }

  const orphans = nodes.filter((n) => !visited.has(n.id)).map((n) => n.id)
  if (orphans.length) rings.push(orphans)

  const RADII = [0, 380, 700, 990, 1240, 1460]
  const pos = new Map<string, { x: number; y: number }>()
  pos.set(rootId, { x: 0, y: 0 })

  rings.forEach((ring, ri) => {
    if (ri === 0) return
    const r = RADII[ri] ?? RADII[RADII.length - 1] + (ri - RADII.length + 1) * 240
    const angleStep = (Math.PI * 2) / ring.length
    ring.forEach((id, i) => {
      const angle = angleStep * i - Math.PI / 2
      pos.set(id, { x: Math.cos(angle) * r, y: Math.sin(angle) * r })
    })
  })

  return nodes.map((n) => ({ ...n, position: pos.get(n.id) ?? { x: (Math.random() - 0.5) * 600, y: (Math.random() - 0.5) * 600 } }))
}

function dagreLayout(nodes: Node[], edges: Edge[], dir: "TB" | "LR"): Node[] {
  if (!nodes.length) return nodes
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: dir, nodesep: dir === "TB" ? 80 : 60, ranksep: dir === "TB" ? 180 : 220, marginx: 100, marginy: 100 })
  nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }))
  edges.forEach((e) => { try { g.setEdge(e.source, e.target) } catch {} })
  dagre.layout(g)
  return nodes.map((n) => { const p = g.node(n.id); return { ...n, position: { x: (p?.x ?? 0) - NODE_W / 2, y: (p?.y ?? 0) - NODE_H / 2 } } })
}

function layoutNodes(nodes: Node[], edges: Edge[], mode: LayoutMode, centerId: string) {
  if (mode === "radial") return radialLayout(nodes, edges, centerId)
  return dagreLayout(nodes, edges, mode === "dagre-tb" ? "TB" : "LR")
}

function CustomNode({ data, selected }: { data: any; selected: boolean }) {
  const type: string = data.type || "bug"
  const isFocus = Boolean(data.isFocus)
  const cfg = isFocus ? { bg: FOCUS_BG, text: "#fff", label: "Root Bug" } : (NODE_CFG[type] ?? NODE_CFG.bug)
  const icon = NODE_ICONS[type] ?? <Bug className="h-4 w-4" />
  const conns: number = data._conns ?? 0
  const isSemantic = type === "cause" || type === "solution" || type === "evidence"

  return (
    <div style={{ width: NODE_W }} className="relative">
      {isFocus && (
        <>
          <div className="absolute pointer-events-none animate-pulse" style={{ inset: -4, borderRadius: 20, border: `2px solid ${FOCUS_BG}66`, animationDuration: "2.2s" }} />
        </>
      )}

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          maxHeight: NODE_H,
          boxShadow: selected
            ? `0 0 0 3px ${cfg.bg}, 0 8px 32px -8px ${cfg.bg}66`
            : isFocus
              ? `0 0 0 1.5px ${cfg.bg}66, 0 8px 24px -10px ${cfg.bg}45`
              : `0 2px 12px -3px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.08)`,
          transform: selected ? "scale(1.03)" : "scale(1)",
          transition: "box-shadow 0.2s, transform 0.2s",
        }}
      >
        <FlowHandle type="target"  position={Position.Top}    className="!w-2 !h-2 !border-2 !border-white !opacity-0 !top-[-4px]" />
        <FlowHandle type="target"  position={Position.Left}   id="lt" className="!w-2 !h-2 !border-2 !border-white !opacity-0 !left-[-4px]" />
        <FlowHandle type="source"  position={Position.Right}  id="rs" className="!w-2 !h-2 !border-2 !border-white !opacity-0 !right-[-4px]" />
        <FlowHandle type="source"  position={Position.Bottom} className="!w-2 !h-2 !border-2 !border-white !opacity-0 !bottom-[-4px]" />

        <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: cfg.bg }}>
          <div className="rounded-lg p-1.5 shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
            <div style={{ color: cfg.text }}>{icon}</div>
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest truncate flex-1" style={{ color: cfg.text, opacity: 0.95 }}>
            {cfg.label}
          </span>
          {isFocus ? (
            <div className="rounded-full p-0.5 shrink-0" style={{ background: "rgba(255,255,255,0.25)" }}>
              <Star className="h-3 w-3 fill-white text-white" />
            </div>
          ) : conns > 0 ? (
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold shrink-0" style={{ background: "rgba(255,255,255,0.25)", color: cfg.text }}>
              {conns}
            </span>
          ) : null}
        </div>

        <div
          className="flex flex-col overflow-hidden bg-card px-3 pt-2.5 pb-2.5"
          style={{ maxHeight: `calc(${NODE_H}px - 44px - 4px${isSemantic ? " - 26px" : ""})` }}
        >
          <p className="mb-1.5 overflow-hidden text-[14px] font-semibold leading-snug text-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
            {data.label || "Untitled"}
          </p>
          {data.description && (
            <p className="overflow-hidden text-[11.5px] text-muted-foreground leading-snug [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
              {data.description}
            </p>
          )}
          {(data.confidence || data.impact || (data.upvotes ?? 0) > 0 || (data.downvotes ?? 0) > 0) && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {data.confidence && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground">
                  {Math.round(data.confidence * 100)}% conf
                </span>
              )}
              {data.impact && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                  {data.impact}
                </span>
              )}
              {(data.upvotes ?? 0) > 0 && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5">
                  <ArrowUp className="h-2.5 w-2.5" />{data.upvotes}
                </span>
              )}
              {(data.downvotes ?? 0) > 0 && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center gap-0.5">
                  <ArrowDown className="h-2.5 w-2.5" />{data.downvotes}
                </span>
              )}
            </div>
          )}
        </div>

        {isSemantic && (
          <div className="px-3 py-1 bg-card" style={{ borderTop: `1px solid ${cfg.bg}28` }}>
            <span
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold tracking-wide"
              style={{ background: `${cfg.bg}18`, color: cfg.bg }}
            >
              {type === "cause"    && <AlertTriangle className="h-2.5 w-2.5" />}
              {type === "solution" && <CheckCircle2  className="h-2.5 w-2.5" />}
              {type === "evidence" && <ShieldCheck   className="h-2.5 w-2.5" />}
              {type === "cause" ? "Root Cause" : type === "solution" ? "Solution" : "Evidence"}
            </span>
          </div>
        )}

        <div style={{ height: 4, background: cfg.bg }} />
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  default: CustomNode, bug: CustomNode, cause: CustomNode, solution: CustomNode,
  evidence: CustomNode, github_issue: CustomNode, stack_overflow: CustomNode,
  cluster: CustomNode, tag: CustomNode, environment: CustomNode, component: CustomNode,
}

function CustomBadgeEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, label, data }: EdgeProps) {
  const [hovered, setHovered] = React.useState(false)
  const [edgePath, lx, ly] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })

  const et = (data?.type as string) || ""
  const isSimilar = ["SIMILAR", "similar_to"].includes(et)
  const isRed    = ["contradicts","condractary","condractary-dispute","conflict","disputes","conflicts"].includes(et)
  const isGreen  = ["solution_for","verified_by","fix_reference","SOLUTION_FOR"].includes(et)
  const isViolet = ["supports","complements","support","complement","complementary -support","belongs_to"].includes(et)
  const isPurple = ["EVIDENCE_FOR","verified_by","evidence"].includes(et)
  const dx = targetX - sourceX
  const dy = targetY - sourceY
  const len = Math.max(Math.hypot(dx, dy), 1)
  const labelX = isSimilar ? sourceX + dx * 0.68 + (-dy / len) * 14 : lx
  const labelY = isSimilar ? sourceY + dy * 0.68 + (dx / len) * 14 : ly

  const badgeCls = cn(
    "inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full border font-bold backdrop-blur-sm shadow-md whitespace-nowrap transition-transform duration-100 cursor-default select-none",
    hovered ? "scale-110" : "",
    isRed    ? "bg-red-700    text-white border-red-800" :
    isGreen  ? "bg-green-700  text-white border-green-800" :
    isViolet ? "bg-amber-700  text-white border-amber-800" :
    isPurple ? "bg-violet-700 text-white border-violet-800" :
               "bg-[#FAF6F0] dark:bg-[#2C2720] text-muted-foreground border-border"
  )

  const strokeColor = (style as any)?.stroke ?? "#94a3b8"

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} id={id} style={{
        ...style,
        strokeWidth: hovered ? (style.strokeWidth as number ?? 2) + 1 : style.strokeWidth,
        filter: hovered ? `drop-shadow(0 0 5px ${strokeColor}bb)` : undefined,
        transition: "stroke-width 0.15s, filter 0.15s",
      }} />
      <EdgeLabelRenderer>
        <div
          style={{ position: "absolute", transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`, pointerEvents: "all" }}
          className="nodrag nopan z-50"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {label ? <span className={badgeCls}>{label}</span> : null}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const edgeTypes = { custom: CustomBadgeEdge }

const graphCache = new Map<string, GraphData>()

function mergeSOIntoGraph(graph: GraphData, items: RelatedBugItem[], fallback: string): GraphData {
  const soItems = items.filter((i) => i.source === "stack_overflow_question")
  if (!soItems.length) return graph
  const centerId = graph.center ?? fallback
  const nodeSet = new Set(graph.nodes.map((n) => n.id))
  const edgeSet = new Set(graph.edges.map((e) => e.id))
  const nodes = [...graph.nodes], edges = [...graph.edges]
  soItems.forEach((item) => {
    if (!nodeSet.has(item.id)) {
      nodes.push({ id: item.id, type: "stack_overflow", label: item.title, data: { title: item.title, description: item.snippet, type: "stack_overflow", url: item.url, created_at: item.created_at ?? new Date().toISOString() } })
      nodeSet.add(item.id)
    }
    const eid = `so-${centerId}-${item.id}`
    if (!edgeSet.has(eid)) {
      const s = item.relevanceScore ?? 0.5
      edges.push({ id: eid, source: centerId, target: item.id, type: "SIMILAR", weight: s, label: `Similar ${Math.round(s * 100)}%`, data: { created_at: item.created_at ?? new Date().toISOString() } })
      edgeSet.add(eid)
    }
  })
  return { ...graph, center: centerId, nodes, edges }
}

function LayoutToolbar({ layout, onLayout, onFitView, nodeCount, edgeCount }: {
  layout: LayoutMode; onLayout: (m: LayoutMode) => void; onFitView: () => void; nodeCount: number; edgeCount: number
}) {
  const opts = [
    { mode: "radial"   as LayoutMode, icon: <Network className="h-3.5 w-3.5" />,  label: "Radial" },
    { mode: "dagre-tb" as LayoutMode, icon: <Rows3 className="h-3.5 w-3.5" />,    label: "Tree ↓" },
    { mode: "dagre-lr" as LayoutMode, icon: <Columns3 className="h-3.5 w-3.5" />, label: "Tree →" },
  ]
  return (
    <div className="flex items-center gap-0.5 rounded-2xl border border-border bg-card shadow-2xl shadow-black/15 px-2 py-1.5 mb-3">
      <span className="text-[10px] font-bold text-muted-foreground px-2 uppercase tracking-widest">Layout</span>
      <div className="w-px h-4 bg-border mx-1" />
      {opts.map(({ mode, icon, label }) => (
        <button
          key={mode}
          onClick={() => onLayout(mode)}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all duration-150",
            layout === mode ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:bg-muted"
          )}
        >
          {icon}{label}
        </button>
      ))}
      <div className="w-px h-4 bg-border mx-1" />
      <button
        onClick={onFitView}
        title="Fit view (F)"
        className="flex items-center gap-1 px-2 py-1 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </button>
      <div className="w-px h-4 bg-border mx-1" />
      <span className="text-[10px] font-semibold text-muted-foreground px-1.5 tabular-nums">{nodeCount}N · {edgeCount}E</span>
    </div>
  )
}

function LegendPanel() {
  const [open, setOpen] = React.useState(true)
  return (
    <div className="rounded-xl border border-primary/20 bg-card shadow-xl overflow-hidden w-[220px]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 w-full px-3 hover:bg-muted transition-colors"
      >
        <GitBranch className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-bold text-foreground flex-1">Node Types</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-border/60 space-y-1.5">
          {Object.entries(NODE_CFG).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cfg.dot }} />
              <span className="text-[11px] text-muted-foreground">{cfg.label}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-border/60 space-y-0.5 text-[10px] text-muted-foreground">
            <div>Click node → highlight connections</div>
            <div><kbd className="bg-muted px-1 rounded text-[9px]">F</kbd> fit all in view</div>
          </div>
        </div>
      )}
    </div>
  )
}

function InsightsPanel({ graphData }: { graphData: GraphData | null }) {
  const [open, setOpen] = React.useState(true)
  if (!graphData?.insights) return null
  const { rootCausePatterns, recurringEnvironments } = graphData.insights
  if (!rootCausePatterns.length && !recurringEnvironments.length) return null
  return (
    <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden w-[230px]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-muted transition-colors"
      >
        <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-[11px] font-bold text-foreground flex-1">AI Insights</span>
        {open ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-2 border-t border-border/60 space-y-3">
          {rootCausePatterns.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1.5">Patterns</p>
              <ul className="space-y-1">
                {rootCausePatterns.map((p, i) => (
                  <li key={i} className="flex gap-1.5 text-[11px] text-muted-foreground leading-snug">
                    <span className="text-primary mt-px shrink-0">•</span><span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {recurringEnvironments.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-1.5">Environments</p>
              <div className="flex flex-wrap gap-1">
                {recurringEnvironments.map((e, i) => (
                  <span key={i} className="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded-full px-1.5 py-0.5 font-semibold">
                    {e.environment} · {e.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-xl border border-primary/20 bg-card shadow-lg px-3 w-[220px] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-colors">
      <ScanSearch className="h-4 w-4 text-primary shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search nodes…"
        className="bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground flex-1 min-w-0"
      />
      {value && (
        <button onClick={() => onChange("")} className="text-muted-foreground hover:text-primary transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

interface InnerProps {
  nodes: Node[]; edges: Edge[]; onNodesChange: any; onEdgesChange: any
  onNodeClick: (e: React.MouseEvent, n: Node) => void; onPaneClick: () => void; onInit: (i: ReactFlowInstance) => void
  graphData: GraphData | null; loading: boolean; error: string | null; onRetry: () => void
  layoutMode: LayoutMode; onChangeLayout: (m: LayoutMode) => void
  searchQuery: string; onSearchChange: (q: string) => void
  timeTravelPercent: number; onTimeTravelChange: (p: number) => void
  milestones: number[]; minTime: number; maxTime: number; isPlaying: boolean; onPlayPause: () => void
}

function InnerGraph(p: InnerProps) {
  const { fitView } = useReactFlow()

  React.useEffect(() => {
    if (!p.nodes.length) return
    const t = setTimeout(() => fitView({ padding: 0.18, duration: 700 }), 80)
    return () => clearTimeout(t)
  }, [p.nodes.length, p.layoutMode, fitView])

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.key === "f" || e.key === "F") && !e.metaKey && !e.ctrlKey)
        fitView({ padding: 0.15, duration: 600 })
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [fitView])

  if (p.loading) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 bg-background">
      <div className="flex flex-col items-center gap-4 px-8 py-7">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-foreground text-[15px]">Building relationship graph</p>
          <p className="text-[13px] text-muted-foreground mt-0.5">Analysing connections...</p>
        </div>
      </div>
    </div>
  )

  if (p.error) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-background p-8">
      <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
        <AlertCircle className="h-7 w-7 text-red-500" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-foreground">Failed to load graph</p>
        <p className="text-[13px] text-red-500 mt-1">{p.error}</p>
      </div>
      <Button size="sm" variant="default" onClick={p.onRetry}>Try again</Button>
    </div>
  )

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 relative bg-muted/30">
        <ReactFlow
          nodes={p.nodes} edges={p.edges}
          onNodesChange={p.onNodesChange} onEdgesChange={p.onEdgesChange}
          onNodeClick={p.onNodeClick} onPaneClick={p.onPaneClick} onInit={p.onInit}
          nodeTypes={nodeTypes} edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          minZoom={0.05} maxZoom={3}
          defaultEdgeOptions={{ type: "custom" }}
          className="h-full w-full"
          style={{ background: "transparent" }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24} size={1.5}
            color="#C8B9A5"
            className="opacity-50 dark:opacity-20"
          />

          <Controls
            showInteractive={false}
            className="!rounded-xl !border !border-border !shadow-lg !bg-card"
            style={{ bottom: 88 }}
          />

          <MiniMap
            nodeColor={(n) => NODE_CFG[n.data?.type as string]?.dot ?? "#A1887F"}
            maskColor="rgba(0,0,0,0.07)"
            pannable zoomable
            className="!rounded-xl !border !border-border !shadow-lg !bg-card"
            style={{ bottom: 88, right: 8 }}
          />

          <Panel position="top-left" className="flex flex-col gap-2 mt-2">
            <SearchBar value={p.searchQuery} onChange={p.onSearchChange} />
            <InsightsPanel graphData={p.graphData} />
          </Panel>

          <Panel position="top-right" className="mt-2">
            <LegendPanel />
          </Panel>

          <Panel position="bottom-center">
            <LayoutToolbar
              layout={p.layoutMode}
              onLayout={p.onChangeLayout}
              onFitView={() => fitView({ padding: 0.15, duration: 600 })}
              nodeCount={p.nodes.length}
              edgeCount={p.edges.length}
            />
          </Panel>
        </ReactFlow>
      </div>

      {p.graphData && p.graphData.nodes.length > 0 && (
        <TimeTravelBar
          percent={p.timeTravelPercent} onPercentChange={p.onTimeTravelChange}
          milestones={p.milestones} minTime={p.minTime} maxTime={p.maxTime}
          isPlaying={p.isPlaying} onPlayPause={p.onPlayPause}
        />
      )}
    </div>
  )
}

export function BugGraphDialog({ open, onOpenChange, bugId, clusterId }: BugGraphDialogProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [loading, setLoading]   = React.useState(false)
  const [error, setError]       = React.useState<string | null>(null)
  const [selectedNode, setSelectedNode] = React.useState<Node | null>(null)
  const [graphData, setGraphData]       = React.useState<GraphData | null>(null)
  const [rfi, setRfi]           = React.useState<ReactFlowInstance | null>(null)
  const [saving, setSaving]     = React.useState(false)
  const [saveOpen, setSaveOpen] = React.useState(false)
  const [saveTitle, setSaveTitle]       = React.useState("")
  const [savePublic, setSavePublic]     = React.useState(false)
  const [ttPct, setTtPct]       = React.useState(100)
  const [layout, setLayout]     = React.useState<LayoutMode>("radial")
  const [search, setSearch]     = React.useState("")
  const router = useRouter()
  const isCluster = Boolean(clusterId)

  React.useEffect(() => {
    if (open && bugId) {
      setSelectedNode(null)
      setError(null)
      setTtPct(100)
      setSearch("")
      setGraphData(null)
      setNodes([])
      setEdges([])
      setLoading(true)
      fetchGraph()
    }
  }, [open, bugId])

  async function fetchGraph() {
    const cached = graphCache.get(bugId)
    if (cached?.nodes?.length) {
      setGraphData(cached)
      setLoading(false)
      return
    }
    try {
      setLoading(true); setError(null)
      const res = await fetch(`/api/bugs/${bugId}/graph?depth=${GRAPH_DEPTH}&limit=${GRAPH_LIMIT}`)
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.error || `Error ${res.status}`) }
      const raw = await res.json()
      const graph: GraphData = raw.data ?? raw
      if (!graph?.nodes?.length) { setError("Graph returned no data."); return }

      graphCache.set(bugId, graph)
      setGraphData(graph)
      setLoading(false)

      void fetch(`/api/bugs/${bugId}/related`, { cache: "no-store" })
        .then(async (rel) => {
          if (!rel.ok) return
          const rj = await rel.json()
          const merged = mergeSOIntoGraph(graph, Array.isArray(rj?.results) ? rj.results : [], bugId)
          graphCache.set(bugId, merged)
          setGraphData(merged)
        })
        .catch(() => {})
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); setNodes([]); setEdges([]) }
    finally { setLoading(false) }
  }

  const getTime = React.useCallback((v?: string | null) => v ? new Date(v).getTime() : 0, [])

  const { timestamps, minT, maxT, milestones } = React.useMemo(() => {
    const ts: number[] = []
    graphData?.nodes?.forEach((n) => { const t = getTime(n.data?.created_at); if (t > 0) ts.push(t) })
    graphData?.edges?.forEach((e) => { const t = getTime(e.data?.created_at); if (t > 0) ts.push(t) })
    return { timestamps: ts, minT: ts.length ? Math.min(...ts) : 0, maxT: ts.length ? Math.max(...ts) : 0, milestones: [...new Set(ts)].sort((a,b) => a-b) }
  }, [graphData, getTime])

  const selTime = React.useMemo(() => {
    if (!timestamps.length) return Infinity
    return minT + Math.max(maxT - minT, 1) * (ttPct / 100)
  }, [minT, maxT, ttPct, timestamps.length])

  const { isPlaying, toggle: togglePlay } = useTimeTravelPlayback(ttPct, setTtPct, minT, maxT, 10)

  const connCounts = React.useMemo(() => {
    const m = new Map<string, number>()
    graphData?.edges?.forEach((e) => { m.set(e.source, (m.get(e.source) ?? 0) + 1); m.set(e.target, (m.get(e.target) ?? 0) + 1) })
    return m
  }, [graphData])

  function buildAndSet(graph: GraphData, mode: LayoutMode, st: number) {
    const centerId = graph.center ?? bugId
    const fNodes: Node[] = graph.nodes.map((n) => ({
      id: n.id, type: n.type,
      position: n.position ?? { x: 0, y: 0 },
      data: { ...n.data, type: n.type, label: n.label, _conns: connCounts.get(n.id) ?? 0, isFocus: n.data?.isFocus ?? n.id === centerId },
      style: { opacity: timeToOpacity(getTime(n.data?.created_at), st), transition: "opacity 0.3s" },
    }))
    const fEdges: Edge[] = graph.edges.map((e, i) => {
      const base = EDGE_STYLES[e.type] ?? { stroke: "#94a3b8" }
      const w = e.weight ?? 0.5
      return {
        id: e.id || `e${i}`, source: e.source, target: e.target, type: "custom",
        label: e.label ?? e.type?.replace(/_/g, " ") ?? "related",
        animated: ["SOLUTION_FOR","CAUSE_OF","solution_for","cause_of","contradicts","condractary","conflict"].includes(e.type),
        markerEnd: { type: MarkerType.ArrowClosed, color: base.stroke, width: 14, height: 14 },
        style: { ...base, strokeWidth: Math.max(1.5, w * 2.5), opacity: timeToOpacity(getTime(e.data?.created_at), st) * 0.85, transition: "opacity 0.3s", ...e.style },
        data: { weight: w, type: e.type, ...(e.data ?? {}) },
      }
    })
    setNodes(layoutNodes(fNodes, fEdges, mode, centerId))
    setEdges(fEdges)
  }

  React.useEffect(() => {
    if (graphData?.nodes?.length && Array.isArray(graphData.edges)) buildAndSet(graphData, layout, selTime)
  }, [graphData, selTime])

  React.useEffect(() => {
    if (!graphData?.nodes?.length) return
    buildAndSet(graphData, layout, selTime)
  }, [layout])

  React.useEffect(() => {
    if (!nodes.length) return
    if (!search.trim()) {
      if (graphData) buildAndSet(graphData, layout, selTime)
      return
    }
    const q = search.toLowerCase()
    const hits = new Set<string>()
    nodes.forEach((n) => {
      if (String(n.data?.label ?? "").toLowerCase().includes(q) || String(n.data?.description ?? "").toLowerCase().includes(q)) hits.add(n.id)
    })
    setNodes((nds) => nds.map((n) => ({
      ...n,
      selected: hits.has(n.id),
      style: {
        ...n.style,
        opacity: hits.has(n.id) ? 1 : 0.12,
        boxShadow: hits.has(n.id) ? `0 0 0 3px hsl(var(--primary) / 0.35), 0 10px 28px -12px hsl(var(--primary) / 0.65)` : undefined,
      },
    })))
    setEdges((eds) => eds.map((e) => ({ ...e, style: { ...e.style, opacity: hits.has(e.source) || hits.has(e.target) ? 0.8 : 0.05 } })))
  }, [search, nodes.length])

  const onNodeClick = React.useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    const conn = new Set([node.id])
    setEdges((eds) => eds.map((e) => {
      const c = e.source === node.id || e.target === node.id
      if (c) { conn.add(e.source); conn.add(e.target) }
      return { ...e, style: { ...e.style, opacity: c ? 1 : 0.07 } }
    }))
    setNodes((nds) => nds.map((n) => ({
      ...n, selected: n.id === node.id,
      style: { ...n.style, opacity: conn.has(n.id) ? 1 : 0.2 },
    })))
    rfi?.fitView({ nodes: [...conn].map((id) => ({ id })), padding: 0.3, duration: 500, maxZoom: 1.4 })
  }, [setNodes, setEdges, rfi])

  const onPaneClick = React.useCallback(() => {
    setSelectedNode(null)
    if (graphData) buildAndSet(graphData, layout, selTime)
  }, [graphData, layout, selTime])

  const handleLayout = React.useCallback((m: LayoutMode) => { setSearch(""); setSelectedNode(null); setLayout(m) }, [])

  async function handleSave() {
    try {
      setSaving(true)
      const obj = rfi?.toObject() ?? { nodes, edges }
      if (!obj.nodes?.length || !obj.edges) throw new Error("Graph is not ready to save yet")
      const res = await fetch("/api/workspaces", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: saveTitle.trim() || `Graph – Bug #${bugId.slice(0,8)}`, nodes: obj.nodes, edges: obj.edges, origin_bug_id: bugId, origin_cluster_id: clusterId ?? null, is_public: savePublic }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const d = await res.json()
      if (d.xpEarned) { toast.success(`+${d.xpEarned} BugXP – Graph saved!`); window.dispatchEvent(new CustomEvent("hunter:xp", { detail: { xp: d.xpEarned } })) }
      setSaveOpen(false); onOpenChange(false)
      setTimeout(() => router.push(`/workspaces/${d.graph.id}`), 150)
    } catch (e: any) { const message = e?.message || "Failed to save graph"; setError(message); toast.error(message) }
    finally { setSaving(false) }
  }

  const nd = selectedNode?.data as any

  React.useEffect(() => {
    if (open) { document.body.style.overflow = "hidden" }
    else { document.body.style.overflow = "" }
    return () => { document.body.style.overflow = "" }
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !saveOpen && !selectedNode) onOpenChange(false) }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [open, saveOpen, selectedNode, onOpenChange])

  return (
    <>
      {open && typeof window !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 bg-black/40 z-[9998]" aria-hidden="true" />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Bug Relationship Graph"
            className="fixed inset-0 z-[9999] flex flex-col overflow-hidden bg-background"
          >
            <div className="flex items-center gap-3 px-5 py-3 bg-card border-b border-border shrink-0 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <GitBranch className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 id="graph-dialog-title" className="text-[14px] font-bold text-foreground leading-none">
                  Bug Relationship Graph
                </h1>
                {graphData && !loading && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{graphData.nodes.length} nodes · {graphData.edges.length} connections</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="decorations"
                  size="default"
                  className="px-4"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-3.5 w-3.5" />
                  Close
                </Button>
                <Button
                  variant="decorations"
                  size="default"
                  className="px-4"
                  onClick={() => { setSaveTitle(`Graph – Bug #${bugId.slice(0,8)}`); setSavePublic(false); setSaveOpen(true) }}
                  disabled={saving || !nodes.length}
                >
                  {saving ? <div className="h-3.5 w-3.5 rounded-full border-2 border-current/30 border-t-current" style={{ animation: "spin 0.9s linear infinite" }} /> : <Save className="h-3.5 w-3.5" />}
                  Save diagram
                </Button>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <ReactFlowProvider>
                <InnerGraph
                  nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                  onNodeClick={onNodeClick} onPaneClick={onPaneClick} onInit={setRfi}
                  graphData={graphData} loading={loading} error={error} onRetry={() => { setError(null); fetchGraph() }}
                  layoutMode={layout} onChangeLayout={handleLayout}
                  searchQuery={search} onSearchChange={setSearch}
                  timeTravelPercent={ttPct} onTimeTravelChange={setTtPct}
                  milestones={milestones} minTime={minT} maxTime={maxT}
                  isPlaying={isPlaying} onPlayPause={togglePlay}
                />
              </ReactFlowProvider>
            </div>
          </div>
        </>,
        document.body
      )}

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Save className="h-5 w-5" />Save relationship diagram</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="st" className="text-sm font-semibold">Title</Label>
              <input id="st" value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="e.g. Crash on divide by zero – graph"
                className="w-full border-2 border-border focus:border-primary rounded-xl px-3 py-2.5 text-sm outline-none transition-colors bg-card dark:focus:border-primary" />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Visibility</Label>
              <RadioGroup value={savePublic ? "public" : "private"} onValueChange={(v) => setSavePublic(v === "public")} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="private" id="vp" />
                  <Label htmlFor="vp" className="cursor-pointer text-sm">{isCluster ? "Cluster private" : "Private – only you"}</Label>
                </div>
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="public" id="vb" />
                  <Label htmlFor="vb" className="cursor-pointer text-sm">{isCluster ? "Cluster public" : "Public – anyone can view"}</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="decorations" size="default" className="px-4" onClick={() => setSaveOpen(false)}>Close</Button>
            <Button variant="decorations" size="default" className="px-4" onClick={handleSave} disabled={saving}>
              {saving ? <div className="h-4 w-4 rounded-full border-2 border-current/30 border-t-current" style={{ animation: "spin 0.9s linear infinite" }} /> : <Save className="h-4 w-4" />}
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedNode} onOpenChange={(o) => !o && setSelectedNode(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 pr-6">
              {nd?.type && (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ background: NODE_CFG[nd.type]?.dot ?? FOCUS_BG }}>
                  {NODE_ICONS[nd.type] ?? <Bug className="h-4 w-4" />}
                </div>
              )}
              <div className="min-w-0">
                <DialogTitle className="truncate text-[15px]">{nd?.label || "Node Details"}</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {NODE_CFG[nd?.type]?.label ?? nd?.type?.replace(/_/g, " ")}
                  {(nd?._conns ?? 0) > 0 && ` · ${nd._conns} connections`}
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {nd?.description && (
              <div className="text-[13px] text-muted-foreground bg-muted/50 p-3 rounded-xl leading-relaxed prose prose-sm dark:prose-invert max-w-none break-words"
                dangerouslySetInnerHTML={{ __html: nd.description }} />
            )}
            <div className="flex flex-wrap gap-2">
              {nd?.confidence && (
                <span className="text-[12px] bg-primary/10 text-primary rounded-full px-2.5 py-1 font-semibold">
                  {Math.round(nd.confidence * 100)}% confidence
                </span>
              )}
              {nd?.impact && (
                <span className="text-[12px] bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full px-2.5 py-1 font-semibold">
                  {nd.impact} impact
                </span>
              )}
            </div>
            {nd?.url && (
              <Button className="w-full gap-2" asChild>
                <a href={nd.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />Open Resource
                </a>
              </Button>
            )}
            {selectedNode && (
              <div className="border-t pt-3 grid grid-cols-2 text-[10px] text-muted-foreground font-mono">
                <span>ID: {selectedNode.id.slice(0,20)}…</span>
                <span className="text-right">{Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
