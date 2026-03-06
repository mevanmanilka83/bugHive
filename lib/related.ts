
import { getMultipleRecords } from "@/lib"
import { stripHtml } from "@/lib/utils-client"
import { BugSignature, extractBugSignature, RelatedResult, calculateRelevance } from "./bug-relationships"

const GEMINI_MODEL = "gemini-1.5-flash"
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

const SNIPPET_LENGTH = 180
const MAX_RESULTS_PER_SOURCE = 6
const GITHUB_PAGE_SIZE = 15
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

type StackOverflowQuestion = {
    question_id: number
    title: string
    link: string
    body_markdown?: string
    score: number
    answer_count: number
    is_answered: boolean
    tags: string[]
}

function toSnippet(text?: string | null) {
    const cleaned = stripHtml(String(text || "")).replace(/\s+/g, " ").trim()
    if (!cleaned) return ""
    return cleaned.length > SNIPPET_LENGTH ? `${cleaned.slice(0, SNIPPET_LENGTH)}...` : cleaned
}

function truncateQuery(q: string): string {
    const t = (q || "").trim()
    return t.length <= 200 ? t : t.slice(0, 200)
}

function pickRepositoryName(repositoryUrl?: string) {
    if (!repositoryUrl) return ""
    const parts = repositoryUrl.split("/").filter(Boolean)
    const len = parts.length
    if (len < 2) return ""
    return `${parts[len - 2]}/${parts[len - 1]}`
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

function normalizeStackOverflowQuestion(item: StackOverflowQuestion): RelatedResult {
    const tagStr = item.tags && item.tags.length > 0 ? `Tags: ${item.tags.join(", ")}` : ""
    const bodySnippet = toSnippet(item.body_markdown)
    const snippet = [tagStr, bodySnippet].filter(Boolean).join(". ") || `Stack Overflow question (Score: ${item.score})`

    return {
        id: `so-${item.question_id}`,
        title: stripHtml(item.title),
        url: item.link,
        source: "stack_overflow_question",
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

function trimQueryText(text?: string | null) {
    const cleaned = stripHtml(String(text || "")).replace(/\s+/g, " ").trim()
    if (!cleaned) return ""
    return cleaned.length > MAX_QUERY_TEXT ? `${cleaned.slice(0, MAX_QUERY_TEXT)}...` : cleaned
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

    try {
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
    } catch {
        return { issueQuery: anchorQuery, repoQuery: "" }
    }
}

export async function findRelatedItems(bug: any) {
    const bugId = bug.id
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

    let queries = await generateQueries({
        title,
        description,
        tags,
        errorMessage,
        signature,
    })

    // --- GitHub Fetch ---
    const githubToken = process.env.GITHUB_TOKEN
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if (githubToken) headers.Authorization = `Bearer ${githubToken}`

    const issueQuery = truncateQuery(queries.issueQuery)
    const q = issueQuery.includes("is:issue") ? issueQuery : `${issueQuery} is:issue`

    let githubIssues: RelatedResult[] = []
    try {
        const issuesUrl = new URL("https://api.github.com/search/issues")
        issuesUrl.searchParams.set("q", q)
        issuesUrl.searchParams.set("per_page", String(GITHUB_PAGE_SIZE))

        const issuesRes = await fetch(issuesUrl.toString(), { headers })
        const issuesData = issuesRes.ok ? await issuesRes.json() : { items: [] }
        const issueItems = Array.isArray(issuesData?.items) ? (issuesData.items as GitHubIssue[]) : []

        const issuesWithDiscussion = issueItems.filter(
            (item: GitHubIssue) => (item.comments || 0) > 0
        )
        githubIssues = (issuesWithDiscussion.length > 0 ? issuesWithDiscussion : issueItems)
            .slice(0, GITHUB_PAGE_SIZE)
            .map(normalizeIssue)
    } catch (e) {
        console.error("GitHub search failed", e)
    }

    // --- Stack Overflow Fetch ---
    const stackExchangeKey = process.env.STACK_EXCHANGE_API
    let stackQuestions: RelatedResult[] = []
    try {
        if (issueQuery) {
            let stackQuery = issueQuery.replace(/in:title,body/g, "").replace(/is:issue/g, "").replace(/\s+/g, " ").trim()
            if (stackQuery) {
                const soUrl = new URL("https://api.stackexchange.com/2.3/search/advanced")
                soUrl.searchParams.set("order", "desc")
                soUrl.searchParams.set("sort", "relevance")
                soUrl.searchParams.set("site", "stackoverflow")
                soUrl.searchParams.set("pagesize", String(MAX_RESULTS_PER_SOURCE))
                if (stackExchangeKey) soUrl.searchParams.set("key", stackExchangeKey)

                soUrl.searchParams.set("q", stackQuery)

                let soRes = await fetch(soUrl.toString())
                if (!soRes.ok) {
                    // Try fallback
                    if (title) {
                        stackQuery = title.replace(/bug|issue|error/gi, "").trim()
                        soUrl.searchParams.set("q", stackQuery)
                        soUrl.searchParams.delete("key")
                        soRes = await fetch(soUrl.toString())
                    }
                }

                if (soRes.ok) {
                    const soData = await soRes.json()
                    const items = Array.isArray(soData?.items) ? (soData.items as StackOverflowQuestion[]) : []
                    stackQuestions = items.map(normalizeStackOverflowQuestion)
                }
            }
        }
    } catch (e) {
        console.error("StackOverflow search failed", e)
    }

    // --- Internal Bug Fetch ---
    const allRecords = await getMultipleRecords("bugs")
    const filteredRecords = allRecords.filter((record: any) => {
        if (record.id === bugId) return false
        const visibility = String(record.visibility || "public").toLowerCase().trim()
        return visibility !== "private"
    })

    // Use calculateRelevance to find internal bugs that are semantically related
    const internalBugs = filteredRecords
        .map((record: any) => {
            const { score, reasons } = calculateRelevance(bug, record)
            return {
                ...normalizePublicBug(record),
                relevanceScore: score,
                relevanceReasons: reasons,
                description: record.description || "" // preserve description for graph prompt
            }
        })
        .filter((item: any) => item.relevanceScore > 0.1) // Only return relevant
        .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
        .slice(0, 10)

    return {
        internal: internalBugs,
        external: [
            ...githubIssues.slice(0, 5),
      ...stackQuestions.slice(0, 5)
        ]
    }
}
