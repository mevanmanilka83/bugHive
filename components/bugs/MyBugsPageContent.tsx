"use client"

import * as React from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggleGroup"
import { BugReportDialog } from "@/components/bugs/reports/BugReportDialog"
import { MyBugsList } from "@/components/bugs/MyBugsList"

interface MyBugsPageContentProps {
  userId: string
  currentUserName?: string
  currentUserImage?: string
}

export function MyBugsPageContent({
  userId,
  currentUserName,
  currentUserImage,
}: MyBugsPageContentProps) {
  type VisibilityFilter = "private" | "public" | "cluster-private" | "cluster-public"
  const [visibilityFilter, setVisibilityFilter] = React.useState<VisibilityFilter>("private")

  return (
    <>
      <div className="mb-4 rounded-lg border bg-background p-4">
        <div className="mb-3">
          <h1 className="mb-1 text-xl font-semibold sm:text-2xl">My Bugs</h1>
          <p className="text-sm text-muted-foreground">
            Bugs you've reported and can manage.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">View</span>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={visibilityFilter}
                onValueChange={(value) => {
                  if (value === "public" || value === "private") setVisibilityFilter(value)
                }}
                className="flex"
              >
                <ToggleGroupItem
                  value="private"
                  className="px-3 py-1 text-xs data-[state=on]:bg-foreground data-[state=on]:text-background"
                >
                  Private
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="public"
                  className="px-3 py-1 text-xs data-[state=on]:bg-foreground data-[state=on]:text-background"
                >
                  Public
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Cluster</span>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={visibilityFilter}
                onValueChange={(value) => {
                  if (value === "cluster-public" || value === "cluster-private") setVisibilityFilter(value)
                }}
                className="flex"
              >
                <ToggleGroupItem
                  value="cluster-private"
                  className="px-3 py-1 text-xs data-[state=on]:bg-foreground data-[state=on]:text-background"
                >
                  Private
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="cluster-public"
                  className="px-3 py-1 text-xs data-[state=on]:bg-foreground data-[state=on]:text-background"
                >
                  Public
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          <div className="flex w-full justify-end sm:w-auto">
            <BugReportDialog />
          </div>
        </div>
      </div>

      <MyBugsList
        userId={userId}
        currentUserName={currentUserName}
        currentUserImage={currentUserImage}
        showReportButton={false}
        visibilityFilter={visibilityFilter}
        showVisibilityToggle={false}
      />
    </>
  )
}
