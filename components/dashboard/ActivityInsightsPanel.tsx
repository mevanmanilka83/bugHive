import type { ActivityTrendPoint } from "@/app/actions/activity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function getRecentWindow(data: ActivityTrendPoint[], days: number) {
  const from = new Date()
  from.setDate(from.getDate() - (days - 1))
  return data.filter((d) => new Date(d.date) >= from)
}

export function ActivityInsightsPanel({ trendData }: { trendData: ActivityTrendPoint[] }) {
  const recent30d = getRecentWindow(trendData, 30)

  const bestDay = recent30d.reduce(
    (best, current) => {
      const score = current.bugReports + current.solutions
      return score > best.score ? { date: current.date, score } : best
    },
    { date: "-", score: 0 }
  )

  const activeDays = recent30d.filter((d) => d.bugReports + d.solutions > 0).length
  const consistency = recent30d.length > 0 ? Math.round((activeDays / recent30d.length) * 100) : 0
  const reports = recent30d.reduce((sum, d) => sum + d.bugReports, 0)
  const solutions = recent30d.reduce((sum, d) => sum + d.solutions, 0)

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Activity Insights</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Most active day</p>
          <p className="font-medium">{bestDay.date === "-" ? "-" : new Date(bestDay.date).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Consistency (30d)</p>
          <p className="font-medium">{consistency}% active days</p>
        </div>
        <div>
          <p className="text-muted-foreground">Report/Solution mix</p>
          <p className="font-medium">{reports} / {solutions}</p>
        </div>
      </CardContent>
    </Card>
  )
}
