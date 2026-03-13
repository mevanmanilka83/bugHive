export const WORKSPACE_VIEW_TYPE_VALUES = [
  "timeline",
  "bar",
  "line",
  "stacked-area",
  "heatmap",
  "network",
  "scatter",
  "donut",
  "kanban",
  "hierarchy",
] as const

export type WorkspaceViewType = (typeof WORKSPACE_VIEW_TYPE_VALUES)[number]

export type WorkspaceViewTypeDefinition = {
  value: WorkspaceViewType
  label: string
  whatToShow: string[]
  dataSources: string[]
  usage: string
  notes?: string[]
}

export const WORKSPACE_VIEW_TYPE_CATALOG: WorkspaceViewTypeDefinition[] = [
  {
    value: "timeline",
    label: "Linear / Timeline View",
    whatToShow: [
      "Bugs ordered by created_at and resolved_at/closed_at when available",
      "Markers for status changes when lifecycle events are tracked",
    ],
    dataSources: [
      "bugs.created_at",
      "bugs.status",
      "bugs.closed_at or bugs.resolved_at if available",
      "/api/overview recentBugs for a lightweight slice",
    ],
    usage: "How did this incident or release evolve over time?",
    notes: [
      "Use created_at now; add resolved_at/closed_at or status-history tracking for a full timeline.",
    ],
  },
  {
    value: "bar",
    label: "Bar Chart View",
    whatToShow: [
      "Bugs by severity",
      "Bugs by module or component",
      "Bugs by team or owner when tracked",
    ],
    dataSources: [
      "bugs.priority",
      "bugs.cluster_id",
      "tags or component field",
      "assigned owner/team fields when present",
    ],
    usage: "Which areas or teams are carrying the most bug load right now?",
  },
  {
    value: "line",
    label: "Line Chart View",
    whatToShow: [
      "Opened vs resolved per day or week",
      "Backlog size over time",
    ],
    dataSources: [
      "bugs.created_at",
      "bugs.closed_at or bugs.resolved_at when available",
      "rolled-up day/week aggregates",
    ],
    usage: "Are we winning or losing against incoming bugs?",
    notes: [
      "Full opened-vs-resolved and backlog curves need close/resolution timestamps.",
    ],
  },
  {
    value: "stacked-area",
    label: "Stacked Area View",
    whatToShow: [
      "Total open bugs over time",
      "Severity or product-area mix over time",
    ],
    dataSources: [
      "bugs.created_at",
      "bugs.priority",
      "tags or component field",
      "Recharts AreaChart via ChartContainer",
    ],
    usage: "What is the total load and work mix over time?",
  },
  {
    value: "heatmap",
    label: "Heatmap View",
    whatToShow: [
      "Rows as components or clusters",
      "Columns as time buckets",
      "Cells as bug count or average severity",
    ],
    dataSources: [
      "clusters",
      "bugs",
      "tags",
      "aggregates by cluster/component and week",
    ],
    usage: "Where are the persistent hotspots?",
  },
  {
    value: "network",
    label: "Network / Graph View",
    whatToShow: [
      "Nodes for bugs, causes, fixes, evidence, and external links",
      "Edges for CAUSE_OF, SOLUTION_FOR, EVIDENCE_FOR, DUPLICATE, and SIMILAR",
    ],
    dataSources: [
      "bug_relationships",
      "buildBugSubgraph",
      "BugGraphDialog",
    ],
    usage: "How are specific bugs, root causes, and fixes connected?",
  },
  {
    value: "scatter",
    label: "Scatter View",
    whatToShow: [
      "Severity or effort on X axis",
      "Resolution time or impact on Y axis",
    ],
    dataSources: [
      "bugs.priority",
      "bugs.created_at",
      "bugs.closed_at or bugs.resolved_at when available",
      "bugs.upvotes_count",
    ],
    usage: "Which high-severity bugs are taking too long or are under-invested?",
  },
  {
    value: "donut",
    label: "Pie / Donut View",
    whatToShow: [
      "Percentage of bugs by status",
      "Percentage of bugs by visibility",
    ],
    dataSources: [
      "bugs.status",
      "bugs.visibility",
    ],
    usage: "What is the quick health snapshot of the bug pool?",
  },
  {
    value: "kanban",
    label: "Kanban / Status Flow View",
    whatToShow: [
      "Columns for Open, Triaged, In Progress, Resolved, Verified",
      "Bug cards grouped by current status",
    ],
    dataSources: [
      "bugs.status",
      "filtered bug lists",
    ],
    usage: "What is the day-to-day triage and progress state?",
  },
  {
    value: "hierarchy",
    label: "Hierarchy View",
    whatToShow: [
      "Root node as root cause or cluster",
      "Child bugs and leaf fixes or solution details",
    ],
    dataSources: [
      "clusters and cluster membership",
      "bug_solution_details",
      "workspace nodes and edges",
    ],
    usage: "For this root cause or cluster, what are all the associated bugs and fixes?",
  },
]

export const WORKSPACE_VIEW_TYPE_LOOKUP = Object.fromEntries(
  WORKSPACE_VIEW_TYPE_CATALOG.map((definition) => [definition.value, definition])
) as Record<WorkspaceViewType, WorkspaceViewTypeDefinition>

export function normalizeWorkspaceViewType(value: string | null | undefined): WorkspaceViewType {
  const normalized = (value ?? "").trim().toLowerCase()
  return (WORKSPACE_VIEW_TYPE_VALUES as readonly string[]).includes(normalized)
    ? (normalized as WorkspaceViewType)
    : "network"
}