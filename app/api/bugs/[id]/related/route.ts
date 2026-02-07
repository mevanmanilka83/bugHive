import { NextRequest } from "next/server"
import { extractRouteId, getSingleRecord, successResponse, errorResponse, stripHtml } from "@/lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const GEMINI_MODEL = "gemini-1.5-flash"
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

const SNIPPET_LENGTH = 180
const MAX_RESULTS_PER_SOURCE = 6
const MAX_QUERY_TEXT = 600

type GeminiQueries = {
  issueQuery: string
  repoQuery: string
}

type GitHubIssue = {
  id: number
  title: string
  html_url: string
  body?: string | null
  comments?: number
  repository_url?: string
}

type GitHubRepo = {
  id: number
  name: string
  full_name: string
  html_url: string
  description?: string | null
  stargazers_count?: number
  forks_count?: number
  updated_at?: string | null
  pushed_at?: string | null
}

function toSnippet(text?: string | null) {
  const cleaned = stripHtml(String(text || "")).replace(/\s+/g, " ").trim()
  if (!cleaned) return ""
  return cleaned.length > SNIPPET_LENGTH ? `${cleaned.slice(0, SNIPPET_LENGTH)}...` : cleaned
}

function trimQueryText(text?: string | null) {
  const cleaned = stripHtml(String(text || "")).replace(/\s+/g, " ").trim()
  if (!cleaned) return ""
  return cleaned.length > MAX_QUERY_TEXT ? `${cleaned.slice(0, MAX_QUERY_TEXT)}...` : cleaned
}

function pickRepositoryName(repositoryUrl?: string) {
  if (!repositoryUrl) return ""
  const parts = repositoryUrl.split("/").filter(Boolean)
  const len = parts.length
  if (len < 2) return ""
  return `${parts[len - 2]}/${parts[len - 1]}`
}

function parseGeminiJson(text: string): GeminiQueries | null {
  try {
    return JSON.parse(text) as GeminiQueries
  } catch {
    const start = text.indexOf("{")
    const end = text.lastIndexOf("}")
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as GeminiQueries
      } catch {
        return null
      }
    }
    return null
  }
}

async function generateQueries(params: {
  title: string
  description: string
  tags: string[]
  errorMessage?: string
}) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null

  const { title, description, tags, errorMessage } = params

  const prompt = [
    "You generate GitHub search queries only.",
    "Return JSON with keys: issueQuery, repoQuery.",
    "Use the bug title, description, tags, and optional error message.",
    "Prioritize crashes on submit, validation errors, empty or missing tags, form or modal failures.",
    "Include GitHub qualifiers like in:title,body for issues and in:name,description,readme for repos.",
    "Keep each query under 200 characters and avoid markdown.",
    "",
    `Title: ${title}`,
    `Description: ${description}`,
    `Tags: ${tags.join(", ") || "(none)"}`,
    `Error message: ${errorMessage || "(none)"}`,
  ].join("\n")

  const response = await fetch(
    `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 300,
        },
      }),
    }
  )

  if (!response.ok) return null

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text || typeof text !== "string") return null

  const parsed = parseGeminiJson(text)
  if (!parsed?.issueQuery || !parsed?.repoQuery) return null

  return parsed
}

function normalizeIssue(item: GitHubIssue) {
  const repoName = pickRepositoryName(item.repository_url)
  const snippet = toSnippet(item.body) || (repoName ? `From ${repoName}` : "")

  return {
    id: `issue-${item.id}`,
    title: item.title,
    url: item.html_url,
    source: "github_issue" as const,
    snippet,
  }
}

function normalizeRepo(item: GitHubRepo) {
  const snippet = toSnippet(item.description)
  return {
    id: `repo-${item.id}`,
    title: item.full_name || item.name,
    url: item.html_url,
    source: "github_repo" as const,
    snippet,
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const bugId = await extractRouteId(context)
    const bug = await getSingleRecord("bugs", bugId)

    if (!bug) {
      return errorResponse("Bug not found", 404)
    }

    const title = trimQueryText(String(bug.title || ""))
    const description = trimQueryText(String(bug.description || ""))
    const tags = Array.isArray(bug.tags) ? bug.tags.map(String) : []
    const errorMessage = typeof bug.actual_behavior === "string" ? trimQueryText(bug.actual_behavior) : undefined

    const queries = await generateQueries({ title, description, tags, errorMessage })
    if (!queries) {
      return successResponse({ results: [] })
    }

    const githubToken = process.env.GITHUB_TOKEN
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    }

    if (githubToken) {
      headers.Authorization = `Bearer ${githubToken}`
    }

    const issuesUrl = new URL("https://api.github.com/search/issues")
    issuesUrl.searchParams.set("q", queries.issueQuery)
    issuesUrl.searchParams.set("sort", "comments")
    issuesUrl.searchParams.set("order", "desc")
    issuesUrl.searchParams.set("per_page", String(MAX_RESULTS_PER_SOURCE))

    const reposUrl = new URL("https://api.github.com/search/repositories")
    reposUrl.searchParams.set("q", queries.repoQuery)
    reposUrl.searchParams.set("sort", "updated")
    reposUrl.searchParams.set("order", "desc")
    reposUrl.searchParams.set("per_page", String(MAX_RESULTS_PER_SOURCE))

    const [issuesRes, reposRes] = await Promise.all([
      fetch(issuesUrl.toString(), { headers }),
      fetch(reposUrl.toString(), { headers }),
    ])

    if (!issuesRes.ok || !reposRes.ok) {
      return successResponse({ results: [] })
    }

    const issuesData = await issuesRes.json()
    const reposData = await reposRes.json()

    const issueItems = Array.isArray(issuesData?.items) ? issuesData.items : []
    const repoItems = Array.isArray(reposData?.items) ? reposData.items : []

    const issuesWithDiscussion = issueItems.filter((item: GitHubIssue) => (item.comments || 0) > 0)
    const selectedIssues = (issuesWithDiscussion.length > 0 ? issuesWithDiscussion : issueItems)
      .slice(0, MAX_RESULTS_PER_SOURCE)
      .map(normalizeIssue)

    const activeRepos = repoItems.filter(
      (item: GitHubRepo) => (item.stargazers_count || 0) + (item.forks_count || 0) > 0
    )
    const selectedRepos = (activeRepos.length > 0 ? activeRepos : repoItems)
      .slice(0, MAX_RESULTS_PER_SOURCE)
      .map(normalizeRepo)

    const results = [...selectedIssues, ...selectedRepos]

    return successResponse({ results })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to load related bugs")
  }
}
