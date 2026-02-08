"use client"

import * as React from "react"
import { IconBell, IconCheck, IconUsers, IconMail, IconBug, IconX, IconUserPlus, IconBulb } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface NotificationsListProps {
  userId: string
}

export function NotificationsList({ userId }: NotificationsListProps) {
  const [notifications, setNotifications] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"all" | "unread">("unread")

  const fetchNotifications = React.useCallback(async (unreadOnly: boolean = false) => {
    try {
      setLoading(true)
      const url = unreadOnly ? '/api/notifications?unread=true&limit=100' : '/api/notifications?limit=100'
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data?.notifications || [])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchNotifications(activeTab === "unread")
  }, [fetchNotifications, activeTab])

  React.useEffect(() => {
    const onNotificationUpdate = () => {
      fetchNotifications(activeTab === "unread")
    }
    window.addEventListener("notification:updated", onNotificationUpdate as EventListener)
    return () => window.removeEventListener("notification:updated", onNotificationUpdate as EventListener)
  }, [fetchNotifications, activeTab])

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to mark all as read")
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      window.dispatchEvent(new Event("notification:updated"))
      toast.success("All notifications marked as read")
    } catch (error) {
      toast.error("Failed to mark all as read")
    }
  }

  const handleAcceptInvite = async (notification: any) => {
    if (!notification.cluster_id) {
      toast.error("Invalid invitation")
      return
    }

    try {
      const { acceptClusterInvite } = await import("@/app/actions/cluster")
      const result = await acceptClusterInvite(notification.cluster_id)

      if (!result.success) {
        throw new Error(result.error || 'Failed to accept invitation')
      }

      // Update notification to read
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      )

      window.dispatchEvent(new Event("notification:updated"))
      toast.success(result.message || "Invitation accepted! You are now a member of the cluster.")
      
      // Refresh after a short delay to show the cluster
      setTimeout(() => {
        window.location.href = '/dashboard/clusters'
      }, 1000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to accept invitation")
    }
  }

  const handleDeclineInvite = async (notification: any) => {
    if (!notification.cluster_id) {
      toast.error("Invalid invitation")
      return
    }

    try {
      const res = await fetch(`/api/clusters/${notification.cluster_id}/decline`, {
        method: "POST",
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to decline invitation")
      }

      setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
      window.dispatchEvent(new Event("notification:updated"))
      toast.success("Invitation declined")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to decline invitation")
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'cluster_invite':
        return <IconUsers className="size-5" />
      case 'cluster_joined':
        return <IconUsers className="size-5" />
      case 'cluster_removed':
        return <IconUsers className="size-5" />
      case 'bug_assigned':
      case 'bug_updated':
        return <IconBug className="size-5" />
      case 'solution_created':
        return <IconBulb className="size-5" />
      default:
        return <IconBell className="size-5" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'cluster_invite':
        return 'bg-blue-500'
      case 'cluster_joined':
        return 'bg-green-500'
      case 'cluster_removed':
        return 'bg-red-500'
      case 'bug_assigned':
      case 'bug_updated':
        return 'bg-orange-500'
      case 'solution_created':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const allNotifications = notifications
  const unreadNotifications = notifications.filter(n => !n.read)

  return (
    <div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "unread")}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="unread" className="flex-1 sm:flex-initial">
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1 sm:flex-initial">
              All ({notifications.length})
            </TabsTrigger>
          </TabsList>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="w-full sm:w-auto">
              <IconCheck className="size-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        <TabsContent value="unread" className="mt-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : unreadNotifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <IconBell className="size-12 mx-auto mb-4 opacity-50" />
              <p>No unread notifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {unreadNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onAcceptInvite={handleAcceptInvite}
                  onDeclineInvite={handleDeclineInvite}
                  getIcon={getNotificationIcon}
                  getColor={getNotificationColor}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : allNotifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <IconBell className="size-12 mx-auto mb-4 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onAcceptInvite={handleAcceptInvite}
                  onDeclineInvite={handleDeclineInvite}
                  getIcon={getNotificationIcon}
                  getColor={getNotificationColor}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface NotificationCardProps {
  notification: any
  onAcceptInvite?: (notification: any) => void
  onDeclineInvite?: (notification: any) => void
  getIcon: (type: string) => React.ReactNode
  getColor: (type: string) => string
}

function NotificationCard({
  notification,
  onAcceptInvite,
  onDeclineInvite,
  getIcon,
  getColor,
}: NotificationCardProps) {
  const created = notification.created_at ? new Date(notification.created_at) : new Date()
  const timeAgo = getTimeAgo(created)

  return (
    <Card className={notification.read ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`${getColor(notification.type)} text-white rounded-full p-2 flex-shrink-0`}>
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base">{notification.title}</CardTitle>
                {!notification.read && (
                  <Badge variant="default" className="h-5 px-1.5 text-xs">New</Badge>
                )}
              </div>
              {notification.message && (
                <CardDescription className="mt-1">{notification.message}</CardDescription>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{timeAgo}</span>
                {notification.cluster_id && (
                  <span className="flex items-center gap-1">
                    <IconUsers className="size-3" />
                    Cluster
                  </span>
                )}
                {notification.bug_id && (
                  <span className="flex items-center gap-1">
                    <IconBug className="size-3" />
                    Bug
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {notification.type === 'cluster_invite' && !notification.read && onAcceptInvite && (
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onAcceptInvite(notification)}
                  className="h-8"
                  title="Accept invitation"
                >
                  <IconUserPlus className="size-4 mr-1" />
                  Accept
                </Button>
                {onDeclineInvite && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeclineInvite(notification)}
                    className="h-8"
                    title="Decline invitation"
                  >
                    <IconX className="size-4 mr-1" />
                    Decline
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return date.toLocaleDateString()
}
