"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Copy } from "lucide-react"

export function CopyGraphButton({ workspaceId }: { workspaceId: string }) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  async function handleCopy() {
    try {
      setLoading(true)
      const res = await fetch(`/api/workspaces/${workspaceId}/copy`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to copy")
      }
      const data = await res.json()
      router.push(`/workspaces/${data.graph.id}`)
    } catch (e: any) {
      console.error(e)
      alert(e.message || "Failed to save to your graphs")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="default" size="sm" onClick={handleCopy} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
      Save to my graphs
    </Button>
  )
}
