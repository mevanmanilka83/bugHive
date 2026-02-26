"use client"

import * as React from "react"
import { CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function WorkspaceSuccessBanner({ show }: { show: boolean }) {
  const [visible, setVisible] = React.useState(show)

  React.useEffect(() => {
    setVisible(show)
    if (show) {
      const t = setTimeout(() => setVisible(false), 8000)
      return () => clearTimeout(t)
    }
  }, [show])

  if (!visible) return null

  return (
    <div
      role="alert"
      className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-800 dark:text-green-200"
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
        <span>
          Graph saved. It&apos;s now in <strong>My graphs</strong>—open it to add ideas and solutions.
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 h-8 w-8 text-green-700 hover:bg-green-500/20 dark:text-green-300"
        aria-label="Dismiss"
        onClick={() => setVisible(false)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
