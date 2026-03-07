import { z } from "../zod"
import { getClusterSchema } from "../zod/createCluster"

export type ClusterPayload = z.infer<ReturnType<typeof getClusterSchema>>

export type ClusterFormData = {
  name: string
  description: string
  visibility?: "private" | "public"
}

export type InviteFormData = {
  email: string
  clusterId: string
}
