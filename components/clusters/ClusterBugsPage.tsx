"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconReport, IconBulb, IconArrowLeft, IconUsers } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BugReportDialog } from "@/components/bugs/reports/BugReportDialog"
import { ClusterBugsList } from "./ClusterBugsList"
import { ClusterMembersDialog } from "./ClusterMembersDialog"

interface ClusterBugsPageProps {
  clusterId: string
  userId: string
}

export function ClusterBugsPage({ clusterId, userId }: ClusterBugsPageProps) {
  const router = useRouter()
  const [cluster, setCluster] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [membersDialogOpen, setMembersDialogOpen] = React.useState(false)

  React.useEffect(() => {
    async function fetchCluster() {
      try {
        setLoading(true)
        const res = await fetch(`/api/clusters/${clusterId}`)
        if (!res.ok) {
          if (res.status === 404) {
            toast.error("Cluster not found")
            router.push("/dashboard/clusters")
            return
          }
          throw new Error("Failed to fetch cluster")
        }
        const data = await res.json()
        setCluster(data?.cluster || null)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load cluster")
        router.push("/dashboard/clusters")
      } finally {
        setLoading(false)
      }
    }

    if (clusterId) {
      fetchCluster()
    }
  }, [clusterId, router])

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!cluster) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Cluster not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard/clusters")}
        >
          <IconArrowLeft className="size-4 mr-2" />
          Back to Clusters
        </Button>
      </div>
    )
  }

  const isOwner = cluster.owner_id === userId
  const memberCount = cluster.members?.length || 0

  return (
    <div>
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/clusters")}
          className="mb-4"
        >
          <IconArrowLeft className="size-4 mr-2" />
          Back to Clusters
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-2">{cluster.name}</h1>
            {cluster.description && (
              <p className="text-muted-foreground mb-2">{cluster.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <button
                onClick={() => setMembersDialogOpen(true)}
                className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
              >
                <IconUsers className="size-4" />
                {memberCount} member{memberCount !== 1 ? 's' : ''}
              </button>
              {isOwner && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  Owner
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <BugReportDialog clusterId={clusterId} />
      </div>

      <ClusterBugsList clusterId={clusterId} userId={userId} />

      <ClusterMembersDialog
        open={membersDialogOpen}
        onOpenChange={setMembersDialogOpen}
        cluster={cluster}
      />
    </div>
  )
}

