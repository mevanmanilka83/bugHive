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
  const [visibilityFilter, setVisibilityFilter] = React.useState<"private" | "public">("private")

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-1 text-xl font-semibold sm:text-2xl">My Bugs</h1>
          <p className="text-sm text-muted-foreground">
            Bugs you've reported and can manage.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          <BugReportDialog />
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={visibilityFilter}
            onValueChange={(value) => {
              if (value === "public" || value === "private") setVisibilityFilter(value)
            }}
            className="w-full sm:w-auto"
          >
            <ToggleGroupItem
              value="private"
              className="flex-1 px-3 py-1 text-xs data-[state=on]:bg-foreground data-[state=on]:text-background"
            >
              Private
            </ToggleGroupItem>
            <ToggleGroupItem
              value="public"
              className="flex-1 px-3 py-1 text-xs data-[state=on]:bg-foreground data-[state=on]:text-background"
            >
              Public
            </ToggleGroupItem>
          </ToggleGroup>
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
