import { getActivitySummary } from "@/app/actions/activity"
import { ActivityPageClient } from "./ActivityPageClient"

export default async function ActivityPage() {
  const initialSummary = await getActivitySummary()

  return <ActivityPageClient initialSummary={initialSummary} />
}
