/**
 * Library Index - Centralized Exports
 * 
 * ⚠️ SINGLE SOURCE OF TRUTH FOR ALL LIBRARY IMPORTS ⚠️
 * 
 * Import everything from @/lib - never import from subdirectories directly.
 * 
 * Directory structure:
 * - lib/config/        → environment, supabaseClient, S3, auth
 * - lib/db/            → crudOperations
 * - lib/utils/         → server, client utilities
 * - lib/errors/        → httpResponses
 * - lib/validation/    → formValidation
 * - lib/gamification/  → badgesRanks, awardXp
 * - lib/api/           → routeHandlers, parseForms
 * - lib/storage/       → s3Uploads
 * - lib/graph/         → buildSubgraph, findRelated, relationshipTypes
 * - lib/auth/          → Authentication config and helpers
 * - lib/schemas/       → Zod schemas and TypeScript types
 * 
 * For client components, import from @/lib (cn, etc. are client-safe) or @/lib/utils/client.
 * 
 * ```ts
 * // Server-side (API routes, server actions)
 * import { cn, supabase, getSingleRecord, errorResponse } from "@/lib"
 * 
 * // Client-side (React components)
 * import { cn } from "@/lib"
 * ```
 */

// ============================================================================
// CORE UTILITIES
// ============================================================================

export {
  cn,
  generateUUID,
  generateUUIDFromEmailSync,
  ensureValidUUID,
  isValidUUID,
  addTimestamps,
  parseArrayField,
  parseQueryFilters,
  extractUsernameFromEmail,
  extractRouteId,
  stripHtml,
  stripMarkdownBold,
  isHtmlContent,
  getClusterViewMode,
  setClusterViewMode,
  getClusterDefaultVisibility,
  setClusterDefaultVisibility,
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
  getAppLocale,
  setAppLocale,
  getLocaleLabel,
} from "./utils/server"
export type { ClusterViewMode, ClusterVisibility, AppLocale } from "./utils/server"

// ============================================================================
// ERROR HANDLING
// ============================================================================

export {
  getErrorMessage,
  errorResponse,
  successResponse,
  createErrorResponse,
  handleSupabaseError
} from "./errors/httpResponses"

// ============================================================================
// VALIDATION
// ============================================================================

export { normalizeClusterDescription } from "./validation/formValidation"

// ============================================================================
// SCHEMAS (Zod & Types) - use @/lib/schemas or @/lib/schemas/types
// ============================================================================

export * from "./schemas"

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

export {
  getSingleRecord,
  getRecordOrNotFound,
  getMultipleRecords,
  insertRecord,
  updateRecord,
  deleteRecord,
  getClusterById,
  verifyClusterOwnership,
  getUserClusterIds,
  isClusterOwnerOrMember,
  canUserViewBug
} from "./db/crudOperations"

// ============================================================================
// CONFIGURATION (Database, Storage, Auth)
// ============================================================================

export { env } from "./config"
export {
  supabase,
  getSupabaseAdmin,
  getS3Client,
  handlers,
  signIn,
  signOut,
  auth
} from "./config"

// ============================================================================
// AUTH HELPERS
// ============================================================================

export {
  checkAuth,
  requireAuth,
  getAuthenticatedUserId,
  getUsernameFromSession,
  requireAuthForPage,
  type AuthenticatedSession,
  type ActionResponse
} from "./auth/helpers"

// ============================================================================
// API HANDLERS
// ============================================================================

export { createApiHandler, createBugHandler, createSolutionHandler } from "./api/routeHandlers"

// ============================================================================
// GAMIFICATION
// ============================================================================

export { getBadgeLabel, BADGE_LABELS, getRankForXp, getProgressToNextRank } from "./gamification/badgesRanks"
export {
  awardBugXP,
  checkFirstResponderBadge,
  checkDeepDiverBadge,
  checkOnFireBadge,
  awardGraphArchitectBadge,
  BUGXP,
  BADGES,
  RANKS
} from "./gamification/awardXp"

// ============================================================================
// FILE HANDLING
// ============================================================================

export { parseFormData } from "./api/parseForms"
export {
  handleFileUploads,
  processFormDataWithUploads,
  uploadAvatarFile
} from "./storage/s3Uploads"

// ============================================================================
// GRAPH
// ============================================================================

export { buildBugSubgraph } from "./graph/buildSubgraph"

// ============================================================================
// VIEWS
// ============================================================================

export { incrementViewCount, getViewCount } from "./views"

// ============================================================================
// AI / LLM
// ============================================================================

export { generateChatCompletion, type ChatMessage, type GenerateOptions, type GenerateResult } from "./ai/llm"

// ============================================================================
// FAQ
// ============================================================================

export { FAQ_ITEMS } from "./faq"
