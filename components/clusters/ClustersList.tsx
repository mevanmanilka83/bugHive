"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconPlus, IconUsers, IconMail, IconTrash, IconSettings, IconAlertTriangle } from "@tabler/icons-react"
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
import { InviteUserDialog } from "./InviteUserDialog"
import { getClusters, deleteCluster } from "@/app/actions/cluster"

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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        {loading ? (
          <Skeleton className="h-5 w-24" />
        ) : (
          <p className="text-sm text-muted-foreground">
            {clusters.length} cluster{clusters.length !== 1 ? 's' : ''}
          </p>
        )}
        <Button onClick={() => setCreateDialogOpen(true)} className="rounded-full px-4">
          <IconPlus className="size-4 mr-2" />
          Create Cluster
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{cluster.name}</CardTitle>
                      {cluster.description && (
                        <CardDescription className="mt-1">{cluster.description}</CardDescription>
                      )}
                    </div>
                    {isOwner && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleInviteClick(cluster)
                          }}
                          className="h-8 w-8"
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
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <IconTrash className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <IconUsers className="size-4" />
                        {memberCount} member{memberCount !== 1 ? 's' : ''}
                      </span>
                      {inviteCount > 0 && (
                        <span className="flex items-center gap-1">
                          <IconMail className="size-4" />
                          {inviteCount} pending
                        </span>
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
              variant="destructive"
              onClick={handleDeleteCluster}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
