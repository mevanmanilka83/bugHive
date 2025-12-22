import { z } from "zod"

export function getNotificationSchema() {
  return z.object({
    type: z.enum(["cluster_invite", "cluster_joined", "cluster_removed", "bug_assigned", "bug_updated", "solution_created"]),
    title: z.string()
      .min(3, "Title must be at least 3 characters")
      .max(200, "Title must be less than 200 characters"),
    message: z.string()
      .max(1000, "Message must be less than 1000 characters")
      .optional(),
    cluster_id: z.string().uuid().optional(),
    bug_id: z.string().uuid().optional(),
    read: z.boolean().default(false),
  })
}
