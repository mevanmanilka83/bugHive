"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconPlus, IconUsers, IconMail, IconTrash, IconSettings, IconAlertTriangle, IconPencil } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
import { getClusters, deleteCluster } from "@/app/actions/cluster"
import { stripHtml } from "@/lib/utils-client"

interface ClustersListProps {
  userId: string
  /** Base path for cluster links (e.g. "/clusters" for homepage UI, "/dashboard" for dashboard) */
  basePath?: string
}

export function ClustersList({ userId, basePath = "/dashboard" }: ClustersListProps) {
  const router = useRouter()
  const [clusters, setClusters] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [clusterToDelete, setClusterToDelete] = React.useState<any | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [selectedCluster, setSelectedCluster] = React.useState<any | null>(null)
  const [pendingDialogOpen, setPendingDialogOpen] = React.useState(false)
  const [pendingCluster, setPendingCluster] = React.useState<any | null>(null)
  const [membersDialogOpen, setMembersDialogOpen] = React.useState(false)
  const [membersCluster, setMembersCluster] = React.useState<any | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [clusterToEdit, setClusterToEdit] = React.useState<any | null>(null)

  const previewText = (html: string, maxChars = 120) => {
    const text = stripHtml(html).replace(/\s+/g, " ").trim()
    if (text.length <= maxChars) return text
    return `${text.slice(0, maxChars).trim()}...`
  }

  const fetchClusters = React.useCallback(async () => {
    try {
      setLoading(true)
      const result = await getClusters()
      if (result.success) {
        setClusters(result.clusters || [])
      }
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
    const onCreated = () => fetchClusters()
    window.addEventListener("cluster:created", onCreated as EventListener)
    return () => window.removeEventListener("cluster:created", onCreated as EventListener)
  }, [fetchClusters])

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

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {loading ? (
          <Skeleton className="h-5 w-24" />
        ) : (
          <p className="text-sm text-muted-foreground">
            {clusters.length} cluster{clusters.length !== 1 ? 's' : ''}
          </p>
        )}
        <Button onClick={() => setCreateDialogOpen(true)} className="w-full rounded-full px-4 sm:w-auto">
          <IconPlus className="size-4 mr-2" />
          Create Cluster
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : clusters.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <IconUsers className="size-12 mx-auto mb-4 opacity-50" />
            <p>No clusters found. Create your first cluster!</p>
          </div>
        ) : (
          clusters.map((cluster) => {
            const isOwner = cluster.owner_id === userId
            const memberCount = cluster.members?.length || 0
            const inviteCount = cluster.invites?.length || 0

            return (
              <Card 
                key={cluster.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={(e) => {
                  // Don't navigate if clicking on action buttons
                  if ((e.target as HTMLElement).closest('button')) {
                    return
                  }
                  router.push(basePath === "/clusters" ? `/clusters/${cluster.id}` : `/dashboard/clusters/${cluster.id}`)
                }}
              >
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg">{cluster.name}</CardTitle>
                      {cluster.description && (
                        <CardDescription className="mt-1 line-clamp-2 text-ellipsis sm:whitespace-nowrap sm:overflow-hidden">
                          {previewText(cluster.description)}
                        </CardDescription>
                      )}
                    </div>
                    {isOwner && (
                      <div className="flex gap-1 shrink-0 self-end sm:self-start">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditClick(cluster)
                          }}
                          className="h-11 min-w-[44px] w-11 sm:h-8 sm:min-w-0 sm:w-8"
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
                          className="h-11 min-w-[44px] w-11 sm:h-8 sm:min-w-0 sm:w-8"
                          aria-label="Invite to cluster"
                        >
                          <IconMail className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(cluster)
                          }}
                          className="h-11 min-w-[44px] w-11 sm:h-8 sm:min-w-0 sm:w-8 text-destructive hover:text-destructive"
                          aria-label="Delete cluster"
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2 justify-between text-sm text-muted-foreground">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="flex items-center gap-1"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleMembersClick(cluster)
                        }}
                      >
                        <IconUsers className="size-4" />
                        {memberCount} member{memberCount !== 1 ? 's' : ''}
                      </button>
                      {inviteCount > 0 && (
                        <button
                          type="button"
                          className="flex items-center gap-1 hover:text-foreground transition-colors mr-2"
                          onClick={(event) => {
                            event.stopPropagation()
                            handlePendingClick(cluster)
                          }}
                        >
                          <IconMail className="size-4" />
                          {inviteCount} pending
                        </button>
                      )}
                    </div>
                    {isOwner && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        Owner
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <CreateClusterDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleClusterCreated}
      />

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

      <PendingInvitesDialog
        open={pendingDialogOpen}
        onOpenChange={setPendingDialogOpen}
        cluster={pendingCluster}
      />

      <ClusterMembersDialog
        open={membersDialogOpen}
        onOpenChange={setMembersDialogOpen}
        cluster={membersCluster}
      />

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
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteCluster}
              disabled={deleting}
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditClusterDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        cluster={clusterToEdit}
        onSuccess={() => {
          setClusterToEdit(null)
          fetchClusters()
        }}
      />
    </div>
  )
}
