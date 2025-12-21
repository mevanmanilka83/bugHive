"use client"

import * as React from "react"
import { IconLayoutGrid, IconList, IconEye, IconExternalLink, IconChartArea, IconBulb, IconX, IconFilter, IconSearch } from "@tabler/icons-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { SolutionDialog } from "@/components/bugs/solutions/BugReportSolutionDialog"
import { GraphDialog } from "@/components/bugs/GraphDialog"
import { ChartConfig } from "@/components/ui/chart"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface FilterState {
  status: string[]
  priority: string[]
  tags: string[]
  dateCreatedFrom: string
  dateCreatedTo: string
  dateModifiedFrom: string
  dateModifiedTo: string
  assignee: string
}

export function BugExploreList() {
  const [bugs, setBugs] = React.useState<any[]>([])
  const [allBugs, setAllBugs] = React.useState<any[]>([])
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
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const [filters, setFilters] = React.useState<FilterState>({
    status: [],
    priority: [],
    tags: [],
    dateCreatedFrom: "",
    dateCreatedTo: "",
    dateModifiedFrom: "",
    dateModifiedTo: "",
    assignee: "",
  })
  const [availableTags, setAvailableTags] = React.useState<string[]>([])
  const [availableAssignees, setAvailableAssignees] = React.useState<string[]>([])

  const chartConfig: ChartConfig = {
    count: {
      label: "Bugs",
      color: "var(--primary)",
    },
  }

  async function fetchBugs() {
    try {
      setLoading(true)
      const res = await fetch("/api/bugs?limit=500")
      if (!res.ok) return
      const data = await res.json()
      const items: any[] = data?.bugs || []
      setAllBugs(items)
      
      // Extract unique tags and assignees
      const tagSet = new Set<string>()
      const assigneeSet = new Set<string>()
      items.forEach(bug => {
        if (Array.isArray(bug.tags)) {
          bug.tags.forEach((tag: string) => tagSet.add(tag))
        }
        if (bug.assigned_to) {
          assigneeSet.add(bug.assigned_to)
        }
      })
      setAvailableTags(Array.from(tagSet).sort())
      setAvailableAssignees(Array.from(assigneeSet).sort())
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = React.useCallback((bugsToFilter: any[] = allBugs) => {
    let filtered = [...bugsToFilter]

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(bug => {
        const title = (bug.title || "").toLowerCase()
        const description = (bug.description || "").toLowerCase()
        return title.includes(query) || description.includes(query)
      })
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(bug => {
        const bugStatus = (bug.status || "open").toLowerCase()
        return filters.status.some(s => s.toLowerCase() === bugStatus)
      })
    }

    // Priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(bug => {
        const bugPriority = (bug.priority || "medium").toLowerCase()
        return filters.priority.some(p => p.toLowerCase() === bugPriority)
      })
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(bug => {
        const bugTags = Array.isArray(bug.tags) ? bug.tags.map((t: string) => t.toLowerCase()) : []
        return filters.tags.some(tag => bugTags.includes(tag.toLowerCase()))
      })
    }

    // Date Created filter
    if (filters.dateCreatedFrom) {
      const fromDate = new Date(filters.dateCreatedFrom)
      filtered = filtered.filter(bug => {
        const created = bug.created_at ? new Date(bug.created_at) : null
        return created && created >= fromDate
      })
    }
    if (filters.dateCreatedTo) {
      const toDate = new Date(filters.dateCreatedTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter(bug => {
        const created = bug.created_at ? new Date(bug.created_at) : null
        return created && created <= toDate
      })
    }

    // Date Modified filter
    if (filters.dateModifiedFrom) {
      const fromDate = new Date(filters.dateModifiedFrom)
      filtered = filtered.filter(bug => {
        const modified = bug.updated_at ? new Date(bug.updated_at) : null
        return modified && modified >= fromDate
      })
    }
    if (filters.dateModifiedTo) {
      const toDate = new Date(filters.dateModifiedTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter(bug => {
        const modified = bug.updated_at ? new Date(bug.updated_at) : null
        return modified && modified <= toDate
      })
    }


    // Assignee filter
    if (filters.assignee) {
      filtered = filtered.filter(bug => {
        const assignedTo = (bug.assigned_to || "").toLowerCase()
        return assignedTo === filters.assignee.toLowerCase()
      })
    }

    setBugs(filtered)

    // Build chart data
    const byDay = new Map<string, number>()
    for (const bug of filtered) {
      const createdAt = bug.created_at || bug.createdAt || bug.createdat
      const d = createdAt ? new Date(createdAt) : new Date()
      const key = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0, 10)
      byDay.set(key, (byDay.get(key) || 0) + 1)
    }
    const sorted = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }))
    setChartData(sorted)
  }, [searchQuery, filters, allBugs])

  React.useEffect(() => {
    fetchBugs()
  }, [])

  React.useEffect(() => {
    if (allBugs.length > 0) {
      applyFilters()
    } else if (!loading && allBugs.length === 0) {
      setBugs([])
      setChartData([])
    }
  }, [applyFilters, allBugs.length, loading])

  React.useEffect(() => {
    const onCreated = () => fetchBugs()
    window.addEventListener("bug:created", onCreated as EventListener)
    return () => window.removeEventListener("bug:created", onCreated as EventListener)
  }, [])

  function toggleFilter(type: 'status' | 'priority' | 'tags', value: string) {
    setFilters(prev => {
      const current = prev[type]
      const newValue = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [type]: newValue }
    })
  }

  function clearAllFilters() {
    setSearchQuery("")
    setFilters({
      status: [],
      priority: [],
      tags: [],
      dateCreatedFrom: "",
      dateCreatedTo: "",
      dateModifiedFrom: "",
      dateModifiedTo: "",
      assignee: "",
    })
  }

  function hasActiveFilters() {
    return (
      searchQuery.trim() !== "" ||
      filters.status.length > 0 ||
      filters.priority.length > 0 ||
      filters.tags.length > 0 ||
      filters.dateCreatedFrom !== "" ||
      filters.dateCreatedTo !== "" ||
      filters.dateModifiedFrom !== "" ||
      filters.dateModifiedTo !== "" ||
      filters.assignee !== ""
    )
  }

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
      const found = allBugs.find((b) => b.id === bugId)
      setSelectedBug(found || null)
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

  const statusOptions = ["open", "in_progress", "resolved", "closed", "reopened"]
  const priorityOptions = ["low", "medium", "high", "critical"]

  // Reusable filter content component
  const FilterContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Filters</h4>
        {hasActiveFilters() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 text-xs"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Status and Priority in columns */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bug Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Bug Status</Label>
          <div className="space-y-2">
            {statusOptions.map(status => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={filters.status.includes(status)}
                  onCheckedChange={() => toggleFilter('status', status)}
                />
                <Label
                  htmlFor={`status-${status}`}
                  className="text-sm font-normal capitalize cursor-pointer"
                >
                  {status.replace('_', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Level */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Priority Level</Label>
          <div className="space-y-2">
            {priorityOptions.map(priority => (
              <div key={priority} className="flex items-center space-x-2">
                <Checkbox
                  id={`priority-${priority}`}
                  checked={filters.priority.includes(priority)}
                  onCheckedChange={() => toggleFilter('priority', priority)}
                />
                <Label
                  htmlFor={`priority-${priority}`}
                  className="text-sm font-normal capitalize cursor-pointer"
                >
                  {priority}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Separator />

      {/* Date filters in columns */}
      <div className="grid grid-cols-2 gap-4">
        {/* Date Created */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Date Created</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="created-from" className="text-xs text-muted-foreground">From</Label>
              <Input
                id="created-from"
                type="date"
                value={filters.dateCreatedFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateCreatedFrom: e.target.value }))}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="created-to" className="text-xs text-muted-foreground">To</Label>
              <Input
                id="created-to"
                type="date"
                value={filters.dateCreatedTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateCreatedTo: e.target.value }))}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Date Modified */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Date Modified</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="modified-from" className="text-xs text-muted-foreground">From</Label>
              <Input
                id="modified-from"
                type="date"
                value={filters.dateModifiedFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateModifiedFrom: e.target.value }))}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="modified-to" className="text-xs text-muted-foreground">To</Label>
              <Input
                id="modified-to"
                type="date"
                value={filters.dateModifiedTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateModifiedTo: e.target.value }))}
                className="h-8"
              />
            </div>
          </div>
        </div>
      </div>
      <Separator />

      {/* Assignee */}
      {availableAssignees.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="assignee" className="text-sm font-medium">Assignee</Label>
          <Select
            value={filters.assignee}
            onValueChange={(value) => setFilters(prev => ({ ...prev, assignee: value }))}
          >
            <SelectTrigger id="assignee" className="h-8">
              <SelectValue placeholder="All assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All assignees</SelectItem>
              {availableAssignees.map(assignee => (
                <SelectItem key={assignee} value={assignee}>
                  {assignee}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Tags - Full width with scroll */}
      {availableTags.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tags</Label>
            <div className="max-h-32 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                {availableTags.map(tag => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={filters.tags.includes(tag)}
                      onCheckedChange={() => toggleFilter('tags', tag)}
                    />
                    <Label
                      htmlFor={`tag-${tag}`}
                      className="text-sm font-normal cursor-pointer truncate"
                      title={tag}
                    >
                      {tag}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search bugs by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {isMobile ? (
            <Drawer open={filtersOpen} onOpenChange={setFiltersOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <IconFilter className="size-4" />
                  Filters
                  {hasActiveFilters() && (
                    <Badge variant="secondary" className="ml-1">
                      {[
                        filters.status.length,
                        filters.priority.length,
                        filters.tags.length,
                        filters.dateCreatedFrom || filters.dateCreatedTo ? 1 : 0,
                        filters.dateModifiedFrom || filters.dateModifiedTo ? 1 : 0,
                        filters.assignee ? 1 : 0,
                      ].reduce((a, b) => a + b, 0)}
                    </Badge>
                  )}
                </Button>
              </DrawerTrigger>
              <DrawerContent className="max-h-[90vh]">
                <DrawerHeader>
                  <DrawerTitle>Filters</DrawerTitle>
                  <DrawerDescription>
                    {hasActiveFilters() && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-7 text-xs mt-2"
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-4 overflow-y-auto">
                  <FilterContent />
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <IconFilter className="size-4" />
                  Filters
                  {hasActiveFilters() && (
                    <Badge variant="secondary" className="ml-1">
                      {[
                        filters.status.length,
                        filters.priority.length,
                        filters.tags.length,
                        filters.dateCreatedFrom || filters.dateCreatedTo ? 1 : 0,
                        filters.dateModifiedFrom || filters.dateModifiedTo ? 1 : 0,
                        filters.assignee ? 1 : 0,
                      ].reduce((a, b) => a + b, 0)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[min(600px,calc(100vw-4rem))] max-h-[min(calc(100vh-12rem),600px)] overflow-y-auto overscroll-contain" 
                align="end"
                side="bottom"
                sideOffset={8}
                avoidCollisions={true}
                collisionPadding={24}
                onOpenAutoFocus={(e) => {
                  // Prevent auto focus to avoid scroll issues
                  e.preventDefault()
                }}
              >
                <FilterContent />
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {filters.status.map(status => (
              <Badge key={status} variant="secondary" className="gap-1">
                Status: {status.replace('_', ' ')}
                <button
                  onClick={() => toggleFilter('status', status)}
                  className="ml-1 hover:bg-secondary rounded-full"
                >
                  <IconX className="size-3" />
                </button>
              </Badge>
            ))}
            {filters.priority.map(priority => (
              <Badge key={priority} variant="secondary" className="gap-1">
                Priority: {priority}
                <button
                  onClick={() => toggleFilter('priority', priority)}
                  className="ml-1 hover:bg-secondary rounded-full"
                >
                  <IconX className="size-3" />
                </button>
              </Badge>
            ))}
            {filters.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1">
                Tag: {tag}
                <button
                  onClick={() => toggleFilter('tags', tag)}
                  className="ml-1 hover:bg-secondary rounded-full"
                >
                  <IconX className="size-3" />
                </button>
              </Badge>
            ))}
            {(filters.dateCreatedFrom || filters.dateCreatedTo) && (
              <Badge variant="secondary" className="gap-1">
                Created: {filters.dateCreatedFrom || '...'} to {filters.dateCreatedTo || '...'}
                <button
                  onClick={() => setFilters(prev => ({ ...prev, dateCreatedFrom: "", dateCreatedTo: "" }))}
                  className="ml-1 hover:bg-secondary rounded-full"
                >
                  <IconX className="size-3" />
                </button>
              </Badge>
            )}
            {(filters.dateModifiedFrom || filters.dateModifiedTo) && (
              <Badge variant="secondary" className="gap-1">
                Modified: {filters.dateModifiedFrom || '...'} to {filters.dateModifiedTo || '...'}
                <button
                  onClick={() => setFilters(prev => ({ ...prev, dateModifiedFrom: "", dateModifiedTo: "" }))}
                  className="ml-1 hover:bg-secondary rounded-full"
                >
                  <IconX className="size-3" />
                </button>
              </Badge>
            )}
            {filters.assignee && (
              <Badge variant="secondary" className="gap-1">
                Assignee: {filters.assignee}
                <button
                  onClick={() => setFilters(prev => ({ ...prev, assignee: "" }))}
                  className="ml-1 hover:bg-secondary rounded-full"
                >
                  <IconX className="size-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results Header */}
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

      {/* Bugs Grid/List */}
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
                  <Skeleton className="h-6 w-6 rounded-md" />
                </div>
              </CardFooter>
            </Card>
          ))
        ) : bugs.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No bugs found. {hasActiveFilters() ? "Try adjusting your filters." : "Create your first bug report!"}
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
                    <CardDescription className="capitalize text-xs">{status}</CardDescription>
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
                      <button 
                        type="button" 
                        aria-label="Open details" 
                        className="rounded-md p-1 border border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                      >
                        <IconExternalLink className="size-3.5" />
                      </button>
                    </div>
                  </CardFooter>
                </Card>
              )
            })
          )}
        </div>
      )}

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
                      <Input value={(selectedBug.status || "open") as string} disabled className="capitalize" />
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
                      <Input value={(selectedBug.visibility || "team") as string} disabled className="capitalize" />
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
                      {Array.isArray(selectedBug.attachments) && selectedBug.attachments.length ? (
                        selectedBug.attachments.map((att: any, idx: number) => (
                          <a key={idx} className="underline underline-offset-4 break-all" href={att.url || att.link || att} target="_blank" rel="noreferrer">
                            {att.name || att.filename || att.url || att}
                          </a>
                        ))
                      ) : (
                        <Input value="—" disabled />
                      )}
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

