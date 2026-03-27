/**
 * BugHive Hunter Program - Client-safe constants and helpers
 * (No server-only imports - safe for use in client components)
 */

export const RANKS = [
  { id: "larva", label: "Larva", minXp: 0 },
  { id: "scout", label: "Scout", minXp: 500 },
  { id: "worker", label: "Worker", minXp: 2000 },
  { id: "soldier", label: "Soldier", minXp: 5000 },
  { id: "hive_architect", label: "Hive Architect", minXp: 10000 },
] as const

export const BADGE_LABELS: Record<string, string> = {
  deep_diver: "Deep Diver",
  first_responder: "First Responder",
  on_fire: "On Fire",
  hive_guard: "Hive Guard",
  graph_architect: "Graph Architect",
}

export const BADGE_DESCRIPTIONS: Record<string, string> = {
  deep_diver: "Created a relationship graph with 20+ connected nodes",
  first_responder: "First to triage a bug within 10 minutes of report",
  on_fire: "5-day streak of active contributions",
  hive_guard: "Identified a duplicate bug before it was assigned",
  graph_architect: "Saved your first relationship graph",
}

export function getBadgeLabel(badgeId: string): string {
  return BADGE_LABELS[badgeId] ?? badgeId
}

export function getRankLabel(rankId: string): string {
  return RANKS.find((r) => r.id === rankId)?.label ?? rankId
}

export function getRankForXp(xp: number): (typeof RANKS)[number] {
  let rank: (typeof RANKS)[number] = RANKS[0]
  for (const r of RANKS) {
    if (xp >= r.minXp) rank = r
  }
  return rank
}

export function getProgressToNextRank(xp: number): { current: number; next: number; percent: number; rankLabel: string } {
  const rank = getRankForXp(xp)
  const nextRank = RANKS.find((r) => r.minXp > xp)
  if (!nextRank) return { current: xp, next: xp, percent: 100, rankLabel: rank.label }
  const rangeStart = rank.minXp
  const rangeEnd = nextRank.minXp
  const progress = xp - rangeStart
  const total = rangeEnd - rangeStart
  const percent = total > 0 ? Math.min(100, Math.round((progress / total) * 100)) : 100
  return { current: xp, next: rangeEnd, percent, rankLabel: rank.label }
}
