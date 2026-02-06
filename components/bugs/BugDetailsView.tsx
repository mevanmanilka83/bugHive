"use client"

import * as React from "react"
import Link from "next/link"
import { BugDetailsForm } from "@/components/bugs/BugDetailsForm"
import { BugDescriptionContent } from "@/components/bugs/BugDescriptionContent"
import { SolutionDialog } from "@/components/bugs/solutions/BugReportSolutionDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { IconBulb } from "@tabler/icons-react"

export interface BugDetailsViewProps {
  bug: {
    id: string
    title?: string
    description?: string
    status?: string
    priority?: string
    visibility?: string
    environment?: string
    expected_behavior?: string
    actual_behavior?: string
    steps_to_reproduce?: string
    tags?: string[] | null
    sources?: unknown
    attachments?: unknown
    created_by?: string
    [key: string]: unknown
  }
  userId?: string | null
}

type SolutionItem = {
  id: string
  title?: string | null
  description?: string | null
  created_at: string
  links?: string[] | null
}

export function BugDetailsView({ bug, userId = null }: BugDetailsViewProps) {
  const isLoggedIn = Boolean(userId)
  const [currentBug, setCurrentBug] = React.useState(bug)
  const [solutionOpen, setSolutionOpen] = React.useState(false)
  const [solutions, setSolutions] = React.useState<SolutionItem[]>([])
  const [solutionsLoading, setSolutionsLoading] = React.useState(true)

  const fetchSolutions = React.useCallback(async () => {
    try {
      setSolutionsLoading(true)
      const res = await fetch(`/api/bugs/${currentBug.id}/solutions`)
      if (!res.ok) {
        setSolutions([])
        return
      }
      const data = await res.json()
      const list = Array.isArray(data?.solutions) ? data.solutions : []
      setSolutions(list)
    } finally {
      setSolutionsLoading(false)
    }
  }, [currentBug.id])

  React.useEffect(() => {
    fetchSolutions()
  }, [fetchSolutions])

  React.useEffect(() => {
    const onCreated = (e: Event) => {
      const ev = e as CustomEvent<{ bugId?: string }>
      if (ev.detail?.bugId === currentBug.id) fetchSolutions()
    }
    window.addEventListener("solution:created", onCreated)
    return () => window.removeEventListener("solution:created", onCreated)
  }, [currentBug.id, fetchSolutions])

  async function handleStatusChange(bugId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/bugs/${bugId}/reports`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || err?.message || "Failed to update status")
      }
      setCurrentBug((prev) => ({ ...prev, status: newStatus }))
      toast.success("Status updated")
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("bug:updated", { detail: { bugId, status: newStatus } }))
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status")
    }
  }

  const isBugClosedOrResolved =
    String(currentBug.status || "").toLowerCase() === "closed" ||
    String(currentBug.status || "").toLowerCase() === "resolved"

  const solutionsForDialog = solutions.map((s) => ({
    id: s.id,
    title: s.title ?? null,
    content: s.description ?? "",
    links: s.links ?? null,
    created_at: s.created_at,
  }))

  return (
    <>
      <div className="mt-2 mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {currentBug.title || "Bug details"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Full report details and activity
        </p>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto text-sm rounded-lg border bg-card p-4 md:p-6 mb-6">
        <BugDetailsForm
          bug={currentBug}
          userId={userId}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Solutions section */}
      <div className="mt-16 rounded-lg border bg-card">
        <div className="border-b px-4 py-3 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <IconBulb className="size-5 text-muted-foreground" />
              Solutions
              {!solutionsLoading && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({solutions.length})
                </span>
              )}
            </h2>
            {!isBugClosedOrResolved && (
              isLoggedIn ? (
                <Button
                  type="button"
                  className="rounded-full"
                  onClick={() => setSolutionOpen(true)}
                >
                  Add solution
                </Button>
              ) : (
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/auth/signin">Sign in to add a solution</Link>
                </Button>
              )
            )}
          </div>
        </div>
        <div className="p-4 md:p-6">
          {solutionsLoading ? (
            <p className="text-sm text-muted-foreground">Loading solutions…</p>
          ) : solutions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No solutions yet. {isLoggedIn ? "Be the first to suggest a fix or workaround." : "Sign in to add a solution."}
            </p>
          ) : (
            <ul className="space-y-4">
              {solutions.map((solution) => (
                <li key={solution.id}>
                  <Card className="border-l-4 border-l-primary/80">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-foreground">
                          {solution.title || "Untitled solution"}
                        </h3>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(solution.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground line-clamp-4">
                        <BugDescriptionContent content={solution.description ?? ""} fallback="—" />
                      </div>
                      {Array.isArray(solution.links) && solution.links.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {solution.links.map((link, i) => (
                            <a
                              key={i}
                              href={String(link)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary hover:underline break-all"
                            >
                              {String(link)}
                            </a>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {isLoggedIn && (
        <SolutionDialog
          open={solutionOpen}
          onOpenChange={setSolutionOpen}
          solutions={solutionsForDialog}
          solutionsLoading={solutionsLoading}
          isSubmitting={false}
          errors={{}}
          bugData={{
            id: currentBug.id,
            title: String(currentBug.title || "Untitled Bug"),
            description: currentBug.description as string | undefined,
            priority: currentBug.priority as string | undefined,
            status: currentBug.status as string | undefined,
          }}
        />
      )}
    </>
  )
}
