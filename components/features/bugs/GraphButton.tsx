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
        size="icon"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-black/70 bg-black text-white shadow-none transition-none hover:bg-black hover:text-white dark:border-white/70 dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black"
        title="View bug relationship graph"
        aria-label="View bug relationship graph"
      >
        <BarChart3 className="h-5 w-5" />
      </Button>
      <BugGraphDialog open={open} onOpenChange={setOpen} bugId={bugId} />
    </>
  )
}
