"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
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
import { createBugSolution } from "@/app/actions/bug/BugSolution"
import { SolutionDialog } from "@/components/bugs/solutions/BugReportSolutionDialog"
import { VoteButtons } from "@/components/bugs/VoteButtons"
import { BugDetailedList } from "@/components/bugs/BugDetailedList"
import { toast } from "sonner"

interface SectionCardsProps {
  userId: string
}

export function SectionCards({ userId }: SectionCardsProps) {
  const [bugs, setBugs] = React.useState<any[]>([])
  const [detailsOpen, setDetailsOpen] = React.useState(false)
  const [selectedBug, setSelectedBug] = React.useState<any | null>(null)
  const [detailsLoading, setDetailsLoading] = React.useState(false)
  const [solutionOpen, setSolutionOpen] = React.useState(false)
  const [solutions, setSolutions] = React.useState<any[]>([])
  const [solutionsLoading, setSolutionsLoading] = React.useState(false)
  const [isSubmittingSolution, setIsSubmittingSolution] = React.useState(false)
  const [solutionErrors, setSolutionErrors] = React.useState<{ title?: string; description?: string; solution_type?: string; priority?: string; status?: string; assignee?: string; estimated_hours?: string; links?: string }>({})

  async function fetchBugs() {
    try {
      const res = await fetch("/api/bugs?limit=200")
      if (!res.ok) return
      const data = await res.json()
      const items: any[] = data?.bugs || []
      // Filter out private bugs - only show public bugs
      const publicBugs = items.filter(bug => {
        const visibility = (bug.visibility || "public").toLowerCase().trim()
        return visibility !== "private"
      })
      setBugs(publicBugs)
    } catch (error) {
      console.error("Failed to fetch bugs:", error)
    }
  }

  React.useEffect(() => {
    const onCreated = () => {
      fetchBugs()
    }
    const onSolutionCreated = () => {
      fetchBugs()
    }
    window.addEventListener("bug:created", onCreated as EventListener)
    window.addEventListener("solution:created", onSolutionCreated as EventListener)
    fetchBugs()
    return () => {
      window.removeEventListener("bug:created", onCreated as EventListener)
      window.removeEventListener("solution:created", onSolutionCreated as EventListener)
    }
  }, [])


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
      await fetchBugs()
      
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
    {/* Separate grid for individual bug cards to avoid colliding with summary cards */}
    <div className="px-4 lg:px-6 mt-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Bugs</h3>
      </div>
      <BugDetailedList
        userId={userId}
        bugs={bugs}
        onBugClick={(bugId) => openBugDetails(bugId)}
        totalCount={bugs.length}
      />
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
