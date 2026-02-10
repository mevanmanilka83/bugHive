import { NextRequest } from "next/server"
import { extractRouteId, getSingleRecord, getMultipleRecords, successResponse, errorResponse } from "@/lib"
import { stripHtml } from "@/lib/utils-client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const GEMINI_MODEL = "gemini-1.5-flash"
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

const SNIPPET_LENGTH = 180
const MAX_RESULTS_PER_SOURCE = 6
const GITHUB_PAGE_SIZE = 15
const MAX_QUERY_TEXT = 600

/**
 * Normalized result shape for related items. Same structure can be used when
 * adding Reddit or Stack Overflow later (add new source values and fetchers).
 */
export type RelatedResult = {
  id: string
  title: string
  url: string
  source: "github_issue" | "github_repo" | "bughive_public" | "bughive_cluster"
  snippet: string
}

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
  signature: BugSignature
}) {
  const anchorQuery = buildSignatureQuery(params.signature)
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { issueQuery: anchorQuery, repoQuery: "" }
  }

  const { title, description, tags, errorMessage, signature } = params

  const prompt = [
    "You generate a GitHub search query for ISSUES only. Output valid JSON with key: issueQuery.",
    "Rules:",
    "- issueQuery must include the provided anchors (language/framework, error name, key API/function, and 1 symptom phrase when available).",
    "- If a hard error/exception is present, it MUST be included as an exact phrase in quotes.",
    "- If a language/framework term exists, it MUST be included.",
    "- Include at least two anchors when available; prefer three if present.",
    "- issueQuery must find issues about the SAME language/framework AND same explicit error/exception when available.",
    "- Include: in:title,body is:issue",
    "- Keep the query under 200 characters. No markdown. Output only JSON.",
    "",
    `Anchors: ${signature.anchors.join(" | ") || "(none)"}`,
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

  if (!response.ok) return { issueQuery: anchorQuery, repoQuery: "" }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text || typeof text !== "string") return { issueQuery: anchorQuery, repoQuery: "" }

  const parsed = parseGeminiJson(text)
  if (!parsed?.issueQuery) return { issueQuery: anchorQuery, repoQuery: "" }

  const issueQuery = truncateQuery(parsed.issueQuery)
  if (!queryIncludesAnchors(issueQuery, signature)) {
    return { issueQuery: anchorQuery, repoQuery: "" }
  }

  return { issueQuery, repoQuery: "" }
}

/** GitHub search query length limit (keep under 256) */
const MAX_QUERY_LEN = 200

function truncateQuery(q: string): string {
  const t = (q || "").trim()
  return t.length <= MAX_QUERY_LEN ? t : t.slice(0, MAX_QUERY_LEN)
}

/** Terms that identify language/framework or specific error type. */
const STRONG_TERMS = new Set([
  "python", "react", "vue", "angular", "javascript", "java", "flutter", "swift", "kotlin",
  "zerodivisionerror", "typeerror", "nullpointerexception", "keyerror", "valueerror",
  "indexerror", "attributeerror", "runtimeerror", "division", "zero",
])

const LANGUAGE_FRAMEWORK_TERMS = [
  "vba",
  "visual basic",
  "microsoft access",
  "ms access",
  "access database",
  "jet sql",
  "python",
  "javascript",
  "typescript",
  "node",
  "react",
  "react native",
  "next.js",
  "nextjs",
  "vue",
  "angular",
  "svelte",
  "express",
  "nestjs",
  "django",
  "flask",
  "fastapi",
  "java",
  "spring",
  "kotlin",
  "swift",
  "flutter",
  "ruby",
  "rails",
  "php",
  "laravel",
  "go",
  "rust",
  "c#",
  "c++",
  "c",
  "dotnet",
]

const DOMAIN_BLOCKLISTS = [
  {
    name: "cloud_infra",
    terms: [
      "azure",
      "aws",
      "gcp",
      "cloud",
      "app service",
      "lambda",
      "kubernetes",
      "k8s",
      "docker",
      "container",
      "deployment",
      "helm",
      "vercel",
      "netlify",
      "cloudflare",
      "internal server error",
      "http 500",
      "500 error",
      "api",
      "server",
    ],
  },
  {
    name: "tooling_ecosystem",
    terms: [
      "renovate",
      "dependabot",
      "homebrew",
      "brew",
      "bottling",
      "linux arm",
      "github actions",
      "workflow",
      "ci",
      "buildkite",
    ],
  },
  {
    name: "mobile",
    terms: [
      "android",
      "ios",
      "iphone",
      "ipad",
      "react native",
      "swiftui",
      "xcode",
      "apk",
      "gradle",
      "adb",
      "play store",
      "app store",
      "cocoapods",
      "mobile",
    ],
  },
]

/**
 * Extract key technical terms and strong terms (language/error) from the bug.
 * Strong terms are used to require that results match the same tech or error type.
 */
function extractKeyTerms(params: {
  title: string
  description: string
  tags: string[]
  errorMessage?: string
}): { terms: string[]; strongTermsFromBug: string[] } {
  const seen = new Set<string>()
  const add = (word: string) => {
    const w = word.replace(/[^\w]/g, "").toLowerCase()
    if (w.length > 2 && !/^\d+$/.test(w)) seen.add(w)
  }
  const text = [
    params.errorMessage || "",
    params.title || "",
    (params.description || "").slice(0, 400),
    ...(params.tags || []),
  ].join(" ")
  const words = text.split(/\s+/).filter(Boolean)
  words.forEach(add)
  const strongTermsFromBug = Array.from(seen).filter((s) => STRONG_TERMS.has(s))
  const priority = [
    "python", "zerodivisionerror", "division", "react", "vue", "angular",
    "java", "javascript", "typescript", "kotlin", "swift", "flutter",
    "typeerror", "undefined", "map", "null", "empty", "average",
    "crash", "error", "reading", "properties", "cannot", "render", "data",
  ]
  const prioritySet = new Set(priority)
  const ordered = [...priority.filter((p) => seen.has(p)), ...Array.from(seen).filter((s) => !prioritySet.has(s))]
  return { terms: ordered.slice(0, 16), strongTermsFromBug }
}

type BugSignature = {
  languageTerms: string[]
  hardError?: string
  apiTerms: string[]
  symptomPhrases: string[]
  softTerms: string[]
  anchors: string[]
}

const SIGNATURE_STOPWORDS = new Set([
  "error",
  "exception",
  "failure",
  "issue",
  "bug",
  "cannot",
  "cant",
  "unable",
  "null",
  "undefined",
  "none",
  "true",
  "false",
  "with",
  "without",
  "when",
  "while",
  "where",
  "this",
  "that",
  "from",
  "into",
  "only",
  "also",
  "data",
  "value",
])

const SYMPTOM_PHRASES = [
  "division by zero",
  "zero division",
  "empty list",
  "index out of range",
  "out of range",
  "null pointer",
  "cannot read property",
  "cannot read properties",
  "undefined is not a function",
  "none type",
  "not iterable",
  "unexpected token",
  "segmentation fault",
  "docmd.runsql",
  "run sql",
  "update query",
  "syntax error in update statement",
]

function normalizeTerm(term: string): string {
  return term.trim().toLowerCase()
}

function detectTerms(textLower: string, terms: string[]): string[] {
  const found: string[] = []
  terms.forEach((term) => {
    if (textLower.includes(term)) found.push(term)
  })
  return Array.from(new Set(found))
}

function buildSignatureQuery(signature: BugSignature): string {
  const parts: string[] = []
  if (signature.hardError) parts.push(`"${signature.hardError}"`)
  if (signature.languageTerms[0]) parts.push(signature.languageTerms[0])
  if (signature.apiTerms[0]) parts.push(signature.apiTerms[0])
  if (signature.symptomPhrases[0]) parts.push(`"${signature.symptomPhrases[0]}"`)

  const base = parts.filter(Boolean).join(" ").trim() || "bug"
  return truncateQuery(`${base} in:title,body is:issue`)
}

function queryIncludesAnchors(query: string, signature: BugSignature): boolean {
  if (signature.anchors.length === 0) return true
  const normalizedQuery = query.toLowerCase().replace(/"/g, "")
  const requiredMatches = Math.min(3, signature.anchors.length)
  const matchCount = signature.anchors.filter((anchor) =>
    normalizedQuery.includes(anchor.toLowerCase())
  ).length
  return matchCount >= requiredMatches
}

function extractBugSignature(params: {
  title: string
  description: string
  tags: string[]
  errorMessage?: string
}): BugSignature {
  const rawText = [
    params.errorMessage || "",
    params.title || "",
    params.description || "",
    ...(params.tags || []),
  ].join(" ")

  const lower = rawText.toLowerCase()

  const hardErrorMatches = rawText.match(/\b[A-Z][A-Za-z0-9]+(?:Error|Exception)\b/g) || []
  const hardError = hardErrorMatches.length > 0 ? hardErrorMatches[0] : undefined

  const languageTerms = detectTerms(lower, LANGUAGE_FRAMEWORK_TERMS)

  const apiTerms: string[] = []
  const addApiTerm = (term: string) => {
    const t = normalizeTerm(term)
    if (!t || t.length < 3) return
    if (SIGNATURE_STOPWORDS.has(t)) return
    if (languageTerms.includes(t)) return
    if (!apiTerms.includes(t)) apiTerms.push(t)
  }

  const functionMatches = rawText.match(/\b[A-Za-z_][A-Za-z0-9_]*\s*\(/g) || []
  functionMatches.forEach((match) => addApiTerm(match.replace("(", "").trim()))

  const dottedMatches = rawText.match(/\b[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+\b/g) || []
  dottedMatches.forEach((match) => addApiTerm(match))

  const tokenMatches = rawText.match(/\b[A-Za-z_][A-Za-z0-9_]{2,}\b/g) || []
  tokenMatches.forEach((token) => addApiTerm(token))

  const symptomPhrases = SYMPTOM_PHRASES.filter((phrase) => lower.includes(phrase)).slice(0, 2)

  const softTerms = [...apiTerms.slice(0, 3), ...symptomPhrases].map(normalizeTerm)

  const anchors = [
    hardError,
    languageTerms[0],
    apiTerms[0],
    symptomPhrases[0],
  ].filter(Boolean) as string[]

  return {
    languageTerms,
    hardError,
    apiTerms: apiTerms.slice(0, 3),
    symptomPhrases,
    softTerms,
    anchors,
  }
}

/**
 * Fallback when Gemini is unavailable or fails: build queries from error
 * message, title, and tags so results are still relevant to the bug.
 */
function buildFallbackQueries(signature: BugSignature): GeminiQueries {
  return {
    issueQuery: buildSignatureQuery(signature),
    repoQuery: "",
  }
}

function normalizeIssue(item: GitHubIssue): RelatedResult {
  const repoName = pickRepositoryName(item.repository_url)
  const snippet = toSnippet(item.body) || (repoName ? `From ${repoName}` : "")

  return {
    id: `issue-${item.id}`,
    title: item.title,
    url: item.html_url,
    source: "github_issue",
    snippet,
  }
}

function normalizeRepo(item: GitHubRepo): RelatedResult {
  const snippet =
    toSnippet(item.description) ||
    (item.full_name ? `Repository: ${item.full_name}` : "GitHub repository")
  return {
    id: `repo-${item.id}`,
    title: item.full_name || item.name,
    url: item.html_url,
    source: "github_repo",
    snippet,
  }
}

function normalizePublicBug(item: any): RelatedResult {
  const title = String(item.title || item.header || item.name || "").trim() || "(untitled bug)"
  const snippet = toSnippet(item.description) || "Public BugHive report"
  return {
    id: `bug-${item.id}`,
    title,
    url: `/bugs/${item.id}`,
    source: "bughive_public",
    snippet,
  }
}

function normalizeClusterBug(item: any, clusterId: string): RelatedResult {
  const title = String(item.title || item.header || item.name || "").trim() || "(untitled bug)"
  const snippet = toSnippet(item.description) || "BugHive cluster report"
  return {
    id: `cluster-bug-${item.id}`,
    title,
    url: `/clusters/${clusterId}/bugs/${item.id}`,
    source: "bughive_cluster",
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
    const environment = trimQueryText(String(bug.environment || ""))
    const expectedBehavior = trimQueryText(String(bug.expected_behavior || ""))
    const actualBehavior = trimQueryText(String(bug.actual_behavior || ""))
    const stepsToReproduce = trimQueryText(String(bug.steps_to_reproduce || ""))
    const sourcesText = Array.isArray(bug.sources) ? bug.sources.map(String).join(" ") : trimQueryText(String(bug.sources || ""))
    const tags = Array.isArray(bug.tags) ? bug.tags.map(String) : []
    const errorMessage = typeof bug.actual_behavior === "string" ? trimQueryText(bug.actual_behavior) : undefined

    const signature = extractBugSignature({
      title: String(bug.title || "").trim() || title,
      description: [
        description,
        environment,
        expectedBehavior,
        actualBehavior,
        stepsToReproduce,
        sourcesText,
      ].filter(Boolean).join(" "),
      tags,
      errorMessage,
    })

    if (!signature.hardError && signature.languageTerms.length === 0 && signature.softTerms.length === 0) {
      return successResponse({
        results: [],
        message: "No related GitHub issues found for this bug.",
      })
    }

    let queries = await generateQueries({
      title,
      description,
      tags,
      errorMessage,
      signature,
    })
    if (!queries) {
      queries = buildFallbackQueries(signature)
    }

    const { terms: keyTerms } = extractKeyTerms({
      title: String(bug.title || "").trim() || title,
      description: [
        description,
        environment,
        expectedBehavior,
        actualBehavior,
        stepsToReproduce,
        sourcesText,
      ].filter(Boolean).join(" "),
      tags,
      errorMessage,
    })
    const keyTermsLower = keyTerms.map((t) => t.toLowerCase())
    const bugContext = [
      title,
      description,
      environment,
      expectedBehavior,
      actualBehavior,
      stepsToReproduce,
      sourcesText,
      errorMessage,
      ...tags,
    ].join(" ").toLowerCase()

    const githubToken = process.env.GITHUB_TOKEN
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    }

    if (githubToken) {
      headers.Authorization = `Bearer ${githubToken}`
    }

    const issueQuery = truncateQuery(queries.issueQuery)
    const q = issueQuery.includes("is:issue") ? issueQuery : `${issueQuery} is:issue`

    const issuesUrl = new URL("https://api.github.com/search/issues")
    issuesUrl.searchParams.set("q", q)
    issuesUrl.searchParams.set("per_page", String(GITHUB_PAGE_SIZE))

    let issueItems: GitHubIssue[] = []
    try {
      const issuesRes = await fetch(issuesUrl.toString(), { headers })
      const issuesData = issuesRes.ok ? await issuesRes.json() : { items: [] }
      issueItems = Array.isArray(issuesData?.items) ? (issuesData.items as GitHubIssue[]) : []
      // Fail closed: no generic fallback query to avoid irrelevant results.
    } catch {
      issueItems = []
    }

    const issuesWithDiscussion = issueItems.filter((item: GitHubIssue) => (item.comments || 0) > 0)
    const rawIssues = (issuesWithDiscussion.length > 0 ? issuesWithDiscussion : issueItems)
      .slice(0, GITHUB_PAGE_SIZE)
      .map(normalizeIssue)

    function relevanceScore(item: RelatedResult): number {
      const text = `${item.title} ${item.snippet}`.toLowerCase()
      return keyTermsLower.filter((term) => text.includes(term)).length
    }

    function matchesLanguage(item: RelatedResult): boolean {
      if (signature.languageTerms.length === 0) return true
      const text = `${item.title} ${item.snippet}`.toLowerCase()
      return signature.languageTerms.some((lang) => text.includes(lang))
    }

    function matchesHardError(item: RelatedResult): boolean {
      if (!signature.hardError) return true
      const text = `${item.title} ${item.snippet}`.toLowerCase()
      return text.includes(signature.hardError.toLowerCase())
    }

    function matchesLanguageText(text: string): boolean {
      if (signature.languageTerms.length === 0) return true
      return signature.languageTerms.some((lang) => text.includes(lang))
    }

    function matchesHardErrorText(text: string): boolean {
      if (!signature.hardError) return true
      return text.includes(signature.hardError.toLowerCase())
    }

    function softMatchCount(item: RelatedResult): number {
      if (signature.softTerms.length === 0) return 0
      const text = `${item.title} ${item.snippet}`.toLowerCase()
      return signature.softTerms.filter((term) => text.includes(term)).length
    }

    function matchesApiTerm(item: RelatedResult): boolean {
      if (signature.apiTerms.length === 0) return true
      const text = `${item.title} ${item.snippet}`.toLowerCase()
      return signature.apiTerms.some((term) => text.includes(term.toLowerCase()))
    }

    function softMatchCountText(text: string): number {
      if (signature.softTerms.length === 0) return 0
      return signature.softTerms.filter((term) => text.includes(term)).length
    }

    function passesDomainBlocklist(item: RelatedResult): boolean {
      const text = `${item.title} ${item.snippet}`.toLowerCase()
      for (const domain of DOMAIN_BLOCKLISTS) {
        const bugMentionsDomain = domain.terms.some((term) => bugContext.includes(term))
        if (!bugMentionsDomain && domain.terms.some((term) => text.includes(term))) {
          return false
        }
      }
      return true
    }

    function blocklistPenalty(item: RelatedResult): number {
      const text = `${item.title} ${item.snippet}`.toLowerCase()
      let penalty = 0
      for (const domain of DOMAIN_BLOCKLISTS) {
        const bugMentionsDomain = domain.terms.some((term) => bugContext.includes(term))
        if (!bugMentionsDomain && domain.terms.some((term) => text.includes(term))) {
          penalty += 2
        }
      }
      return penalty
    }

    const minSoftMatchesStrict = signature.softTerms.length > 1 ? 2 : signature.softTerms.length > 0 ? 1 : 0
    const minSoftMatchesRelaxed = signature.softTerms.length > 0 ? 1 : 0

    const strictIssues = rawIssues
      .map((item) => ({
        item,
        score: relevanceScore(item),
        softScore: softMatchCount(item),
      }))
      .filter(
        (x) =>
          matchesLanguage(x.item) &&
            matchesHardError(x.item) &&
            passesDomainBlocklist(x.item) &&
            matchesApiTerm(x.item) &&
          x.softScore >= minSoftMatchesStrict
      )
      .sort((a, b) => b.softScore - a.softScore || b.score - a.score)

    const relaxedIssues = rawIssues
      .map((item) => ({
        item,
        score: relevanceScore(item),
        softScore: softMatchCount(item),
        penalty: blocklistPenalty(item),
      }))
      .filter(
        (x) =>
          matchesLanguage(x.item) &&
            matchesHardError(x.item) &&
            matchesApiTerm(x.item) &&
            x.softScore >= minSoftMatchesRelaxed
      )
      .sort((a, b) =>
        (b.softScore - b.penalty) - (a.softScore - a.penalty) || b.score - a.score
      )

    const chosen = strictIssues.length > 0 ? strictIssues : relaxedIssues
    const issues = chosen.slice(0, MAX_RESULTS_PER_SOURCE).map((x) => x.item)

    const allBugs = await getMultipleRecords("bugs")
    const publicBugs = allBugs.filter((record) => {
      if (record?.id === bugId) return false
      if (record?.cluster_id) return false
      const visibility = String(record?.visibility || "public").toLowerCase().trim()
      return visibility !== "private"
    })

    const clusterId = bug?.cluster_id ? String(bug.cluster_id) : ""
    const clusterBugs = clusterId
      ? allBugs.filter((record) => {
          if (record?.id === bugId) return false
          return String(record?.cluster_id || "") === clusterId
        })
      : []

    const minPublicScore = keyTermsLower.length <= 2 ? 1 : 2

    const scoredPublicBugs = publicBugs
      .map((record) => {
        const text = [
          record.title || "",
          record.description || "",
          record.environment || "",
          record.expected_behavior || "",
          record.actual_behavior || "",
          record.steps_to_reproduce || "",
          Array.isArray(record.sources) ? record.sources.join(" ") : (record.sources || ""),
          (record.tags || []).join(" "),
        ].join(" ").toLowerCase()
        const score = keyTermsLower.filter((term) => text.includes(term)).length
        const softScore = softMatchCountText(text)
        return { record, score, softScore, text }
      })
      .filter((x) => x.score >= minPublicScore)
      .filter((x) => (signature.softTerms.length > 0 ? x.softScore >= 1 : true))
      .filter((x) => matchesLanguageText(x.text))
      .filter((x) => matchesHardErrorText(x.text))
      .sort((a, b) => b.softScore - a.softScore || b.score - a.score)
      .slice(0, MAX_RESULTS_PER_SOURCE)
      .map((x) => normalizePublicBug(x.record))

    const clusterMatchTerms = [
      signature.hardError,
      ...signature.languageTerms,
      ...signature.apiTerms,
      ...signature.symptomPhrases,
      ...signature.softTerms,
    ]
      .filter(Boolean)
      .map((term) => String(term).toLowerCase())

    const minClusterScore = keyTermsLower.length <= 2 ? 1 : 2

    const scoredClusterBugs = clusterBugs
      .map((record) => {
        const text = [
          record.title || "",
          record.description || "",
          record.environment || "",
          record.expected_behavior || "",
          record.actual_behavior || "",
          record.steps_to_reproduce || "",
          Array.isArray(record.sources) ? record.sources.join(" ") : (record.sources || ""),
          (record.tags || []).join(" "),
        ].join(" ").toLowerCase()
        const score = keyTermsLower.filter((term) => text.includes(term)).length
        const softScore = softMatchCountText(text)
        const matchCount = clusterMatchTerms.filter((term) => text.includes(term)).length
        return { record, score, softScore, matchCount, text }
      })
      .filter((x) => x.matchCount >= 1)
      .filter((x) => x.score > 0)
      .filter((x) => (signature.softTerms.length > 0 ? x.softScore >= 1 : x.score >= minClusterScore))
      .filter((x) => matchesLanguageText(x.text))
      .filter((x) => matchesHardErrorText(x.text))
      .sort((a, b) => b.softScore - a.softScore || b.score - a.score)
      .slice(0, MAX_RESULTS_PER_SOURCE)
      .map((x) => normalizeClusterBug(x.record, clusterId))

    const results = [...scoredClusterBugs, ...scoredPublicBugs, ...issues]

    return successResponse({
      results,
      message: results.length === 0 ? "No related GitHub issues found for this bug." : undefined,
    })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to load related bugs")
  }
}
