/**
 * Client-Safe Utilities
 * 
 * Utilities that are safe to use on the client side.
 * These don't depend on server-only modules like Supabase.
 * 
 * Import from this file in client components to avoid
 * triggering server-side code evaluation.
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// ============================================================================
// TAILWIND UTILITIES
// ============================================================================

/**
 * Merges Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// UUID GENERATION & VALIDATION
// ============================================================================

/**
 * Generates a random UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Generate a deterministic UUID from an email address
 */
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

/**
 * Returns true if the string is a valid UUID (v4 format).
 * Use for client-side validation before calling APIs (e.g. bug id).
 */
export function isValidUUID(str: string | undefined | null): boolean {
  return typeof str === "string" && UUID_REGEX.test(str.trim())
}

/**
 * Ensures a value is a valid UUID, generating one if needed
 */
export function ensureValidUUID(userId: string | undefined): string {
  if (!userId) return '00000000-0000-0000-0000-000000000000'
  if (UUID_REGEX.test(userId)) return userId
  return generateUUID()
}

// ============================================================================
// EMAIL & USERNAME UTILITIES
// ============================================================================

/**
 * Extracts username from email address
 */
export function extractUsernameFromEmail(email: string | null | undefined, fallback: string = 'User'): string {
  if (!email) return fallback
  const parts = email.split('@')
  return parts[0] || fallback
}

// ============================================================================
// HTML UTILITIES
// ============================================================================

/**
 * Strip HTML tags for plain-text snippet (e.g. list previews, search).
 * Does not sanitize; use only for display of trusted content.
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== "string") return ""
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

/**
 * Removes markdown bold markers (**text** → text) for plain-text display (e.g. comments).
 * Use for content that may have been stored with markdown.
 */
export function stripMarkdownBold(text: string): string {
  if (!text || typeof text !== "string") return ""
  return text.replace(/\*\*([^*]*)\*\*/g, "$1").trim()
}

/**
 * Whether the string looks like HTML (e.g. from rich editor).
 */
export function isHtmlContent(s: string): boolean {
  if (!s || typeof s !== "string") return false
  const t = s.trim()
  return t.startsWith("<") && t.endsWith(">")
}

// ============================================================================
// CLIENT PREFERENCES (localStorage)
// ============================================================================

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

// ============================================================================
// CLUSTER PREFERENCES (localStorage)
// ============================================================================

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

// ============================================================================
// NOTIFICATION PREFERENCES (localStorage)
// ============================================================================

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

// ============================================================================
// LANGUAGE / LOCALE (localStorage)
// ============================================================================

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
