"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { PlusIcon } from "@/components/ui/plus"
import { DeleteIcon } from "@/components/ui/delete"
import { IconUsers, IconMail, IconSettings, IconAlertTriangle, IconPencil, IconUserPlus, IconLayoutGrid, IconList, IconLayoutRows, IconCopy } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggleGroup"
import { ClustersListSkeleton } from "@/components/features/skeletons/ClustersListSkeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CreateClusterDialog } from "./CreateClusterDialog"
import { EditClusterDialog } from "./EditClusterDialog"
import { InviteUserDialog } from "./InviteUserDialog"
import { PendingInvitesDialog } from "./PendingInvitesDialog"
import { ClusterMembersDialog } from "./ClusterMembersDialog"
import { deleteCluster, duplicateCluster } from "@/app/actions/cluster"
import { stripHtml, getClusterViewMode, setClusterViewMode } from "@/lib"

interface ClustersListProps {
  userId?: string
  isAuthenticated: boolean
  /** Base path for cluster links (e.g. "/clusters" for homepage UI, "/dashboard" for dashboard) */
  basePath?: string
  title?: string
  description?: string
  /** Layout variant: default = standalone card, embedded = inside another card (e.g. /clusters page) */
  variant?: "default" | "embedded"
}

export function ClustersList({
  userId,
  isAuthenticated,
  basePath = "/dashboard",
  title,
  description,
  variant = "default",
}: ClustersListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const returnTo = React.useMemo(() => {
    const qs = searchParams?.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }, [pathname, searchParams])
  const [clusters, setClusters] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [clusterToDelete, setClusterToDelete] = React.useState<any | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [duplicatingClusterId, setDuplicatingClusterId] = React.useState<string | null>(null)
  const [selectedCluster, setSelectedCluster] = React.useState<any | null>(null)
  const [pendingDialogOpen, setPendingDialogOpen] = React.useState(false)
  const [pendingCluster, setPendingCluster] = React.useState<any | null>(null)
  const [membersDialogOpen, setMembersDialogOpen] = React.useState(false)
  const [membersCluster, setMembersCluster] = React.useState<any | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [clusterToEdit, setClusterToEdit] = React.useState<any | null>(null)
  const [visibilityFilter, setVisibilityFilter] = React.useState<"private" | "public">("private")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [viewMode, setViewMode] = React.useState<"grid" | "list" | "compact">("list")
  const [requestingClusterId, setRequestingClusterId] = React.useState<string | null>(null)
  const [requestedClusters, setRequestedClusters] = React.useState<Set<string>>(new Set())

  // Hydrate view mode from localStorage before paint to avoid layout shift
  React.useLayoutEffect(() => {
    setViewMode(getClusterViewMode())
  }, [])

  const normalizeVisibility = React.useCallback((value: any) => {
    const normalized = (value ?? "private").toString().toLowerCase().trim()
    return normalized === "public" ? "public" : "private"
  }, [])

  const previewText = (html: string, maxChars = 120) => {
    const text = stripHtml(html).replace(/\s+/g, " ").trim()
    if (text.length <= maxChars) return text
    return `${text.slice(0, maxChars).trim()}...`
  }

  const fetchClusters = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/clusters")
      if (!res.ok) return
      const data = await res.json()
      setClusters(data?.clusters || [])
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false)
    }
  }, [])

  const handleClusterCreated = React.useCallback(() => {
    setCreateDialogOpen(false)
    fetchClusters()
    window.dispatchEvent(new Event("cluster:created"))
  }, [fetchClusters])

  React.useEffect(() => {
    fetchClusters()
  }, [fetchClusters])

  React.useEffect(() => {
    const hasPrivate = clusters.some((cluster) => normalizeVisibility(cluster.visibility) === "private")
    const hasPublic = clusters.some((cluster) => normalizeVisibility(cluster.visibility) === "public")
    if (!hasPrivate && hasPublic) setVisibilityFilter("public")
    if (!hasPublic && hasPrivate) setVisibilityFilter("private")
  }, [clusters, normalizeVisibility])

  React.useEffect(() => {
    const onCreated = () => fetchClusters()
    window.addEventListener("cluster:created", onCreated as EventListener)
    return () => window.removeEventListener("cluster:created", onCreated as EventListener)
  }, [fetchClusters])

  React.useEffect(() => {
    const onViewModeSync = () => setViewMode(getClusterViewMode())
    window.addEventListener("settings:clusterViewMode", onViewModeSync as EventListener)
    return () => window.removeEventListener("settings:clusterViewMode", onViewModeSync as EventListener)
  }, [])

  const handleDeleteClick = (cluster: any) => {
    setClusterToDelete(cluster)
    setDeleteDialogOpen(true)
  }

  const handleDeleteCluster = async () => {
    if (!clusterToDelete) return

    try {
      setDeleting(true)
      const result = await deleteCluster(clusterToDelete.id)

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete cluster')
      }

      toast.success(result.message || "Cluster deleted successfully")
      setDeleteDialogOpen(false)
      setClusterToDelete(null)
      fetchClusters()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete cluster")
    } finally {
      setDeleting(false)
    }
  }

  const handleInviteClick = (cluster: any) => {
    setSelectedCluster(cluster)
    setInviteDialogOpen(true)
  }

  const handleDuplicateCluster = async (cluster: any) => {
    if (!cluster?.id) return

    try {
      setDuplicatingClusterId(cluster.id)
      const result = await duplicateCluster(cluster.id)

      if (!result.success) {
        throw new Error(result.error || "Failed to duplicate cluster")
      }

      toast.success(result.message || "Cluster duplicated")
      fetchClusters()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to duplicate cluster")
    } finally {
      setDuplicatingClusterId(null)
    }
  }

  const handlePendingClick = (cluster: any) => {
    setPendingCluster(cluster)
    setPendingDialogOpen(true)
  }

  const handleMembersClick = (cluster: any) => {
    setMembersCluster(cluster)
    setMembersDialogOpen(true)
  }

  const handleEditClick = (cluster: any) => {
    setClusterToEdit(cluster)
    setEditDialogOpen(true)
  }

  const handleRequestJoin = async (clusterId: string) => {
    if (!isAuthenticated) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(returnTo)}`)
      return
    }

    setRequestingClusterId(clusterId)
    try {
      const res = await fetch(`/api/clusters/${clusterId}/request-join`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || "Failed to send request")
      }
      setRequestedClusters((prev) => new Set(prev).add(clusterId))
      toast.success("Join request sent")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send request")
    } finally {
      setRequestingClusterId(null)
    }
  }

  const filteredClusters = React.useMemo(() => {
    const term = searchQuery.trim().toLowerCase()

    return clusters.filter((cluster) => {
      const visibilityMatch = normalizeVisibility(cluster.visibility) === visibilityFilter
      if (!visibilityMatch) return false

      if (!term) return true

      const name = String(cluster.name || "").toLowerCase()
      const description = stripHtml(String(cluster.description || "")).toLowerCase()
      const owner = String(cluster.owner_username || "").toLowerCase()

      return name.includes(term) || description.includes(term) || owner.includes(term)
    })
  }, [clusters, visibilityFilter, normalizeVisibility, searchQuery])

  return (
    <div>
      <div
        className={
          variant === "default"
            ? "mb-4 rounded-none border bg-background p-4"
            : "mb-4 pb-4 border-b border-border/40"
        }
      >
        {(title || description) && (
          <div className="mb-3">
            {title && <h1 className="mb-1 text-xl font-semibold sm:text-2xl">{title}</h1>}
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p className="text-sm text-muted-foreground min-w-[120px]">
              {loading
                ? "— cluster(s)"
                : `${filteredClusters.length} ${visibilityFilter} cluster${filteredClusters.length !== 1 ? "s" : ""}`}
            </p>
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search clusters"
              className="h-8 w-full sm:w-[220px]"
            />
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
                className="flex-1 px-3 py-1 text-xs"
              >
                Private
              </ToggleGroupItem>
              <ToggleGroupItem
                value="public"
                className="flex-1 px-3 py-1 text-xs"
              >
                Public
              </ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={viewMode}
              onValueChange={(value) => {
                if (value === "grid" || value === "list" || value === "compact") {
                  setViewMode(value)
                  setClusterViewMode(value)
                }
              }}
              className="w-full sm:w-auto"
            >
              <ToggleGroupItem
                value="grid"
                className="px-2 py-1 data-[state=on]:bg-foreground data-[state=on]:text-background"
                aria-label="Grid view"
              >
                <IconLayoutGrid className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="list"
                className="px-2 py-1 data-[state=on]:bg-foreground data-[state=on]:text-background"
                aria-label="List view"
              >
                <IconList className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                value="compact"
                className="px-2 py-1 data-[state=on]:bg-foreground data-[state=on]:text-background"
                aria-label="Compact view"
              >
                <IconLayoutRows className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Button
            onClick={() => {
              if (!isAuthenticated) {
                router.push(`/auth/signin?callbackUrl=${encodeURIComponent(returnTo)}`)
                return
              }
              setCreateDialogOpen(true)
            }}
            className="w-full px-4 sm:w-auto h-10"
          >
            <PlusIcon size={16} className="size-4 mr-2" />
            Create Cluster
          </Button>
        </div>
      </div>

      <div
        className={
          viewMode === "grid"
            ? "grid gap-4 grid-cols-1 md:grid-cols-2"
            : viewMode === "compact"
              ? "grid gap-3 grid-cols-1"
              : "grid gap-4 grid-cols-1"
        }
      >
        {loading ? (
          <ClustersListSkeleton count={3} />
        ) : filteredClusters.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <IconUsers className="size-12 mx-auto mb-4 opacity-50" />
            <p>No {visibilityFilter} clusters found.</p>
          </div>
        ) : (
          filteredClusters.map((cluster) => {
            const isOwner = isAuthenticated && userId && cluster.owner_id === userId
            const isMember = Boolean(userId) && Array.isArray(cluster.members) && cluster.members.includes(userId)
            const isPublic = normalizeVisibility(cluster.visibility) === "public"
            const canRequestJoin = isPublic && !isOwner && !isMember
            const isRequesting = requestingClusterId === cluster.id
            const isRequested = requestedClusters.has(cluster.id)
            const memberCount = cluster.members?.length || 0
            const inviteCount = cluster.invites?.length || 0

            const isCompact = viewMode === "compact"

            return (
              <Card
                key={cluster.id}
                className={`cursor-pointer hover:bg-accent/50 transition-colors ${isCompact ? "" : ""}`}
                onClick={(e) => {
                  // Don't navigate if clicking on action buttons
                  if ((e.target as HTMLElement).closest('button')) {
                    return
                  }
                  router.push(basePath === "/clusters" ? `/clusters/${cluster.id}` : `/dashboard/clusters/${cluster.id}`)
                }}
              >
                <CardHeader className={isCompact ? "pb-2 pt-3" : "pb-2"}>
                  <div className={isCompact ? "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between" : "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"}>
                    <div className="min-w-0 flex-1">
                      <CardTitle className={isCompact ? "text-base leading-tight" : "text-lg leading-tight"}>{cluster.name}</CardTitle>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 border bg-muted/40 px-2.5 py-1 text-muted-foreground hover:text-foreground"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleMembersClick(cluster)
                          }}
                        >
                          <IconUsers className="size-3.5" />
                          {memberCount} member{memberCount !== 1 ? "s" : ""}
                        </button>
                        {inviteCount > 0 && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 border bg-muted/40 px-2.5 py-1 text-muted-foreground hover:text-foreground"
                            onClick={(event) => {
                              event.stopPropagation()
                              handlePendingClick(cluster)
                            }}
                          >
                            <IconMail className="size-3.5" />
                            {inviteCount} pending
                          </button>
                        )}
                        {isOwner && (
                          <Badge variant="secondary" className="text-[11px]">Owner</Badge>
                        )}
                      </div>
                    </div>
                    {isOwner && (
                      <div className="flex w-fit shrink-0 items-center gap-0.5 border bg-muted/40 p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditClick(cluster)
                          }}
                          className="h-8 w-8"
                          aria-label="Edit cluster"
                        >
                          <IconPencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleInviteClick(cluster)
                          }}
                          className="h-8 w-8"
                          aria-label="Invite to cluster"
                        >
                          <IconMail className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicateCluster(cluster)
                          }}
                          className="h-8 w-8"
                          aria-label="Duplicate cluster"
                          disabled={duplicatingClusterId === cluster.id}
                        >
                          <IconCopy className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(cluster)
                          }}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label="Delete cluster"
                        >
                          <DeleteIcon size={16} className="size-4" />
                        </Button>
                      </div>
                    )}
                    {canRequestJoin && (
                      <Button
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleRequestJoin(cluster.id)
                        }}
                        disabled={isRequesting || isRequested}
                      >
                        <IconUserPlus className="size-4 mr-1" />
                        {isRequested ? "Request sent" : isRequesting ? "Sending..." : "Request to join"}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {!isCompact && (
                  <CardContent className="pt-0">
                    {cluster.description && (
                      <CardDescription className="max-w-[52ch] break-words leading-relaxed text-muted-foreground line-clamp-3">
                        {previewText(cluster.description, 160)}
                      </CardDescription>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })
        )}
      </div>

      {isAuthenticated && (
        <CreateClusterDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleClusterCreated}
        />
      )}

      {isAuthenticated && (
        <InviteUserDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          cluster={selectedCluster}
          onSuccess={() => {
            setInviteDialogOpen(false)
            fetchClusters()
            toast.success("Invitation sent successfully")
          }}
        />
      )}

      {isAuthenticated && (
        <PendingInvitesDialog
          open={pendingDialogOpen}
          onOpenChange={setPendingDialogOpen}
          cluster={pendingCluster}
          onInvitesChanged={fetchClusters}
        />
      )}

      <ClusterMembersDialog
        open={membersDialogOpen}
        onOpenChange={setMembersDialogOpen}
        cluster={membersCluster}
      />

      {isAuthenticated && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IconAlertTriangle className="size-5 text-destructive" />
                Delete Cluster
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{clusterToDelete?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false)
                  setClusterToDelete(null)
                }}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteCluster}
                disabled={deleting}
                className="bg-foreground text-background hover:bg-foreground/90"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isAuthenticated && (
        <EditClusterDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          cluster={clusterToEdit}
          onSuccess={() => {
            setClusterToEdit(null)
            fetchClusters()
          }}
        />
      )}
    </div>
  )
}
