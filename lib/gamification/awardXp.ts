/**
 * BugHive Hunter Program - BugXP, Ranks, Badges
 *
 * XP values (from blueprint):
 * - New Bug Report: +50 (max 500/day from reporting)
 * - Add Relationship: +30
 * - Complete Triage: +40
 * - Solution Verified: +150 (only when another user verifies)
 * - Graph Contribution: +20 per node (only for NEW node IDs, prevents farming)
 *
 * Uses atomic RPC (award_bug_xp_atomic) to avoid lost-update race conditions.
 * Badge functions use add_badge_if_missing RPC to avoid overwriting badges.
 */
import { getSupabaseAdmin } from "../config"
import { ensureValidUUID } from "../utils/server"

export const BUGXP = {
  BUG_REPORT: 50,
  ADD_RELATIONSHIP: 30,
  TRIAGE: 40,
  SOLUTION_VERIFIED: 150,
  SOLUTION_DRAFT: 20,
  GRAPH_NODE: 20,
} as const

export const DAILY_CAP_BUG_REPORT = 500

/** Keep in sync with public.hunter_ranks table (RPC uses DB for rank lookup) */
export const RANKS = [
  { id: "larva", label: "Larva", minXp: 0 },
  { id: "scout", label: "Scout", minXp: 500 },
  { id: "worker", label: "Worker", minXp: 2000 },
  { id: "soldier", label: "Soldier", minXp: 5000 },
  { id: "hive_architect", label: "Hive Architect", minXp: 10000 },
] as const

export const BADGES = {
  DEEP_DIVER: "deep_diver",
  FIRST_RESPONDER: "first_responder",
  ON_FIRE: "on_fire",
  HIVE_GUARD: "hive_guard",
  GRAPH_ARCHITECT: "graph_architect",
} as const

export type BadgeId = (typeof BADGES)[keyof typeof BADGES]

export function getRankForXp(xp: number): (typeof RANKS)[number] {
  let rank: (typeof RANKS)[number] = RANKS[0]
  for (const r of RANKS) {
    if (xp >= r.minXp) rank = r
  }
  return rank
}

export function getNextRank(xp: number): (typeof RANKS)[number] | null {
  for (const r of RANKS) {
    if (xp < r.minXp) return r
  }
  return null
}

export function getProgressToNextRank(xp: number): { current: number; next: number; percent: number } {
  const next = getNextRank(xp)
  if (!next) return { current: xp, next: xp, percent: 100 }
  const currentRank = getRankForXp(xp)
  const rangeStart = currentRank.minXp
  const rangeEnd = next.minXp
  const progress = xp - rangeStart
  const total = rangeEnd - rangeStart
  const percent = total > 0 ? Math.min(100, Math.round((progress / total) * 100)) : 100
  return { current: xp, next: rangeEnd, percent }
}

/**
 * Get UTC ISO range for "today" in user's timezone. Avoids UTC trap where
 * cap resets mid-day for users in other timezones.
 * @param timezoneOffsetMinutes - Optional. Minutes from UTC (e.g. -480 for PST).
 *   If omitted, uses UTC (current behavior for backward compat).
 */
function getTodayUtcRange(timezoneOffsetMinutes?: number): { from: string; to: string } {
  const offsetMs = (timezoneOffsetMinutes ?? 0) * 60 * 1000
  // "Today" in user's local timezone
  const today = new Date(Date.now() + offsetMs).toISOString().slice(0, 10)
  // Start of that day in UTC: today 00:00 local → UTC
  const startUtc = new Date(`${today}T00:00:00.000Z`).getTime() - offsetMs
  const endUtc = startUtc + 24 * 60 * 60 * 1000 - 1
  return {
    from: new Date(startUtc).toISOString(),
    to: new Date(endUtc).toISOString(),
  }
}

async function getTodayReportXp(
  userId: string,
  timezoneOffsetMinutes?: number
): Promise<number> {
  const { from, to } = getTodayUtcRange(timezoneOffsetMinutes)
  const supabase = getSupabaseAdmin() as any
  const { data } = await supabase
    .from("user_xp_history")
    .select("xp_amount")
    .eq("user_id", userId)
    .eq("action_type", "bug_report")
    .gte("created_at", from)
    .lte("created_at", to)
  const rows = (data || []) as any[]
  const total = rows.reduce((s, r) => s + (r.xp_amount || 0), 0)
  return total
}

/**
 * Award BugXP atomically via RPC. No read-modify-write; avoids race conditions.
 * Returns the XP awarded (0 if capped) for toast display.
 *
 * @param timezoneOffsetMinutes - Optional. User's timezone offset for daily cap.
 *   E.g. -480 for PST (UTC-8). Pass from profile/settings when available.
 */
export async function awardBugXP(
  userId: string,
  action: "bug_report" | "add_relationship" | "triage" | "solution" | "solution_verified" | "graph_node",
  metadata?: {
    bugId?: string
    solutionId?: string
    isFirstTriage?: boolean
    nodeCount?: number
    nodeIds?: string[]
    graphId?: string
    timezoneOffsetMinutes?: number
  }
): Promise<number> {
  try {
    const uid = ensureValidUUID(userId)
    const supabase = getSupabaseAdmin() as any
    let xp = 0
    const xpMetadata: Record<string, unknown> = { ...metadata }

    switch (action) {
      case "bug_report": {
        const todayXp = await getTodayReportXp(uid, metadata?.timezoneOffsetMinutes)
        const remaining = Math.max(0, DAILY_CAP_BUG_REPORT - todayXp)
        xp = Math.min(BUGXP.BUG_REPORT, remaining)
        if (xp <= 0) return 0
        break
      }
      case "add_relationship":
        xp = BUGXP.ADD_RELATIONSHIP
        break
      case "triage":
        xp = BUGXP.TRIAGE
        break
      case "solution":
        xp = BUGXP.SOLUTION_DRAFT
        break
      case "solution_verified":
        xp = BUGXP.SOLUTION_VERIFIED
        break
      case "graph_node": {
        // Uses award_graph_node_xp_atomic: INSERT ... ON CONFLICT DO NOTHING into
        // rewarded_node_tracking; only new node IDs get XP (O(1) per node, scales)
        const nodeIds = Array.isArray(metadata?.nodeIds) ? metadata.nodeIds : []
        if (nodeIds.length === 0) return 0
        const { data: graphXp, error: graphErr } = await supabase.rpc(
          "award_graph_node_xp_atomic",
          {
            p_user_id: uid,
            p_node_ids: nodeIds,
            p_graph_id: metadata?.graphId ?? null,
            p_metadata: xpMetadata,
            p_timezone_offset_minutes: metadata?.timezoneOffsetMinutes ?? null,
          }
        )
        if (graphErr || graphXp == null) return 0
        return typeof graphXp === "number" ? graphXp : 0
      }
      default:
        return 0
    }

    const { data: awarded, error } = await supabase.rpc("award_bug_xp_atomic", {
      p_user_id: uid,
      p_xp_amount: xp,
      p_action_type: action,
      p_metadata: xpMetadata,
      p_timezone_offset_minutes: metadata?.timezoneOffsetMinutes ?? null,
    })

    if (error || awarded === null) return 0
    return typeof awarded === "number" ? awarded : 0
  } catch {
    return 0
  }
}

/**
 * Add badge atomically via RPC. Never overwrites existing badges.
 */
async function addBadgeIfMissing(userId: string, badge: string): Promise<void> {
  try {
    const supabase = getSupabaseAdmin() as any
    await supabase.rpc("add_badge_if_missing", { p_user_id: userId, p_badge: badge })
  } catch {
  }
}

/**
 * Check and award First Responder: triaged a bug within 10 min of it being reported.
 */
export async function checkFirstResponderBadge(userId: string, bugId: string): Promise<void> {
  try {
    const uid = ensureValidUUID(userId)
    const supabase = getSupabaseAdmin() as any
    const { data: bug } = await supabase.from("bugs").select("created_at").eq("id", bugId).single()
    if (!bug?.created_at) return

    const bugCreated = new Date(bug.created_at).getTime()
    const tenMin = 10 * 60 * 1000
    if (Date.now() - bugCreated > tenMin) return

    await addBadgeIfMissing(uid, BADGES.FIRST_RESPONDER)
  } catch {
  }
}

/**
 * Deep Diver: 20+ connected nodes in a relationship graph.
 */
export async function checkDeepDiverBadge(userId: string): Promise<void> {
  try {
    const uid = ensureValidUUID(userId)
    const supabase = getSupabaseAdmin() as any
    const { data: graphs } = await supabase.from("saved_graphs").select("nodes").eq("user_id", uid)
    let maxNodes = 0
    for (const g of graphs || []) {
      const raw = (g as any)?.nodes
      const nodes: unknown[] = Array.isArray(raw) ? raw : []
      maxNodes = Math.max(maxNodes, nodes.length)
    }
    if (maxNodes < 20) return

    await addBadgeIfMissing(uid, BADGES.DEEP_DIVER)
  } catch {
  }
}

/**
 * On Fire: 5-day streak of active contributions.
 */
export async function checkOnFireBadge(userId: string): Promise<void> {
  try {
    const uid = ensureValidUUID(userId)
    const supabase = getSupabaseAdmin() as any
    const { data: history } = await supabase
      .from("user_xp_history")
      .select("created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(100)

    const dates = new Set<string>()
    for (const h of (history || []) as any[]) {
      dates.add(new Date(h.created_at).toISOString().slice(0, 10))
    }
    let streak = 0
    const today = new Date().toISOString().slice(0, 10)
    let d = new Date(today)
    for (let i = 0; i < 7; i++) {
      const key = d.toISOString().slice(0, 10)
      if (dates.has(key)) streak++
      else if (i > 0) break
      d.setDate(d.getDate() - 1)
    }
    if (streak < 5) return

    await addBadgeIfMissing(uid, BADGES.ON_FIRE)
  } catch {
  }
}

/**
 * Graph Architect: first saved graph.
 */
export async function awardGraphArchitectBadge(userId: string): Promise<void> {
  try {
    const uid = ensureValidUUID(userId)
    await addBadgeIfMissing(uid, BADGES.GRAPH_ARCHITECT)
  } catch {
  }
}
