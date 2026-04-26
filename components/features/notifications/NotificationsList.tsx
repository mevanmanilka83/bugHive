"use client"

import * as React from "react"
import Link from "next/link"
import { IconBell, IconCheck, IconUsers, IconMail, IconBug, IconX, IconUserPlus, IconBulb } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { NotificationsListSkeleton } from "@/components/features/skeletons/NotificationsListSkeleton"

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

  const markNotificationRead = async (notificationId: string) => {
    // Best-effort: we also update local state so UI feels instant.
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    )
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      })
    } catch {
    } finally {
      window.dispatchEvent(new Event("notification:updated"))
    }
  }

  const markNotificationUnread = async (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n))
    )
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: false }),
      })
    } catch {
    } finally {
      window.dispatchEvent(new Event("notification:updated"))
    }
  }

  const getNotificationHref = (notification: any) => {
    if (notification?.bug_id) return `/bugs/${notification.bug_id}`
    if (notification?.cluster_id) return `/clusters/${notification.cluster_id}`
    return null
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

      await markNotificationRead(notification.id)
      toast.success(result.message || "Invitation accepted! You are now a member of the cluster.")

      // After accepting, navigate directly to the cluster detail page
      const targetClusterId = notification.cluster_id
      if (targetClusterId) {
        setTimeout(() => {
          window.location.href = `/clusters/${targetClusterId}`
        }, 800)
      }
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

  const handleRespondJoinRequest = async (notification: any, action: "accept" | "decline") => {
    if (!notification.cluster_id || !notification.bug_id) {
      toast.error("Invalid join request")
      return
    }

    try {
      const res = await fetch(`/api/clusters/${notification.cluster_id}/join-requests/${notification.bug_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to update request")
      }

      await markNotificationRead(notification.id)
      toast.success(action === "accept" ? "Request accepted" : "Request declined")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update request")
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'cluster_invite':
        return <IconUsers className="size-5" />
      case 'cluster_join_request':
        return <IconUserPlus className="size-5" />
      case 'cluster_joined':
        return <IconUsers className="size-5" />
      case 'cluster_join_declined':
        return <IconX className="size-5" />
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
      case 'cluster_join_request':
        return 'bg-indigo-500'
      case 'cluster_joined':
        return 'bg-green-500'
      case 'cluster_join_declined':
        return 'bg-red-500'
      case 'cluster_removed':
        return 'bg-red-500'
      case 'bug_assigned':
      case 'bug_updated':
        return 'bg-primary'
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
          <TabsList className="w-full sm:w-auto border border-border/60 bg-muted/40">
            <TabsTrigger
              value="unread"
              className="flex-1 sm:flex-initial data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="flex-1 sm:flex-initial data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
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
            <NotificationsListSkeleton count={3} />
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
                  href={getNotificationHref(notification)}
                  onAcceptInvite={handleAcceptInvite}
                  onDeclineInvite={handleDeclineInvite}
                  onRespondJoinRequest={handleRespondJoinRequest}
                  onMarkRead={() => markNotificationRead(notification.id)}
                  onMarkUnread={() => markNotificationUnread(notification.id)}
                  getIcon={getNotificationIcon}
                  getColor={getNotificationColor}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          {loading ? (
            <NotificationsListSkeleton count={5} />
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
                  href={getNotificationHref(notification)}
                  onAcceptInvite={handleAcceptInvite}
                  onDeclineInvite={handleDeclineInvite}
                  onRespondJoinRequest={handleRespondJoinRequest}
                  onMarkRead={() => markNotificationRead(notification.id)}
                  onMarkUnread={() => markNotificationUnread(notification.id)}
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
  href: string | null
  onAcceptInvite?: (notification: any) => void
  onDeclineInvite?: (notification: any) => void
  onRespondJoinRequest?: (notification: any, action: "accept" | "decline") => void
  onMarkRead: () => void
  onMarkUnread: () => void
  getIcon: (type: string) => React.ReactNode
  getColor: (type: string) => string
}

function NotificationCard({
  notification,
  href,
  onAcceptInvite,
  onDeclineInvite,
  onRespondJoinRequest,
  onMarkRead,
  onMarkUnread,
  getIcon,
  getColor,
}: NotificationCardProps) {
  const created = notification.created_at ? new Date(notification.created_at) : new Date()
  const timeAgo = getTimeAgo(created)
  const canOpen = Boolean(href)
  const isUnread = !notification.read

  return (
    <Card
      className={[
        "transition-colors",
        isUnread ? "border-border/70 bg-card" : "border-border/50 bg-card/60",
        isUnread ? "shadow-sm" : "",
        isUnread ? "border-l-4 border-l-primary" : "border-l-4 border-l-transparent",
        canOpen ? "hover:bg-muted/20" : "",
      ].join(" ")}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`${getColor(notification.type)} text-white rounded-full p-2 flex-shrink-0`}>
              {getIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base leading-snug">
                  {canOpen ? (
                    <Link
                      href={href as string}
                      className="hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 rounded-sm"
                      onClick={() => {
                        if (isUnread) onMarkRead()
                      }}
                    >
                      {notification.title}
                    </Link>
                  ) : (
                    notification.title
                  )}
                </CardTitle>
                {isUnread ? (
                  <Badge variant="secondary" className="h-5 rounded-full px-2 text-[11px] font-medium">
                    New
                  </Badge>
                ) : null}
              </div>
              {notification.message ? (
                <CardDescription className="mt-1 line-clamp-2">
                  {notification.message}
                </CardDescription>
              ) : null}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                <span className="tabular-nums">{timeAgo}</span>
                {notification.cluster_id ? (
                  <span className="flex items-center gap-1">
                    <IconUsers className="size-3" />
                    {notification.cluster_name ? (
                      <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                        {notification.cluster_name}
                      </Badge>
                    ) : (
                      "Cluster"
                    )}
                  </span>
                ) : null}
                {notification.bug_id && notification.type !== "cluster_join_request" ? (
                  <span className="flex items-center gap-1">
                    <IconBug className="size-3" />
                    Bug
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {canOpen ? (
              <Button asChild variant="outline" size="sm" className="h-8">
                <Link
                  href={href as string}
                  onClick={() => {
                    if (isUnread) onMarkRead()
                  }}
                >
                  Open
                </Link>
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => (isUnread ? onMarkRead() : onMarkUnread())}
            >
              {isUnread ? "Mark read" : "Mark unread"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {(notification.type === "cluster_invite" && isUnread && onAcceptInvite) ||
      (notification.type === "cluster_join_request" && isUnread) ? (
        <CardContent className="pt-0">
          <div className="flex flex-wrap items-center gap-2">
            {notification.type === "cluster_invite" && isUnread && onAcceptInvite ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAcceptInvite(notification)}
                  className="h-8 px-3 gap-1"
                >
                  <IconUserPlus className="size-4" />
                  <span>Accept</span>
                </Button>
                {onDeclineInvite ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeclineInvite(notification)}
                    className="h-8 px-3 gap-1"
                  >
                    <IconX className="size-4" />
                    <span>Decline</span>
                  </Button>
                ) : null}
              </>
            ) : null}

            {notification.type === "cluster_join_request" && isUnread ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRespondJoinRequest?.(notification, "accept")}
                  className="h-8 px-3 gap-1"
                >
                  <IconCheck className="size-4" />
                  <span>Accept</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRespondJoinRequest?.(notification, "decline")}
                  className="h-8 px-3 gap-1"
                >
                  <IconX className="size-4" />
                  <span>Decline</span>
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      ) : null}
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
