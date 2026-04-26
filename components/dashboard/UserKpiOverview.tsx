import type { ActivitySummaryData, ActivityTrendPoint } from "@/app/actions/activity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function totalForRange(data: ActivityTrendPoint[], key: "bugReports" | "solutions", days: number) {
  const from = new Date()
  from.setDate(from.getDate() - (days - 1))
  return data
    .filter((d) => new Date(d.date) >= from)
    .reduce((sum, d) => sum + d[key], 0)
}

export function UserKpiOverview({
  summaryData,
  trendData,
}: {
  summaryData: ActivitySummaryData | null
  trendData: ActivityTrendPoint[]
}) {
  const reports30d = totalForRange(trendData, "bugReports", 30)
  const solutions30d = totalForRange(trendData, "solutions", 30)
  const totalReports = summaryData?.bugReportsCount ?? 0
  const totalSolutions = summaryData?.solutionsCount ?? 0
  const verificationRate = totalReports > 0 ? Math.round((totalSolutions / totalReports) * 100) : 0

  const cards = [
    { label: "Reports (30d)", value: reports30d },
    { label: "Solutions (30d)", value: solutions30d },
    { label: "Total Votes", value: summaryData?.votesCount ?? 0 },
    { label: "Solution Ratio", value: `${verificationRate}%` },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-2xl font-semibold tabular-nums">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
