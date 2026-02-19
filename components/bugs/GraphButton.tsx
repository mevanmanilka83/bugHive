"use client"

import * as React from "react"
import { BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BugGraphDialog } from "./BugGraphDialog"

export function GraphButton({ bugId }: { bugId: string }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 h-8 w-8"
        title="View bug relationship graph"
        aria-label="View bug relationship graph"
      >
        <BarChart3 className="h-4 w-4" />
      </Button>
      <BugGraphDialog open={open} onOpenChange={setOpen} bugId={bugId} />
    </>
  )
}
