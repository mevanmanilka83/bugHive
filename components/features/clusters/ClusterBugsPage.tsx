"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconReport, IconArrowLeft, IconUsers, IconPencil, IconUserPlus, IconCheck, IconX } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BugReportDialog } from "@/components/features/bugs/reports/BugReportDialog"
import { ClusterBugsList } from "./ClusterBugsList"
import { ClusterMembersDialog } from "./ClusterMembersDialog"
import { EditClusterDialog } from "./EditClusterDialog"
import { ClusterBugsPageSkeleton } from "@/components/features/skeletons/ClusterBugsPageSkeleton"

interface ClusterBugsPageProps {
  clusterId: string
  userId?: string
  isAuthenticated?: boolean
  /** Link for "Back to Clusters" and error redirects (e.g. "/clusters" or "/dashboard/clusters") */
  clustersHref?: string
  /** Base href for bug details, e.g. "/bugs" or "/clusters/:id/bugs" */
  bugDetailsBaseHref?: string
}

export function ClusterBugsPage({
  clusterId,
  userId,
  isAuthenticated = true,
  clustersHref = "/dashboard/clusters",
  bugDetailsBaseHref,
}: ClusterBugsPageProps) {
  const router = useRouter()
  const [cluster, setCluster] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [membersDialogOpen, setMembersDialogOpen] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [myJoinRequest, setMyJoinRequest] = React.useState<{ id: string; status: string } | null>(null)
  const [joinRequests, setJoinRequests] = React.useState<any[]>([])
  const [requestingJoin, setRequestingJoin] = React.useState(false)
  const [respondingTo, setRespondingTo] = React.useState<string | null>(null)

  const fetchCluster = React.useCallback(async () => {
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
  }, [clusterId, router, clustersHref])

  React.useEffect(() => {
    if (clusterId) fetchCluster()
  }, [clusterId, fetchCluster])

  const isMember = Boolean(userId) && cluster && cluster.members && cluster.members.includes(userId)

  React.useEffect(() => {
    if (!clusterId || !cluster || isMember || !isAuthenticated) return
    if (cluster.visibility !== "public") return
    let cancelled = false
    fetch(`/api/clusters/${clusterId}/my-join-request`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled && data?.request) setMyJoinRequest({ id: data.request.id, status: data.request.status })
      })
    return () => { cancelled = true }
  }, [clusterId, cluster, isMember])

  React.useEffect(() => {
    if (!clusterId || !cluster) return
    const isOwner = isAuthenticated && userId && cluster.owner_id === userId
    if (!isOwner) return
    let cancelled = false
    fetch(`/api/clusters/${clusterId}/join-requests`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled && data?.join_requests) setJoinRequests(data.join_requests)
      })
    return () => { cancelled = true }
  }, [clusterId, cluster, userId])

  const handleRequestJoin = async () => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(clustersHref)}`)
      return
    }
    setRequestingJoin(true)
    try {
      const res = await fetch(`/api/clusters/${clusterId}/request-join`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || "Failed to send request")
        return
      }
      toast.success("Join request sent")
      setMyJoinRequest({ id: data.request?.id, status: "pending" })
    } finally {
      setRequestingJoin(false)
    }
  }

  const handleRespondToRequest = async (requestId: string, action: "accept" | "decline") => {
    setRespondingTo(requestId)
    try {
      const res = await fetch(`/api/clusters/${clusterId}/join-requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error || "Failed to update request")
        return
      }
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId))
      if (action === "accept" && data.cluster) {
        setCluster((prev: any) => (prev ? { ...prev, members: data.cluster.members, members_usernames: data.cluster.members_usernames } : prev))
      }
      toast.success(action === "accept" ? "Request accepted" : "Request declined")
    } finally {
      setRespondingTo(null)
    }
  }

  if (loading) {
    return <ClusterBugsPageSkeleton />
  }

  if (!cluster) {
    const backLabel = clustersHref === "/clusters" ? "Back to Public clusters" : "Back to Clusters"
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Cluster not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(clustersHref)}
        >
          <IconArrowLeft className="size-4 mr-2" />
          {backLabel}
        </Button>
      </div>
    )
  }

  const isOwner = isAuthenticated && userId && cluster.owner_id === userId
  const memberCount = cluster.members?.length || 0
  const isPublic = cluster.visibility === "public"
  const showBugsList = isMember || isPublic
  const canReportBug = isMember
  const backLabel = clustersHref === "/clusters" ? "Back to Public clusters" : "Back to Clusters"

  return (
    <div className="min-w-0">
      <div className="mb-3">
        <Link
          href={clustersHref}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft className="size-4" />
          {backLabel}
        </Link>
      </div>
      <div className="mb-4 rounded-lg border bg-background/80 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold mb-1 sm:text-2xl break-words">{cluster.name}</h1>
            {cluster.description && (
              <>
                <div
                  className="prose prose-sm max-w-2xl text-muted-foreground mb-2 [overflow-wrap:anywhere] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: cluster.description }}
                />
                <Separator className="my-2" />
              </>
            )}
            <div className="my-1 flex flex-wrap items-center gap-3 pt-1 text-sm text-muted-foreground">
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
              {!isMember && isPublic && (
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded shrink-0">
                  Public
                </span>
              )}
            </div>
          </div>
          <div className="flex w-full items-center justify-end gap-2 shrink-0 sm:w-auto">
            {isOwner && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setEditDialogOpen(true)}
                className="h-9 w-9 rounded-full shrink-0"
                aria-label="Edit cluster"
              >
                <IconPencil className="size-4" />
              </Button>
            )}
            {canReportBug && <BugReportDialog clusterId={clusterId} />}
            {!isMember && isPublic && !myJoinRequest && (
              <Button onClick={handleRequestJoin} disabled={requestingJoin} className="rounded-full shrink-0">
                <IconUserPlus className="size-4 mr-2" />
                {requestingJoin ? "Sending..." : "Request to join"}
              </Button>
            )}
            {!isMember && isPublic && myJoinRequest?.status === "pending" && (
              <span className="text-sm text-muted-foreground shrink-0">Request pending</span>
            )}
          </div>
        </div>
      </div>

      {isOwner && joinRequests.length > 0 && (
        <div className="mb-4 rounded-lg border bg-background/80 p-4">
          <h2 className="text-sm font-semibold mb-3">Join requests</h2>
          <ul className="space-y-2">
            {joinRequests.map((req) => (
              <li key={req.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2">
                <span className="text-sm">
                  {req.user?.name || req.user?.email || "User"} requested to join
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={respondingTo !== null}
                    onClick={() => handleRespondToRequest(req.id, "decline")}
                  >
                    <IconX className="size-4 sm:mr-1" />
                    <span className="hidden sm:inline">Decline</span>
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={respondingTo !== null}
                    onClick={() => handleRespondToRequest(req.id, "accept")}
                  >
                    <IconCheck className="size-4 sm:mr-1" />
                    <span className="hidden sm:inline">Accept</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isMember && !isPublic && (
        <div className="mb-4 rounded-lg border bg-muted/50 p-6 text-center text-muted-foreground">
          <p>This cluster is private. Only members can view bugs and content.</p>
        </div>
      )}

      {showBugsList && (
        <ClusterBugsList
          clusterId={clusterId}
          userId={userId || ""}
          bugDetailsBaseHref={bugDetailsBaseHref}
        />
      )}

      <ClusterMembersDialog
        open={membersDialogOpen}
        onOpenChange={setMembersDialogOpen}
        cluster={cluster}
      />

      <EditClusterDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        cluster={cluster}
        onSuccess={(updated) => {
          setCluster((prev: any) => (prev ? { ...prev, name: updated.name, description: updated.description, visibility: updated.visibility ?? prev.visibility } : null))
        }}
      />
    </div>
  )
}

