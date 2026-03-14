"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ChartSplineIcon } from "@/components/ui/chart-spline"
import { BugGraphDialog } from "./BugGraphDialog"

export function GraphButton({ bugId, clusterId }: { bugId: string; clusterId?: string }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        size="icon"
        onClick={() => setOpen(true)}
        className="border-2 border-icon-orange p-1.5 text-icon-orange hover:bg-icon-orange/10 hover:text-icon-orange/90 focus:outline-none focus:ring-2 focus:ring-icon-orange focus:ring-offset-2 transition-colors"
        title="View bug relationship graph"
        aria-label="View bug relationship graph"
      >
        <ChartSplineIcon size={16} className="size-4" />
      </Button>
      <BugGraphDialog open={open} onOpenChange={setOpen} bugId={bugId} clusterId={clusterId} />
    </>
  )
}
