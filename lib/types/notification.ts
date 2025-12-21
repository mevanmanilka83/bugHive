import { z } from "zod"
import { getNotificationSchema } from "../schemas/zod/notification"

export type NotificationPayload = z.infer<ReturnType<typeof getNotificationSchema>>
