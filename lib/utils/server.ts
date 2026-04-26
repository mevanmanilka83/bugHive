
export {
  cn,
  generateUUID,
  generateUUIDFromEmailSync,
  ensureValidUUID,
  isValidUUID,
  extractUsernameFromEmail,
  stripHtml,
  stripMarkdownBold,
  isHtmlContent,
  CLUSTER_VIEW_MODE_KEY,
  getClusterViewMode,
  setClusterViewMode,
  CLUSTER_DEFAULT_VISIBILITY_KEY,
  CLUSTER_INVITE_ALLOW_ANYONE_KEY,
  CLUSTER_INVITE_AUTO_ACCEPT_KEY,
  getClusterDefaultVisibility,
  setClusterDefaultVisibility,
  type ClusterViewMode,
  type ClusterVisibility,
  NOTIFICATION_EMAIL_INVITES_KEY,
  NOTIFICATION_EMAIL_JOIN_REQUESTS_KEY,
  NOTIFICATION_EMAIL_MENTIONS_KEY,
  NOTIFICATION_INAPP_BADGE_KEY,
  NOTIFICATION_INAPP_CENTER_KEY,
  getEmailInvitesEnabled,
  setEmailInvitesEnabled,
  getEmailJoinRequestsEnabled,
  setEmailJoinRequestsEnabled,
  getEmailMentionsEnabled,
  setEmailMentionsEnabled,
  getInAppBadgeEnabled,
  setInAppBadgeEnabled,
  getInAppCenterEnabled,
  setInAppCenterEnabled,
  getClusterInviteAllowAnyone,
  setClusterInviteAllowAnyone,
  getClusterInviteAutoAccept,
  setClusterInviteAutoAccept,
  LOCALE_KEY,
  getAppLocale,
  setAppLocale,
  getLocaleLabel,
  type AppLocale,
  fetchWithRetry,
} from "./client"

export function addTimestamps(data: Record<string, any>): Record<string, any> {
  const now = new Date().toISOString()
  return {
    ...data,
    updated_at: now,
    ...(data.created_at ? {} : { created_at: now })
  }
}

export function parseArrayField(value: string | null): string[] | null {
  if (!value) return null
  
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.map(s => s.toString())
    }
  } catch {
    return value.split(',').map(s => s.trim()).filter(Boolean)
  }
  
  return null
}

export function parseQueryFilters(searchParams: URLSearchParams | null): {
  filterField?: string
  filterValue?: string
  limit?: number
} {
  if (!searchParams) {
    return {}
  }
  
  const createdByParam = searchParams.get('created_by')
  const clusterIdParam = searchParams.get('cluster_id')
  const filterField = clusterIdParam ? 'cluster_id' : (createdByParam ? 'created_by' : undefined)
  const filterValue: string | undefined = clusterIdParam ?? createdByParam ?? undefined
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
  
  return { filterField, filterValue, limit }
}

export async function extractRouteId(context: any): Promise<string> {
  const params = context?.params
  if (!params) throw new Error("Missing route params")
  
  const resolvedParams = typeof params.then === 'function' ? await params : params
  const id = resolvedParams.id || resolvedParams.bugId || resolvedParams.clusterId
  
  if (!id) throw new Error("Missing ID in route params")
  return typeof id === 'string' ? id : await id
}
