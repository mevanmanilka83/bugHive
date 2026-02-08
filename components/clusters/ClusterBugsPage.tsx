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
  /** Link for "Back to Clusters" and error redirects (e.g. "/clusters" or "/dashboard/clusters") */
  clustersHref?: string
}

export function ClusterBugsPage({ clusterId, userId, clustersHref = "/dashboard/clusters" }: ClusterBugsPageProps) {
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
            router.push(clustersHref)
            return
          }
          throw new Error("Failed to fetch cluster")
        }
        const data = await res.json()
        setCluster(data?.cluster || null)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load cluster")
        router.push(clustersHref)
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
          onClick={() => router.push(clustersHref)}
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
    <div className="min-w-0">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(clustersHref)}
          className="mb-4 -ml-2"
        >
          <IconArrowLeft className="size-4 mr-2" />
          Back to Clusters
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold mb-2 sm:text-2xl break-words">{cluster.name}</h1>
            {cluster.description && (
              <div
                className="prose prose-sm max-w-none text-muted-foreground mb-2 break-words overflow-hidden"
                dangerouslySetInnerHTML={{ __html: cluster.description }}
              />
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <button
                onClick={() => setMembersDialogOpen(true)}
                className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
              >
                <IconUsers className="size-4 shrink-0" />
                {memberCount} member{memberCount !== 1 ? 's' : ''}
              </button>
              {isOwner && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded shrink-0">
                  Owner
                </span>
              )}
            </div>
          </div>
          <div className="flex w-full justify-end shrink-0 sm:w-auto">
            <BugReportDialog clusterId={clusterId} />
          </div>
        </div>
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

