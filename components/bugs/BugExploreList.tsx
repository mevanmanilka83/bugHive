"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BugDetailedList } from "@/components/bugs/BugDetailedList"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { GraphDialog } from "@/components/bugs/GraphDialog"
import { ChartConfig } from "@/components/ui/chart"
import { useIsMobile } from "@/hooks/useMobile"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { IconFilter, IconSearch } from "@tabler/icons-react"
import { toast } from "sonner"

interface FilterState {
  status: string[]
  priority: string[]
  tags: string[]
  browser: string
  os: string
  device: string
  dateCreatedFrom: string
  dateCreatedTo: string
  dateModifiedFrom: string
  dateModifiedTo: string
  assignee: string
}

interface BugExploreListProps {
  userId: string
  showTitle?: boolean
  currentUserName?: string
  currentUserImage?: string
}

export function BugExploreList({ userId, showTitle = true, currentUserName, currentUserImage }: BugExploreListProps) {
  const router = useRouter()
  const [bugs, setBugs] = React.useState<any[]>([])
  const [allBugs, setAllBugs] = React.useState<any[]>([])
  const [graphOpen, setGraphOpen] = React.useState(false)
  const [chartData, setChartData] = React.useState<Array<{ date: string; count: number }>>([])
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const [filters, setFilters] = React.useState<FilterState>({
    status: [],
    priority: [],
    tags: [],
    browser: "",
    os: "",
    device: "",
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
      // Filter out private bugs - only show public bugs in Bug Explore
      const publicBugs = items.filter(bug => {
        const visibility = (bug.visibility || "public").toLowerCase().trim()
        return visibility !== "private"
      })
      setAllBugs(publicBugs)
      
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

    // Environment filters (Browser / OS / Device - simple substring match on environment field)
    if (filters.browser) {
      const browserQuery = filters.browser.toLowerCase()
      filtered = filtered.filter(bug => (bug.environment || "").toLowerCase().includes(browserQuery))
    }
    if (filters.os) {
      const osQuery = filters.os.toLowerCase()
      filtered = filtered.filter(bug => (bug.environment || "").toLowerCase().includes(osQuery))
    }
    if (filters.device) {
      const deviceQuery = filters.device.toLowerCase()
      filtered = filtered.filter(bug => (bug.environment || "").toLowerCase().includes(deviceQuery))
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
    const onUpdated = () => fetchBugs()
    window.addEventListener("bug:created", onCreated as EventListener)
    window.addEventListener("bug:updated", onUpdated as EventListener)
    return () => {
      window.removeEventListener("bug:created", onCreated as EventListener)
      window.removeEventListener("bug:updated", onUpdated as EventListener)
    }
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
      browser: "",
      os: "",
      device: "",
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
      filters.browser !== "" ||
      filters.os !== "" ||
      filters.device !== "" ||
      filters.dateCreatedFrom !== "" ||
      filters.dateCreatedTo !== "" ||
      filters.dateModifiedFrom !== "" ||
      filters.dateModifiedTo !== "" ||
      filters.assignee !== ""
    )
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
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 rounded-full px-4 text-xs"
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

      {/* Environment */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Environment</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label htmlFor="env-browser" className="text-xs text-muted-foreground">Browser</Label>
            <Input
              id="env-browser"
              type="text"
              placeholder="e.g. Chrome"
              value={filters.browser}
              onChange={(e) => setFilters(prev => ({ ...prev, browser: e.target.value }))}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="env-os" className="text-xs text-muted-foreground">OS</Label>
            <Input
              id="env-os"
              type="text"
              placeholder="e.g. macOS, Windows"
              value={filters.os}
              onChange={(e) => setFilters(prev => ({ ...prev, os: e.target.value }))}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="env-device" className="text-xs text-muted-foreground">Device</Label>
            <Input
              id="env-device"
              type="text"
              placeholder="e.g. iPhone 15"
              value={filters.device}
              onChange={(e) => setFilters(prev => ({ ...prev, device: e.target.value }))}
              className="h-8"
            />
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

  function openBugDetails(bugId: string) {
    router.push(`/bugs/${bugId}`)
  }

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search bugs by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
      </div>

      <BugDetailedList
        userId={userId}
        bugs={bugs}
        onBugClick={openBugDetails}
        totalCount={bugs.length}
        showTitle={showTitle}
        currentUserName={currentUserName}
        currentUserImage={currentUserImage}
        onOpenFilters={() => setFiltersOpen((open) => !open)}
        filtersOpen={filtersOpen}
        renderFiltersPanel={() => (
          <div className="rounded-lg border bg-muted/60 px-4 py-4">
            <FilterContent />
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full px-4"
                onClick={clearAllFilters}
              >
                Clear filters
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full px-4"
                onClick={() => setFiltersOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-full px-4"
                onClick={() => {
                  applyFilters()
                  setFiltersOpen(false)
                }}
              >
                Apply filters
              </Button>
            </div>
          </div>
        )}
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

