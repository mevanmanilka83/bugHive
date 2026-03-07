/**
 * Type Definitions
 *
 * TypeScript types inferred from Zod schemas and form data types.
 * Import from @/lib/schemas/types
 */

export type { NotificationPayload } from "./notification"
export type { ClusterPayload, ClusterFormData, InviteFormData } from "./cluster"
export type { BugPayload, BugDialogErrors, BugFormData } from "./bugReport"
export type { SolutionPayload, SolutionDialogErrors, SolutionFormData } from "./bugSolution"
export type { ProfileVisibility, PrivacySettingsInput } from "./privacy"
export { PROFILE_VISIBILITY_LABELS, PROFILE_VISIBILITY_DESCRIPTIONS } from "./privacy"
