
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
  fetchWithRetry,
} from "./utils/server"
export type { ClusterViewMode, ClusterVisibility, AppLocale } from "./utils/server"

export {
  getErrorMessage,
  errorResponse,
  successResponse,
  createErrorResponse,
  handleSupabaseError
} from "./errors/httpResponses"

export { normalizeClusterDescription } from "./validation/formValidation"

export * from "./schemas"

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

export {
  checkAuth,
  requireAuth,
  getAuthenticatedUserId,
  getUsernameFromSession,
  requireAuthForPage,
  type AuthenticatedSession,
  type ActionResponse
} from "./auth/helpers"

export { createApiHandler, createBugHandler, createSolutionHandler } from "./api/routeHandlers"

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

export { parseFormData } from "./api/parseForms"
export {
  handleFileUploads,
  processFormDataWithUploads,
  uploadAvatarFile
} from "./storage/s3Uploads"

export { buildBugSubgraph } from "./graph/buildSubgraph"

export {
  WORKSPACE_VIEW_TYPE_VALUES,
  WORKSPACE_VIEW_TYPE_CATALOG,
  WORKSPACE_VIEW_TYPE_LOOKUP,
  normalizeWorkspaceViewType,
} from "./workspaces/viewTypes"
export type { WorkspaceViewType, WorkspaceViewTypeDefinition } from "./workspaces/viewTypes"

export { incrementViewCount, getViewCount } from "./views"

export {
  generateChatCompletion,
  getLlmErrorHttpStatus,
  type ChatMessage,
  type GenerateOptions,
  type GenerateResult,
} from "./ai/llm"

export { FAQ_ITEMS } from "./faq"
