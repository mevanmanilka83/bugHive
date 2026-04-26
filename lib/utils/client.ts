
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function generateUUIDFromEmailSync(email: string): string {
  let hash = 0
  const normalizedEmail = email.toLowerCase().trim()
  for (let i = 0; i < normalizedEmail.length; i++) {
    const char = normalizedEmail.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const hashStr = Math.abs(hash).toString(16).padStart(8, '0')
  const hashStr2 = ((hash * 31) >>> 0).toString(16).padStart(8, '0')
  const hashStr3 = ((hash * 17) >>> 0).toString(16).padStart(8, '0')
  const hashStr4 = ((hash * 7) >>> 0).toString(16).padStart(8, '0')
  const fullHash = (hashStr + hashStr2 + hashStr3 + hashStr4).substring(0, 32)
  const uuid = [
    fullHash.substring(0, 8),
    fullHash.substring(8, 12),
    '4' + fullHash.substring(13, 16),
    ((parseInt(fullHash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + fullHash.substring(17, 20),
    fullHash.substring(20, 32)
  ].join('-')
  return uuid
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUUID(str: string | undefined | null): boolean {
  return typeof str === "string" && UUID_REGEX.test(str.trim())
}

export function ensureValidUUID(userId: string | undefined): string {
  if (!userId) return '00000000-0000-0000-0000-000000000000'
  if (UUID_REGEX.test(userId)) return userId
  return generateUUID()
}

export function extractUsernameFromEmail(email: string | null | undefined, fallback: string = 'User'): string {
  if (!email) return fallback
  const parts = email.split('@')
  return parts[0] || fallback
}

export function stripHtml(html: string): string {
  if (!html || typeof html !== "string") return ""
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

export function stripMarkdownBold(text: string): string {
  if (!text || typeof text !== "string") return ""
  return text.replace(/\*\*([^*]*)\*\*/g, "$1").trim()
}

export function isHtmlContent(s: string): boolean {
  if (!s || typeof s !== "string") return false
  const t = s.trim()
  return t.startsWith("<") && t.endsWith(">")
}

export const CLUSTER_VIEW_MODE_KEY = "bugHive.clusterViewMode"
export type ClusterViewMode = "grid" | "list" | "compact"

export function getClusterViewMode(): ClusterViewMode {
  if (typeof window === "undefined") return "list"
  const raw = window.localStorage.getItem(CLUSTER_VIEW_MODE_KEY)
  if (raw === "grid" || raw === "list" || raw === "compact") return raw
  return "list"
}

export function setClusterViewMode(mode: ClusterViewMode): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(CLUSTER_VIEW_MODE_KEY, mode)
  window.dispatchEvent(new Event("settings:clusterViewMode"))
}

export const RECENTLY_VIEWED_BUGS_KEY = "bugHive.recentlyViewed.bugs"

export type RecentlyViewedBug = {
  id: string
  title: string
  priority?: string
  status?: string
  viewed_at: string
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function getRecentlyViewedBugs(limit: number = 5): RecentlyViewedBug[] {
  if (typeof window === "undefined") return []
  const parsed = safeJsonParse<unknown>(window.localStorage.getItem(RECENTLY_VIEWED_BUGS_KEY))
  const list = Array.isArray(parsed) ? (parsed as RecentlyViewedBug[]) : []
  return list
    .filter((x) => x && typeof x.id === "string" && typeof x.title === "string" && typeof x.viewed_at === "string")
    .slice(0, Math.max(0, limit))
}

export function addRecentlyViewedBug(
  bug: Omit<RecentlyViewedBug, "viewed_at">,
  opts: { limit?: number } = {}
): void {
  if (typeof window === "undefined") return
  const limit = Math.max(1, opts.limit ?? 20)
  const nextItem: RecentlyViewedBug = {
    ...bug,
    title: bug.title || "Untitled",
    viewed_at: new Date().toISOString(),
  }

  const current = getRecentlyViewedBugs(limit)
  const deduped = [nextItem, ...current.filter((x) => x.id !== bug.id)]
  window.localStorage.setItem(RECENTLY_VIEWED_BUGS_KEY, JSON.stringify(deduped.slice(0, limit)))
  window.dispatchEvent(new Event("recentlyViewed:bugs"))
}

export const CLUSTER_DEFAULT_VISIBILITY_KEY = "bugHive.clusterDefaults.visibility"
export const CLUSTER_INVITE_ALLOW_ANYONE_KEY = "bugHive.clusterDefaults.inviteAllowAnyone"
export const CLUSTER_INVITE_AUTO_ACCEPT_KEY = "bugHive.clusterDefaults.inviteAutoAccept"
export type ClusterVisibility = "private" | "public"

export function getClusterDefaultVisibility(): ClusterVisibility {
  if (typeof window === "undefined") return "private"
  const raw = window.localStorage.getItem(CLUSTER_DEFAULT_VISIBILITY_KEY)
  if (raw === "public" || raw === "private") return raw
  return "private"
}

export function setClusterDefaultVisibility(value: ClusterVisibility): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(CLUSTER_DEFAULT_VISIBILITY_KEY, value)
  window.dispatchEvent(new Event("settings:clusters"))
}

export const NOTIFICATION_EMAIL_INVITES_KEY = "bugHive.notifications.emailInvites"
export const NOTIFICATION_EMAIL_JOIN_REQUESTS_KEY = "bugHive.notifications.emailJoinRequests"
export const NOTIFICATION_EMAIL_MENTIONS_KEY = "bugHive.notifications.emailMentions"
export const NOTIFICATION_INAPP_BADGE_KEY = "bugHive.notifications.inAppBadge"
export const NOTIFICATION_INAPP_CENTER_KEY = "bugHive.notifications.inAppCenter"

function getBool(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue
  const raw = window.localStorage.getItem(key)
  if (raw === "true") return true
  if (raw === "false") return false
  return defaultValue
}

function setBool(key: string, value: boolean): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, String(value))
  window.dispatchEvent(new Event("settings:notifications"))
}

export function getEmailInvitesEnabled(): boolean {
  return getBool(NOTIFICATION_EMAIL_INVITES_KEY, true)
}
export function setEmailInvitesEnabled(value: boolean): void {
  setBool(NOTIFICATION_EMAIL_INVITES_KEY, value)
}

export function getEmailJoinRequestsEnabled(): boolean {
  return getBool(NOTIFICATION_EMAIL_JOIN_REQUESTS_KEY, true)
}
export function setEmailJoinRequestsEnabled(value: boolean): void {
  setBool(NOTIFICATION_EMAIL_JOIN_REQUESTS_KEY, value)
}

export function getEmailMentionsEnabled(): boolean {
  return getBool(NOTIFICATION_EMAIL_MENTIONS_KEY, true)
}
export function setEmailMentionsEnabled(value: boolean): void {
  setBool(NOTIFICATION_EMAIL_MENTIONS_KEY, value)
}

export function getInAppBadgeEnabled(): boolean {
  return getBool(NOTIFICATION_INAPP_BADGE_KEY, true)
}
export function setInAppBadgeEnabled(value: boolean): void {
  setBool(NOTIFICATION_INAPP_BADGE_KEY, value)
}

export function getInAppCenterEnabled(): boolean {
  return getBool(NOTIFICATION_INAPP_CENTER_KEY, true)
}
export function setInAppCenterEnabled(value: boolean): void {
  setBool(NOTIFICATION_INAPP_CENTER_KEY, value)
}

export function getClusterInviteAllowAnyone(): boolean {
  return getBool(CLUSTER_INVITE_ALLOW_ANYONE_KEY, true)
}
export function setClusterInviteAllowAnyone(value: boolean): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(CLUSTER_INVITE_ALLOW_ANYONE_KEY, String(value))
  window.dispatchEvent(new Event("settings:clusters"))
}

export function getClusterInviteAutoAccept(): boolean {
  return getBool(CLUSTER_INVITE_AUTO_ACCEPT_KEY, false)
}
export function setClusterInviteAutoAccept(value: boolean): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(CLUSTER_INVITE_AUTO_ACCEPT_KEY, String(value))
  window.dispatchEvent(new Event("settings:clusters"))
}

export const LOCALE_KEY = "bugHive.locale"
export type AppLocale = "en" | "es" | "fr" | "de"

const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
}

export function getAppLocale(): AppLocale {
  if (typeof window === "undefined") return "en"
  const raw = window.localStorage.getItem(LOCALE_KEY)
  if (raw === "en" || raw === "es" || raw === "fr" || raw === "de") return raw
  return "en"
}

export function setAppLocale(locale: AppLocale): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(LOCALE_KEY, locale)
  window.dispatchEvent(new Event("settings:locale"))
}

export function getLocaleLabel(locale: AppLocale): string {
  return LOCALE_LABELS[locale]
}

type RetryOptions = {
  attempts?: number
  baseDelayMs?: number
  retryOnStatuses?: number[]
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  opts: RetryOptions = {}
): Promise<Response> {
  const attempts = Math.max(1, opts.attempts ?? 2)
  const baseDelayMs = Math.max(0, opts.baseDelayMs ?? 500)
  const retryOnStatuses = opts.retryOnStatuses ?? [429, 500, 502, 503, 504]

  let lastErr: unknown = null
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(input, init)
      if (!res.ok && retryOnStatuses.includes(res.status) && i < attempts - 1) {
        await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)))
        continue
      }
      return res
    } catch (e) {
      lastErr = e
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)))
        continue
      }
      throw lastErr
    }
  }
  throw lastErr
}
