"use client"

import * as React from "react"
import { IconLayoutGrid, IconList, IconEye, IconChartArea, IconBulb } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { SolutionDialog } from "@/components/bugs/solutions/BugReportSolutionDialog"
import { GraphDialog } from "@/components/bugs/GraphDialog"
import { ChartConfig } from "@/components/ui/chart"
import { getSolutionsByCluster } from "@/app/actions/bug/BugSolution"
import { toast } from "sonner"

interface ClusterBugsListProps {
  clusterId: string
  userId: string
}

export function ClusterBugsList({ clusterId, userId }: ClusterBugsListProps) {
  const [bugs, setBugs] = React.useState<any[]>([])
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [selectedBug, setSelectedBug] = React.useState<any | null>(null)
  const [detailsLoading, setDetailsLoading] = React.useState(false)
  const [graphOpen, setGraphOpen] = React.useState(false)
  const [solutionOpen, setSolutionOpen] = React.useState(false)
  const [solutions, setSolutions] = React.useState<any[]>([])
  const [solutionsLoading, setSolutionsLoading] = React.useState(false)
  const [chartData, setChartData] = React.useState<Array<{ date: string; count: number }>>([])
  const [loading, setLoading] = React.useState(false)
  const [clusterOwnerId, setClusterOwnerId] = React.useState<string | null>(null)

  const chartConfig: ChartConfig = {
    count: {
      label: "Solutions",
      color: "var(--primary)",
    },
  }

  const fetchBugs = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/bugs?cluster_id=${clusterId}&limit=200`)
      if (!res.ok) return
      const data = await res.json()
      const items: any[] = data?.bugs || []
      setBugs(items)

      // Fetch cluster info to get owner_id
      const clusterRes = await fetch(`/api/clusters/${clusterId}`)
      if (clusterRes.ok) {
        const clusterData = await clusterRes.json()
        setClusterOwnerId(clusterData?.cluster?.owner_id || null)
      }

      // Fetch solutions for bugs in this cluster and build chart data
      const solutionsResult = await getSolutionsByCluster(clusterId)
      const solutions: any[] = solutionsResult?.solutions || []

      // Build chart data from solutions and convert to cumulative
      const byDay = new Map<string, number>()
      for (const solution of solutions) {
        const createdAt = solution.created_at || solution.createdAt || solution.createdat
        const d = createdAt ? new Date(createdAt) : new Date()
        const key = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10)
        byDay.set(key, (byDay.get(key) || 0) + 1)
      }
      const sorted = Array.from(byDay.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
      
      // Convert to cumulative (running total) - starts from flow (low) to high
      let cumulative = 0
      const cumulativeData = sorted.map(([date, count]) => {
        cumulative += count
        return { date, count: cumulative }
      })
      
      setChartData(cumulativeData)
    } finally {
      setLoading(false)
    }
  }, [clusterId])

  React.useEffect(() => {
    fetchBugs()
  }, [fetchBugs])

  React.useEffect(() => {
    const onCreated = () => fetchBugs()
    const onSolutionCreated = (event: Event) => {
      fetchBugs()
      // Refresh solutions if the solution dialog is open for the bug that got a new solution
      const customEvent = event as CustomEvent
      if (customEvent.detail?.bugId && selectedBug?.id === customEvent.detail.bugId) {
        void fetchSolutions(customEvent.detail.bugId)
      }
    }
    window.addEventListener("bug:created", onCreated as EventListener)
    window.addEventListener("solution:created", onSolutionCreated as EventListener)
    return () => {
      window.removeEventListener("bug:created", onCreated as EventListener)
      window.removeEventListener("solution:created", onSolutionCreated as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBugs, selectedBug?.id])

  async function openBugDetails(bugId: string) {
    try {
      setDetailsLoading(true)
      setDetailsOpen(true)
      const res = await fetch(`/api/bugs/${bugId}/reports`)
      if (res.ok) {
        const data = await res.json()
        setSelectedBug(data?.bug || null)
        return
      }
      const listRes = await fetch(`/api/bugs?cluster_id=${clusterId}&limit=200`)
      if (listRes.ok) {
        const list = await listRes.json()
        const all: any[] = list?.bugs || []
        const found = all.find((b) => b.id === bugId)
        setSelectedBug(found || null)
        return
      }
      setSelectedBug(null)
    } finally {
      setDetailsLoading(false)
    }
  }

  async function fetchSolutions(bugId: string) {
    try {
      setSolutionsLoading(true)
      const res = await fetch(`/api/bugs/${bugId}/solutions`)
      if (!res.ok) {
        setSolutions([])
        return
      }
      const data = await res.json()
      setSolutions(Array.isArray(data?.solutions) ? data.solutions : [])
    } finally {
      setSolutionsLoading(false)
    }
  }

  async function updateBugStatus(bugId: string, newStatus: string) {
    try {
      // Use the reports endpoint - the handler will validate cluster access
      const res = await fetch(`/api/bugs/${bugId}/reports`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        // Try to extract error message from response
        let errorMessage = 'Failed to update bug status'
        try {
          const errorData = await res.json()
          errorMessage = errorData?.error || errorData?.message || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = res.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      toast.success(`Bug status updated to ${newStatus}`)
      
      // Update local state
      setBugs(prevBugs => prevBugs.map(b => 
        b.id === bugId ? { ...b, status: newStatus } : b
      ))
      
      // Update selected bug if it's the one being updated
      if (selectedBug?.id === bugId) {
        setSelectedBug({ ...selectedBug, status: newStatus })
      }
      
      // Refresh bugs list to ensure consistency
      await fetchBugs()
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bug:updated', { detail: { bugId, status: newStatus } }))
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update bug status')
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        {loading ? (
          <Skeleton className="h-5 w-24" />
        ) : (
          <p className="text-sm text-muted-foreground">
            {bugs.length} bug{bugs.length !== 1 ? 's' : ''} found
          </p>
        )}
        <div className="flex items-center gap-1">
          <button 
            type="button" 
            aria-label="Grid view" 
            onClick={() => setViewMode("grid")} 
            className={`rounded-md p-1.5 border transition-colors ${viewMode === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <IconLayoutGrid className="size-4" />
          </button>
          <button 
            type="button" 
            aria-label="List view" 
            onClick={() => setViewMode("list")} 
            className={`rounded-md p-1.5 border transition-colors ${viewMode === "list" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <IconList className="size-4" />
          </button>
        </div>
      </div>
      <div className={`*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid gap-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs ${viewMode === "grid" ? "grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3" : "grid-cols-1"}`}>
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="@container/card">
              <CardHeader className="flex flex-col px-4 gap-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-full" />
              </CardHeader>
              <CardFooter className="px-4 items-center justify-between gap-2">
                <Skeleton className="h-4 w-20" />
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-6 w-6 rounded-md" />
                </div>
              </CardFooter>
            </Card>
          ))
        ) : bugs.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No bugs found for this cluster. Create your first bug report!
          </div>
        ) : (
          bugs.map((bug) => {
            const createdAt = bug.created_at || bug.createdAt
            const created = createdAt ? new Date(createdAt) : undefined
            const status = (bug.status || "open") as string
            const priority = (bug.priority || "medium") as string
            const bugTitle: string = (bug.title || bug.header || bug.name || "").toString() || "(untitled bug)"
            return (
              <Card key={bug.id} className="@container/card">
                <CardHeader className="flex flex-col px-4 gap-1">
                  <Badge 
                    variant="outline" 
                    className="capitalize text-[10px] px-1.5 py-0.5 text-white"
                    style={
                      status === 'open' ? { backgroundColor: '#0d9488', color: '#ffffff', borderColor: '#0d9488' }
                      : status === 'closed' ? { backgroundColor: '#64748b', color: '#ffffff', borderColor: '#64748b' }
                      : status === 'in_progress' ? { backgroundColor: '#0284c7', color: '#ffffff', borderColor: '#0284c7' }
                      : status === 'resolved' ? { backgroundColor: '#4f46e5', color: '#ffffff', borderColor: '#4f46e5' }
                      : status === 'reopened' ? { backgroundColor: '#f59e0b', color: '#ffffff', borderColor: '#f59e0b' }
                      : undefined
                    }
                  >
                    {status}
                  </Badge>
                  <CardTitle className="text-base font-semibold leading-snug break-words @[250px]/card:text-lg" title={bugTitle}>
                    {bugTitle}
                  </CardTitle>
                </CardHeader>
                <CardFooter className="px-4 items-center justify-between gap-2 text-xs">
                  <div className="text-muted-foreground text-xs">{created ? created.toLocaleDateString() : ""}</div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="capitalize text-[11px] px-1.5 py-0.5">{priority}</Badge>
                    <button 
                      type="button" 
                      aria-label="View bug" 
                      className="rounded-md p-1 border border-transparent text-muted-foreground hover:text-foreground hover:border-border" 
                      onClick={() => openBugDetails(bug.id)}
                    >
                      <IconEye className="size-3.5" />
                    </button>
                    <button 
                      type="button" 
                      aria-label="View graph" 
                      className="rounded-md p-1 border border-transparent text-muted-foreground hover:text-foreground hover:border-border" 
                      onClick={() => setGraphOpen(true)}
                    >
                      <IconChartArea className="size-3.5" />
                    </button>
                    <button 
                      type="button" 
                      aria-label="View solutions" 
                      className="rounded-md p-1 border border-transparent text-muted-foreground hover:text-foreground hover:border-border" 
                      onClick={() => { 
                        setSelectedBug(bug)
                        setSolutionOpen(true)
                        void fetchSolutions(bug.id) 
                      }}
                    >
                      <IconBulb className="size-3.5" />
                    </button>
                  </div>
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>

      {/* Details Drawer */}
      <Drawer open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DrawerContent>
          <DrawerHeader className="gap-1">
            <DrawerTitle>{(selectedBug?.title || selectedBug?.header || selectedBug?.name || "Bug details") as string}</DrawerTitle>
            <DrawerDescription>Full report details and activity</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
            {detailsLoading && <div className="text-muted-foreground">Loading details…</div>}
            {!detailsLoading && selectedBug && (
              <>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label>Status</Label>
                      {selectedBug.created_by && (selectedBug.created_by === userId || clusterOwnerId === userId) ? (
                        <Select
                          value={(selectedBug.status || "open") as string}
                          onValueChange={(value) => {
                            void updateBugStatus(selectedBug.id, value)
                          }}
                        >
                          <SelectTrigger className="capitalize w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="reopened">Reopened</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className="capitalize w-fit text-white"
                          style={
                            (() => {
                              const status = (selectedBug.status || "open") as string
                              return status === 'open' ? { backgroundColor: '#0d9488', color: '#ffffff', borderColor: '#0d9488' }
                                : status === 'closed' ? { backgroundColor: '#64748b', color: '#ffffff', borderColor: '#64748b' }
                                : status === 'in_progress' ? { backgroundColor: '#0284c7', color: '#ffffff', borderColor: '#0284c7' }
                                : status === 'resolved' ? { backgroundColor: '#4f46e5', color: '#ffffff', borderColor: '#4f46e5' }
                                : status === 'reopened' ? { backgroundColor: '#f59e0b', color: '#ffffff', borderColor: '#f59e0b' }
                                : undefined
                            })()
                          }
                        >
                          {((selectedBug.status || "open") as string).replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Priority</Label>
                      <Input value={(selectedBug.priority || "medium") as string} disabled className="capitalize" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Title</Label>
                    <Input value={selectedBug.title || ""} disabled />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Description</Label>
                    <Textarea value={selectedBug.description || "—"} disabled rows={4} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label>Environment</Label>
                      <Input value={selectedBug.environment || "—"} disabled />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Visibility</Label>
                      <Input value={(selectedBug.visibility || "public") as string} disabled className="capitalize" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label>Expected behavior</Label>
                      <Textarea value={selectedBug.expected_behavior || "—"} disabled rows={3} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Actual behavior</Label>
                      <Textarea value={selectedBug.actual_behavior || "—"} disabled rows={3} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Steps to reproduce</Label>
                    <Textarea value={selectedBug.steps_to_reproduce || "—"} disabled rows={4} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label>Tags</Label>
                      <Input value={(Array.isArray(selectedBug.tags) && selectedBug.tags.length ? selectedBug.tags.join(", ") : "—")} disabled />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Sources</Label>
                      <Input value={(Array.isArray(selectedBug.sources) && selectedBug.sources.length ? selectedBug.sources.join(", ") : "—")} disabled />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Attachments</Label>
                    <div className="grid gap-2">
                      {(() => {
                        // Normalize attachments - handle JSON string, array, or null
                        let attachments = selectedBug.attachments
                        if (typeof attachments === 'string') {
                          try {
                            attachments = JSON.parse(attachments)
                          } catch {
                            attachments = null
                          }
                        }
                        return Array.isArray(attachments) && attachments.length ? (
                          attachments.map((att: any, idx: number) => {
                            // Handle both string URLs and object formats
                            const url = typeof att === 'string' ? att : (att.url || att.link || att)
                            const filename = typeof att === 'string' 
                              ? att.split('/').pop() || att 
                              : (att.name || att.filename || url?.split('/').pop() || url)
                            return (
                              <a 
                                key={idx} 
                                className="underline underline-offset-4 break-all text-blue-600 hover:text-blue-800" 
                                href={url} 
                                target="_blank" 
                                rel="noreferrer"
                              >
                                {filename}
                              </a>
                            )
                          })
                        ) : (
                          <Input value="—" disabled />
                        )
                      })()}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <SolutionDialog
        open={solutionOpen}
        onOpenChange={(open) => {
          setSolutionOpen(open)
        }}
        solutions={solutions}
        solutionsLoading={solutionsLoading}
        isSubmitting={false}
        errors={{}}
        bugData={selectedBug ? {
          id: selectedBug.id,
          title: selectedBug.title || selectedBug.header || selectedBug.name || "Untitled Bug",
          description: selectedBug.description,
          priority: selectedBug.priority,
          status: selectedBug.status
        } : undefined}
      />

      <GraphDialog
        open={graphOpen}
        onOpenChange={setGraphOpen}
        chartData={chartData}
        chartConfig={chartConfig}
      />
    </div>
  )
}


