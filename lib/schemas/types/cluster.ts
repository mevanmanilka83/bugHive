import { z } from "zod"
import { getClusterSchema } from "@/app/actions/cluster/zod/createCluster"

export type ClusterPayload = z.infer<ReturnType<typeof getClusterSchema>>

export type ClusterFormData = {
  name: string
  description: string
}

export type InviteFormData = {
  email: string
  clusterId: string
}
