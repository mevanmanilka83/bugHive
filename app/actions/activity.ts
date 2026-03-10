"use server"

import { requireAuth, ensureValidUUID, supabase } from "@/lib"

export type ActivitySummaryData = {
  bugReportsCount: number
  solutionsCount: number
  votesCount: number
  clustersCount: number
  recentActivity: RecentActivityItem[]
}

export type RecentActivityItem = {
  id: string
  type:
    | "bug_report"
    | "solution"
    | "bug_vote"
    | "solution_vote"
    | "comment"
    | "saved_bug"
    | "cluster_created"
    | "cluster_joined"
  title: string
  href: string
  createdAt: string
}

export async function getActivitySummary(): Promise<
  | { success: true; data: ActivitySummaryData }
  | { success: false; error: string; data?: null }
> {
  const authResult = await requireAuth()
  if (!authResult.success) {
    return { success: false, error: authResult.error }
  }
  const userId = ensureValidUUID(authResult.session.user.id)

  try {
    const [bugsRes, solutionsRes, bugVotesRes, solutionVotesRes, ownedClustersRes, memberClustersRes] =
      await Promise.all([
        supabase.from("bugs").select("id", { count: "exact", head: true }).eq("created_by", userId),
        supabase
          .from("bug_solution_details")
          .select("id", { count: "exact", head: true })
          .eq("created_by", userId),
        supabase.from("bug_votes").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase
          .from("solution_votes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase.from("clusters").select("id").eq("owner_id", userId),
        supabase.from("clusters").select("id").contains("members", [userId]),
      ])

    const bugReportsCount = bugsRes.count ?? 0
    const solutionsCount = solutionsRes.count ?? 0
    const bugVotesCount = bugVotesRes.count ?? 0
    const solutionVotesCount = solutionVotesRes.count ?? 0
    const votesCount = bugVotesCount + solutionVotesCount

    const ownedIds = new Set((ownedClustersRes.data ?? []).map((r) => r.id))
    const memberIds = (memberClustersRes.data ?? []).map((r) => r.id)
    const clustersCount = new Set([...ownedIds, ...memberIds]).size

    const recentActivity = await fetchRecentActivity(userId)

    return {
      success: true,
      data: {
        bugReportsCount,
        solutionsCount,
        votesCount,
        clustersCount,
        recentActivity,
      },
    }
  } catch (e) {
    console.error("getActivitySummary error:", e)
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to load activity",
    }
  }
}

async function fetchRecentActivity(userId: string): Promise<RecentActivityItem[]> {
  const limit = 15
  const items: RecentActivityItem[] = []

  const [bugs, solutions, bugVotes, solutionVotes, comments, savedBugs, createdClusters, joinedNotifications] = await Promise.all([
    supabase
      .from("bugs")
      .select("id, title, created_at")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("bug_solution_details")
      .select("id, title, bug_id, created_at")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("bug_votes")
      .select("id, bug_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("solution_votes")
      .select("id, solution_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("bug_comments")
      .select("id, bug_id, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("saved_bugs")
      .select("bug_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("clusters")
      .select("id, name, created_at")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("notifications")
      .select("id, cluster_id, created_at")
      .eq("user_id", userId)
      .eq("type", "cluster_joined")
      .order("created_at", { ascending: false })
      .limit(limit),
  ])

  const bugIds = [
    ...new Set([
      ...(bugVotes.data ?? []).map((v) => v.bug_id),
      ...(comments.data ?? []).map((c) => c.bug_id),
      ...(savedBugs.data ?? []).map((s) => s.bug_id),
    ]),
  ]
  const solutionIds = [...new Set([...(solutionVotes.data ?? []).map((v) => v.solution_id)])]

  let bugTitles: Record<string, string> = {}
  let solutionTitles: Record<string, string> = {}
  let solutionBugIds: Record<string, string> = {}
  let clusterNames: Record<string, string> = {}

  if (bugIds.length > 0) {
    const { data } = await supabase.from("bugs").select("id, title").in("id", bugIds)
    bugTitles = Object.fromEntries((data ?? []).map((b) => [b.id, b.title ?? "Bug"]))
  }
  if (solutionIds.length > 0) {
    const { data } = await supabase
      .from("bug_solution_details")
      .select("id, title, bug_id")
      .in("id", solutionIds)
    for (const s of data ?? []) {
      solutionTitles[s.id] = s.title ?? "Solution"
      solutionBugIds[s.id] = s.bug_id
    }
  }

  const joinedClusterIds = [
    ...new Set((joinedNotifications.data ?? []).map((n) => n.cluster_id).filter(Boolean)),
  ] as string[]
  if (joinedClusterIds.length > 0) {
    const { data } = await supabase
      .from("clusters")
      .select("id, name")
      .in("id", joinedClusterIds)
    clusterNames = Object.fromEntries((data ?? []).map((c) => [c.id, c.name ?? "Cluster"]))
  }

  for (const b of bugs.data ?? []) {
    items.push({
      id: b.id,
      type: "bug_report",
      title: b.title ?? "Bug report",
      href: `/bugs/${b.id}`,
      createdAt: b.created_at ?? new Date().toISOString(),
    })
  }
  for (const s of solutions.data ?? []) {
    items.push({
      id: s.id,
      type: "solution",
      title: s.title ?? "Solution",
      href: `/bugs/${s.bug_id}#solutions`,
      createdAt: s.created_at ?? new Date().toISOString(),
    })
  }
  for (const v of bugVotes.data ?? []) {
    items.push({
      id: v.id,
      type: "bug_vote",
      title: `Voted on: ${bugTitles[v.bug_id] ?? "Bug"}`,
      href: `/bugs/${v.bug_id}`,
      createdAt: v.created_at ?? new Date().toISOString(),
    })
  }
  for (const v of solutionVotes.data ?? []) {
    const title = solutionTitles[v.solution_id] ?? "Solution"
    const bugId = solutionBugIds[v.solution_id]
    items.push({
      id: v.id,
      type: "solution_vote",
      title: `Voted on solution: ${title}`,
      href: bugId ? `/bugs/${bugId}#solutions` : "#",
      createdAt: v.created_at ?? new Date().toISOString(),
    })
  }
  for (const c of comments.data ?? []) {
    const bugTitle = bugTitles[c.bug_id] ?? "Bug"
    const text = (c.content ?? "").toString().trim()
    const snippet = text.length > 42 ? `${text.slice(0, 42)}…` : text
    items.push({
      id: c.id,
      type: "comment",
      title: snippet ? `Commented on: ${bugTitle} — “${snippet}”` : `Commented on: ${bugTitle}`,
      href: `/bugs/${c.bug_id}`,
      createdAt: c.created_at ?? new Date().toISOString(),
    })
  }
  for (const s of savedBugs.data ?? []) {
    items.push({
      id: `${s.bug_id}-${s.created_at ?? "saved"}`,
      type: "saved_bug",
      title: `Saved bug: ${bugTitles[s.bug_id] ?? "Bug"}`,
      href: `/bugs/${s.bug_id}`,
      createdAt: s.created_at ?? new Date().toISOString(),
    })
  }
  for (const c of createdClusters.data ?? []) {
    items.push({
      id: c.id,
      type: "cluster_created",
      title: `Created cluster: ${c.name ?? "Untitled cluster"}`,
      href: `/clusters/${c.id}`,
      createdAt: c.created_at ?? new Date().toISOString(),
    })
  }
  for (const n of joinedNotifications.data ?? []) {
    const clusterId = n.cluster_id
    const clusterName = clusterId ? clusterNames[clusterId] ?? "Cluster" : "Cluster"
    items.push({
      id: n.id,
      type: "cluster_joined",
      title: `Joined cluster: ${clusterName}`,
      href: clusterId ? `/clusters/${clusterId}` : "/clusters",
      createdAt: n.created_at ?? new Date().toISOString(),
    })
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return items.slice(0, limit)
}
