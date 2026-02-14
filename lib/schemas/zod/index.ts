/**
 * Zod Validation Schemas
 * 
 * Single source of truth for all validation schemas.
 * Re-exports all schemas for easy importing.
 */

// Shared validation utilities
export * from "./shared"

// Auth schemas
export * from "./login"
export * from "./signup"
export * from "./updateProfile"
export * from "./changePassword"
export * from "./privacy"

// Bug schemas  
export * from "./bugReport"
export * from "./bugSolution"

// Cluster schemas
export * from "./acceptInvite"
export * from "./createCluster"
export * from "./deleteCluster"
export * from "./inviteUser"

// Notification schemas
export * from "./notification"
