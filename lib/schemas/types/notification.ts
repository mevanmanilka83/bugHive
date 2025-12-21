import { z } from "zod"
import { getNotificationSchema } from "../zod/notification"

export type NotificationPayload = z.infer<ReturnType<typeof getNotificationSchema>>
