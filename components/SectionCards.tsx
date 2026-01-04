"use client"

import * as React from "react"
import { IconTrendingDown, IconTrendingUp, IconLayoutGrid, IconList, IconEye, IconExternalLink, IconChartArea, IconBulb } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { createBugSolution, getAllSolutions } from "@/app/actions/bug/BugSolution"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, Dot } from "recharts"
import { SolutionDialog } from "@/components/bugs/solutions/BugReportSolutionDialog"
import { toast } from "sonner"

interface SectionCardsProps {
  userId: string
}

export function SectionCards({ userId }: SectionCardsProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [chartData, setChartData] = React.useState<Array<{ date: string; count: number }>>([])
  const [totalBugs, setTotalBugs] = React.useState<number>(0)
  const [newThisWeek, setNewThisWeek] = React.useState<number>(0)
  const [openBugs, setOpenBugs] = React.useState<number>(0)
  const [growthPct, setGrowthPct] = React.useState<number>(0)
  const [bugs, setBugs] = React.useState<any[]>([])
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [selectedBug, setSelectedBug] = React.useState<any | null>(null)
  const [detailsLoading, setDetailsLoading] = React.useState(false)
  const [graphOpen, setGraphOpen] = React.useState(false)
  const [solutionOpen, setSolutionOpen] = React.useState(false)
  const [solutions, setSolutions] = React.useState<any[]>([])
  const [solutionsLoading, setSolutionsLoading] = React.useState(false)
  const [isSubmittingSolution, setIsSubmittingSolution] = React.useState(false)
  const [solutionErrors, setSolutionErrors] = React.useState<{ title?: string; description?: string; solution_type?: string; priority?: string; status?: string; assignee?: string; estimated_hours?: string; links?: string }>({})

  async function fetchBugStats() {
    try {
      setLoading(true)
      
      // Fetch bugs for card metrics
      const res = await fetch("/api/bugs?limit=200")
      if (!res.ok) return
      const data = await res.json()
      const items: any[] = data?.bugs || []
      // Filter out private bugs - only show public bugs
      const bugs = items.filter(bug => {
        const visibility = (bug.visibility || "public").toLowerCase().trim()
        return visibility !== "private"
      })
      setBugs(bugs)

      // Fetch solutions for chart
      const solutionsResult = await getAllSolutions()
      const solutions: any[] = solutionsResult?.solutions || []

      // Aggregate solutions by day and convert to cumulative
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

      // Card metrics (still based on bugs)
      setTotalBugs(bugs.length)
      const now = new Date()
      const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
      const sevenDaysAgo = new Date(startOfToday)
      sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7)
      const fourteenDaysAgo = new Date(startOfToday)
      fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 14)

      const isInRange = (dateStr: string | undefined, from: Date, to: Date) => {
        if (!dateStr) return false
        const d = new Date(dateStr)
        return d >= from && d < to
      }

      const last7 = bugs.filter(b => isInRange(b.created_at || b.createdAt, sevenDaysAgo, startOfToday)).length
      const prev7 = bugs.filter(b => isInRange(b.created_at || b.createdAt, fourteenDaysAgo, sevenDaysAgo)).length
      setNewThisWeek(last7)
      setOpenBugs(bugs.filter(b => (b.status || "open").toLowerCase() === "open").length)
      const growth = prev7 === 0 ? (last7 > 0 ? 100 : 0) : ((last7 - prev7) / prev7) * 100
      setGrowthPct(growth)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    const onCreated = () => {
      fetchBugStats()
    }
    const onSolutionCreated = () => {
      fetchBugStats()
    }
    window.addEventListener("bug:created", onCreated as EventListener)
    window.addEventListener("solution:created", onSolutionCreated as EventListener)
    return () => {
      window.removeEventListener("bug:created", onCreated as EventListener)
      window.removeEventListener("solution:created", onSolutionCreated as EventListener)
    }
  }, [])

  React.useEffect(() => {
    // Initial load for cards
    fetchBugStats()
  }, [])

  const chartConfig: ChartConfig = {
    count: {
      label: "Solutions",
      color: "var(--primary)",
    },
  }

  async function openBugDetails(bugId: string) {
    try {
      setDetailsLoading(true)
      setDetailsOpen(true)
      // Try per-id endpoint first
      const res = await fetch(`/api/bugs/${bugId}/reports`)
      if (res.ok) {
        const data = await res.json()
        setSelectedBug(data?.bug || null)
        return
      }
      // Fallback to list endpoint (Supabase-backed) and find by id
      const listRes = await fetch(`/api/bugs?limit=200`)
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
      // Use the reports endpoint for bug updates (handler validates cluster access internally)
      const endpoint = `/api/bugs/${bugId}/reports`
      
      const res = await fetch(endpoint, {
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
      await fetchBugStats()
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bug:updated', { detail: { bugId, status: newStatus } }))
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update bug status')
    }
  }

  async function submitSolution(formData: any) {
    if (!selectedBug?.id) return

    // Validate form data using Zod schema
    const { getBugSolutionSchema } = await import("@/lib/schemas/zod/bugSolution")
    const { z } = await import("zod")
    
    const schema = getBugSolutionSchema()
    
    try {
      schema.parse(formData)
      setSolutionErrors({})
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.issues.forEach((err) => {
          if (err.path && err.path.length > 0) {
            const fieldPath = err.path[0] as string
            errors[fieldPath] = err.message
          }
        })
        setSolutionErrors(errors)
        return
      }
      setSolutionErrors({})
      return
    }

    try {
      setIsSubmittingSolution(true)
      
      // Create FormData for server action
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title.trim())
      formDataToSend.append('description', formData.description.trim())
      formDataToSend.append('solution_type', formData.solution_type)
      formDataToSend.append('priority', formData.priority)
      formDataToSend.append('status', formData.status)
      if (formData.assignee) formDataToSend.append('assignee', formData.assignee)
      if (formData.estimated_hours) formDataToSend.append('estimated_hours', formData.estimated_hours)
      if (formData.links) formDataToSend.append('links', formData.links)
      
      // Add attachments if they exist
      if (formData.attachments && formData.attachments.length > 0) {
        formData.attachments.forEach((file: File, index: number) => {
          formDataToSend.append(`attachment_${index}`, file)
        })
      }

      // Use server action instead of fetch
      const result = await createBugSolution(formDataToSend, selectedBug.id)

      if (!result.success) {
        throw new Error(result.error || "Failed to submit solution")
      }

      // Dispatch event to notify other components (like charts) to refresh
      if (typeof window !== 'undefined' && result.solution) {
        window.dispatchEvent(new CustomEvent('solution:created', { detail: { solution: result.solution, bugId: selectedBug.id } }))
      }

      toast.success('Solution submitted successfully')
      setSolutionErrors({})
      await fetchSolutions(selectedBug.id)
    } catch (e: any) {
      toast.error(e?.message || 'Something went wrong')
    } finally {
      setIsSubmittingSolution(false)
    }
  }

  return (
    <>
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card
        className="@container/card cursor-pointer"
        onClick={async () => {
          setOpen(true)
          await fetchBugStats()
        }}
      >
        <CardHeader>
          <CardDescription>Total Bugs</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalBugs}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {growthPct >= 0 ? `+${growthPct.toFixed(1)}%` : `${growthPct.toFixed(1)}%`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {growthPct >= 0 ? "Trending up" : "Trending down"} this week <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            New in last 7 days: {newThisWeek}
          </div>
        </CardFooter>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Solution submissions over time</DialogTitle>
          </DialogHeader>
          <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
            <AreaChart data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Area 
                dataKey="count" 
                type="monotone" 
                stroke="var(--color-count)" 
                fill="var(--color-count)" 
                fillOpacity={0.2}
                dot={{ fill: "var(--color-count)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ChartContainer>
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {!loading && chartData.length === 0 && (
            <div className="text-sm text-muted-foreground">No bug data yet.</div>
          )}
        </DialogContent>
      </Dialog>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New This Week</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {newThisWeek}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {growthPct >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {growthPct >= 0 ? `+${growthPct.toFixed(1)}%` : `${growthPct.toFixed(1)}%`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Compared to previous 7 days
          </div>
          <div className="text-muted-foreground">
            Updated live on new reports
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Open Bugs</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {openBugs}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {totalBugs > 0 ? `${Math.round((openBugs / Math.max(totalBugs, 1)) * 100)}% open` : "—"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Lower is better
          </div>
          <div className="text-muted-foreground">Share of total reports currently open</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {growthPct.toFixed(1)}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {growthPct >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {growthPct >= 0 ? `+${growthPct.toFixed(1)}%` : `${growthPct.toFixed(1)}%`}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Week-over-week change
          </div>
          <div className="text-muted-foreground">Comparing last 7 days vs previous 7</div>
        </CardFooter>
      </Card>
    </div>
    {/* Separate grid for individual bug cards to avoid colliding with summary cards */}
    <div className="px-4 lg:px-6 mt-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Bugs</h3>
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
        {bugs.map((bug) => {
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
                <CardTitle
                  className="text-base font-semibold leading-snug break-words @[250px]/card:text-lg"
                  title={bugTitle}
                >
                  {bugTitle}
                </CardTitle>
              </CardHeader>
              <CardFooter className="px-4 items-center justify-between gap-2 text-xs">
                <div className="text-muted-foreground text-xs">
                  {created ? created.toLocaleDateString() : ""}
                </div>
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
                  {(status === 'closed' || status === 'resolved') ? (
                    <button
                      type="button"
                      aria-label="Add solution (disabled - bug is closed or resolved)"
                      className="rounded-md p-1 border border-transparent text-muted-foreground opacity-50 cursor-not-allowed"
                      disabled
                      title="Cannot add solutions to closed or resolved bugs"
                    >
                      <IconBulb className="size-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      aria-label="Add solution"
                      className="rounded-md p-1 border border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                      onClick={() => {
                        setSelectedBug(bug)
                        setSolutionOpen(true)
                        void fetchSolutions(bug.id)
                      }}
                    >
                      <IconBulb className="size-3.5" />
                    </button>
                  )}
                  <button type="button" aria-label="Open details" className="rounded-md p-1 border border-transparent text-muted-foreground hover:text-foreground hover:border-border">
                    <IconExternalLink className="size-3.5" />
                  </button>
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
    <Drawer open={detailsOpen} onOpenChange={setDetailsOpen}>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{(selectedBug?.title || selectedBug?.header || selectedBug?.name || "Bug details") as string}</DrawerTitle>
          <DrawerDescription>Full report details and activity</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {detailsLoading && (
            <div className="text-muted-foreground">Loading details…</div>
          )}
          {!detailsLoading && selectedBug && (
            <>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label>Status</Label>
                    {selectedBug.created_by && selectedBug.created_by === userId ? (
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
    <Dialog open={graphOpen} onOpenChange={setGraphOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Solution submissions over time</DialogTitle>
        </DialogHeader>
        <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
          <AreaChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            <Area dataKey="count" type="monotone" stroke="var(--color-count)" fill="var(--color-count)" fillOpacity={0.2} />
          </AreaChart>
        </ChartContainer>
      </DialogContent>
    </Dialog>

    <SolutionDialog
      open={solutionOpen}
      onOpenChange={(open) => {
        setSolutionOpen(open)
        if (!open) {
          setSolutionErrors({})
        }
      }}
      solutions={solutions}
      solutionsLoading={solutionsLoading}
      isSubmitting={isSubmittingSolution}
      errors={solutionErrors}
      bugData={selectedBug ? {
        id: selectedBug.id,
        title: selectedBug.title || selectedBug.header || selectedBug.name || "Untitled Bug",
        description: selectedBug.description,
        priority: selectedBug.priority,
        status: selectedBug.status
      } : undefined}
    />
    </>
  )
}
