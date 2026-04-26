"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BugDetailedList } from "@/components/features/bugs/BugDetailedList"
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
import { GraphDialog } from "@/components/features/bugs/GraphDialog"
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
  initialTag?: string
  initialTags?: string[]
  showTitle?: boolean
  showReportButton?: boolean
  currentUserName?: string
  currentUserImage?: string
  detailBasePath?: string
}

const ALL_ASSIGNEES_VALUE = "__all_assignees__"
type AssigneeOption = { id: string; label: string }

export function BugExploreList({
  userId,
  initialTag,
  initialTags,
  showTitle = true,
  showReportButton = true,
  currentUserName,
  currentUserImage,
  detailBasePath = "/bugs",
}: BugExploreListProps) {
  const router = useRouter()
  const [bugs, setBugs] = React.useState<any[]>([])
  const [allBugs, setAllBugs] = React.useState<any[]>([])
  const [graphOpen, setGraphOpen] = React.useState(false)
  const [chartData, setChartData] = React.useState<Array<{ date: string; count: number }>>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [filtersOpen, setFiltersOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const [filters, setFilters] = React.useState<FilterState>({
    status: [],
    priority: [],
    tags: Array.isArray(initialTags) && initialTags.length > 0 ? initialTags : (initialTag ? [initialTag] : []),
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
  const [availableAssignees, setAvailableAssignees] = React.useState<AssigneeOption[]>([])

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
      const publicBugs = items.filter(bug => {
        const visibility = (bug.visibility || "public").toLowerCase().trim()
        return visibility !== "private"
      })
      setAllBugs(publicBugs)

      const tagSet = new Set<string>()
      const assigneeSet = new Set<string>()
      publicBugs.forEach(bug => {
        if (Array.isArray(bug.tags)) {
          bug.tags.forEach((tag: string) => tagSet.add(tag))
        }
        if (bug.assigned_to) {
          assigneeSet.add(bug.assigned_to)
        }
      })
      setAvailableTags(Array.from(tagSet).sort())

      const assigneeIds = Array.from(assigneeSet)
      if (assigneeIds.length === 0) {
        setAvailableAssignees([])
        return
      }

      const usersRes = await fetch(`/api/users/batch?ids=${encodeURIComponent(assigneeIds.join(","))}`)
      const usersJson = usersRes.ok ? await usersRes.json().catch(() => ({ users: [] })) : { users: [] }
      const users: any[] = Array.isArray(usersJson?.users) ? usersJson.users : []
      const userMap = new Map<string, string>()
      users.forEach((u) => {
        const id = (u?.id || "").toString().trim()
        if (!id) return
        const label =
          (u?.name || u?.username || u?.email || "").toString().trim() ||
          id.slice(0, 8)
        userMap.set(id, label)
      })

      const options = assigneeIds
        .map((id) => ({
          id,
          label: userMap.get(id) ?? id.slice(0, 8),
        }))
        .sort((a, b) => a.label.localeCompare(b.label))

      setAvailableAssignees(options)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = React.useCallback((bugsToFilter: any[] = allBugs) => {
    let filtered = [...bugsToFilter]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(bug => {
        const title = (bug.title || "").toLowerCase()
        const description = (bug.description || "").toLowerCase()
        return title.includes(query) || description.includes(query)
      })
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter(bug => {
        const bugStatus = (bug.status || "open").toLowerCase()
        return filters.status.some(s => s.toLowerCase() === bugStatus)
      })
    }

    if (filters.priority.length > 0) {
      filtered = filtered.filter(bug => {
        const bugPriority = (bug.priority || "medium").toLowerCase()
        return filters.priority.some(p => p.toLowerCase() === bugPriority)
      })
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter(bug => {
        const bugTags = Array.isArray(bug.tags) ? bug.tags.map((t: string) => t.toLowerCase()) : []
        return filters.tags.some(tag => bugTags.includes(tag.toLowerCase()))
      })
    }

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

    if (filters.browser) {
      const browserQuery = filters.browser.trim().toLowerCase()
      filtered = filtered.filter(bug => (bug.environment || "").toLowerCase().includes(browserQuery))
    }
    if (filters.os) {
      const osQuery = filters.os.trim().toLowerCase()
      filtered = filtered.filter(bug => (bug.environment || "").toLowerCase().includes(osQuery))
    }
    if (filters.device) {
      const deviceQuery = filters.device.trim().toLowerCase()
      filtered = filtered.filter(bug => (bug.environment || "").toLowerCase().includes(deviceQuery))
    }

    if (filters.assignee) {
      filtered = filtered.filter(bug => {
        const assignedTo = (bug.assigned_to || "").toLowerCase()
        return assignedTo === filters.assignee.toLowerCase()
      })
    }

    setBugs(filtered)

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
    const cleaned =
      Array.isArray(initialTags) && initialTags.length > 0
        ? Array.from(new Set(initialTags.map((t) => (t || "").trim()).filter(Boolean)))
        : (initialTag && initialTag.trim() ? [initialTag.trim()] : [])

    if (cleaned.length > 0) {
      setFilters((prev) => ({ ...prev, tags: cleaned }))
    }
  }, [initialTag, initialTags])

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
    if (typeof window !== "undefined" && window.location.search.includes("tag=")) {
      router.replace("/", { scroll: false })
    }
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

  const FilterContent = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Filters</h4>
        {hasActiveFilters() && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 px-4 text-xs"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Status and Priority in columns */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Bug Status */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Bug Status</Label>
          <div className="space-y-2">
            {statusOptions.map((status, idx) => (
              <div key={`status-${status}-${idx}`} className="flex items-center space-x-2">
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
            {priorityOptions.map((priority, idx) => (
              <div key={`priority-${priority}-${idx}`} className="flex items-center space-x-2">
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
                placeholder="e.g. chrome"
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
                placeholder="e.g. macos, windows"
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
                placeholder="e.g. iphone 15"
              value={filters.device}
              onChange={(e) => setFilters(prev => ({ ...prev, device: e.target.value }))}
              className="h-8"
            />
          </div>
        </div>
      </div>
      <Separator />

      {/* Date filters in columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Date Created */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Date Created</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
            value={filters.assignee || ALL_ASSIGNEES_VALUE}
            onValueChange={(value) =>
              setFilters(prev => ({
                ...prev,
                assignee: value === ALL_ASSIGNEES_VALUE ? "" : value,
              }))
            }
          >
            <SelectTrigger id="assignee" className="h-8">
              <SelectValue placeholder="All assignees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ASSIGNEES_VALUE}>All assignees</SelectItem>
              {availableAssignees.map((assignee, idx) => (
                <SelectItem key={`assignee-${assignee.id}-${idx}`} value={assignee.id}>
                  {assignee.label}
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
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {availableTags.map((tag, idx) => (
                  <div key={`tag-${String(tag)}-${idx}`} className="flex items-center space-x-2">
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
    router.push(`${detailBasePath}/${bugId}`)
  }

  const searchSuggestions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    const titles = new Set<string>()
    allBugs.forEach((bug) => {
      const t = (bug.title || "").toString().trim()
      if (t && t.toLowerCase().includes(q)) {
        titles.add(t)
      }
    })
    return Array.from(titles).slice(0, 6)
  }, [searchQuery, allBugs])

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
          {searchSuggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-none border border-border bg-card shadow-sm max-h-48 overflow-y-auto">
              {searchSuggestions.map((title, idx) => (
                <button
                  key={`suggestion-${title}-${idx}`}
                  type="button"
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setSearchQuery(title)
                    const fakeEvent = { target: { value: title } } as React.ChangeEvent<HTMLInputElement>
                    setSearchQuery(title)
                    const q = title.toLowerCase()
                    const matches = allBugs.filter((bug) => {
                      const t = (bug.title || "").toLowerCase()
                      const d = (bug.description || "").toLowerCase()
                      return t.includes(q) || d.includes(q)
                    })
                    setBugs(matches)
                  }}
                >
                  {title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <BugDetailedList
        userId={userId}
        bugs={bugs}
        onBugClick={openBugDetails}
        totalCount={bugs.length}
        showTitle={showTitle}
        showReportButton={showReportButton}
        currentUserName={currentUserName}
        currentUserImage={currentUserImage}
        isLoading={loading}
        onOpenFilters={() => setFiltersOpen((open) => !open)}
        filtersOpen={filtersOpen}
        renderFiltersPanel={() => (
          <div className="rounded-lg border bg-card px-4 py-4 shadow-sm">
            <FilterContent />
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="button"
                size="sm"
                className="px-4 rounded-none"
                onClick={clearAllFilters}
              >
                Clear filters
              </Button>
              <Button
                type="button"
                size="sm"
                className="px-4 rounded-none"
                onClick={() => setFiltersOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="px-4 rounded-none"
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

