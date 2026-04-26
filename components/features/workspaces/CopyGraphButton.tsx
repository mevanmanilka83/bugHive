"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, Copy } from "lucide-react"
import { toast } from "sonner"

export function CopyGraphButton({ workspaceId }: { workspaceId: string }) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  async function postWithRetry(url: string, attempts = 2) {
    let lastErr: unknown = null
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(url, { method: "POST" })
        if (!res.ok) {
          const err = await res.json().catch(() => null)
          const msg = err?.error || "Failed to copy"
          if (i < attempts - 1 && (res.status >= 500 || res.status === 429)) {
            await new Promise((r) => setTimeout(r, 500 * (i + 1)))
            continue
          }
          throw new Error(msg)
        }
        return res
      } catch (e) {
        lastErr = e
        if (i < attempts - 1) {
          await new Promise((r) => setTimeout(r, 500 * (i + 1)))
          continue
        }
        throw lastErr
      }
    }
    throw lastErr
  }

  async function handleCopy() {
    try {
      setLoading(true)
      const res = await postWithRetry(`/api/workspaces/${workspaceId}/copy`, 2)
      const data = await res.json()
      toast.success("Saved to your graphs")
      router.push(`/workspaces/${data.graph.id}`)
    } catch (e: any) {
      toast.error(e?.message || "Failed to save to your graphs")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      disabled={loading}
      className="gap-2 h-10 px-4"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
      <span>Save to my graphs</span>
    </Button>
  )
}
