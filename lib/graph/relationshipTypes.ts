
import { stripHtml } from "../utils/client"

export type BugSignature = {
    languageTerms: string[]
    hardError?: string
    apiTerms: string[]
    symptomPhrases: string[]
    softTerms: string[]
    anchors: string[]
}

export type RelatedResult = {
    id: string
    title: string
    url: string
    source:
    | "github_issue"
    | "github_repo"
    | "stack_overflow_question"
    | "bughive_public"
    | "bughive_cluster"
    snippet: string
    relevanceScore?: number
    relevanceReasons?: string[]
    created_at?: string
}

const STRONG_TERMS = new Set([
    "python", "react", "vue", "angular", "javascript", "java", "flutter", "swift", "kotlin",
    "zerodivisionerror", "typeerror", "nullpointerexception", "keyerror", "valueerror",
    "indexerror", "attributeerror", "runtimeerror", "division", "zero",
])

const LANGUAGE_FRAMEWORK_TERMS = [
    "vba", "visual basic", "microsoft access", "ms access", "access database", "jet sql",
    "python", "javascript", "typescript", "node", "react", "react native", "next.js", "nextjs",
    "vue", "angular", "svelte", "express", "nestjs", "django", "flask", "fastapi", "java",
    "spring", "kotlin", "swift", "flutter", "ruby", "rails", "php", "laravel", "go", "rust",
    "c#", "c++", "c", "dotnet",
]

const SYMPTOM_PHRASES = [
    "division by zero", "zero division", "empty list", "index out of range", "out of range",
    "null pointer", "cannot read property", "cannot read properties", "undefined is not a function",
    "none type", "not iterable", "unexpected token", "segmentation fault", "docmd.runsql",
    "run sql", "update query", "syntax error in update statement",
]

const SIGNATURE_STOPWORDS = new Set([
    "error", "exception", "failure", "issue", "bug", "cannot", "cant", "unable", "null",
    "undefined", "none", "true", "false", "with", "without", "when", "while", "where",
    "this", "that", "from", "into", "only", "also", "data", "value",
])

function normalizeTerm(term: string): string {
    return term.trim().toLowerCase()
}

const STACK_FRAME_REGEX = [
    /\bat\s+([A-Za-z0-9_.]+)\.([A-Za-z0-9_]+)\s*\(([^)]*)(?::(\d+))?\)/g,
    /\b(?:at|#)\s*([A-Za-z0-9_.]+)\s*\(([^)]*):(\d+)\)/g,
    /File\s+"([^"]+)",\s*line\s+(\d+)/g,
    /\s+at\s+([^\s(]+)\s*\(([^)]+)\)/g,
]

export function extractStackTraceFingerprint(text: string): string[] {
    if (!text || typeof text !== "string") return []
    const frames: string[] = []
    const seen = new Set<string>()

    for (const re of STACK_FRAME_REGEX) {
        re.lastIndex = 0
        let m: RegExpExecArray | null
        while ((m = re.exec(text)) !== null && frames.length < 3) {
            const normalized = m.slice(1).filter(Boolean).join(":").replace(/\s+/g, " ").trim()
            if (normalized.length >= 4 && !seen.has(normalized)) {
                seen.add(normalized)
                frames.push(normalized)
            }
        }
        if (frames.length >= 3) break
    }

    return frames.slice(0, 3)
}

function detectTerms(textLower: string, terms: string[]): string[] {
    const found: string[] = []
    terms.forEach((term) => {
        if (textLower.includes(term)) found.push(term)
    })
    return Array.from(new Set(found))
}

export function extractBugSignature(params: {
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

export const TEMPORAL_BOOST_48H_SCORE = 0.15
export const STACK_TRACE_MATCH_SCORE = 0.82

export function calculateRelevance(bugA: any, bugB: any): { score: number; reasons: string[] } {
    const sigA = extractBugSignature({
        title: bugA.title,
        description: bugA.description,
        tags: bugA.tags,
        errorMessage: bugA.actual_behavior
    })

    const titleB = bugB.title || bugB.header || ""
    const descB = bugB.description || bugB.snippet || ""
    const tagsB = bugB.tags || []

    const textB = (titleB + " " + descB + " " + tagsB.join(" ")).toLowerCase()

    let score = 0
    const reasons: string[] = []

    const draftText = (bugA.description || "") + " " + (bugA.actual_behavior || "") + " " + (bugA.title || "")
    const fingerprintA = extractStackTraceFingerprint(draftText)
    if (fingerprintA.length > 0) {
        const textBForStack = (bugB.description || "") + " " + (bugB.actual_behavior || "") + " " + (bugB.title || "")
        const allInB = fingerprintA.every((frame) => textBForStack.includes(frame))
        if (allInB) {
            score += STACK_TRACE_MATCH_SCORE
            reasons.push(`Same stack trace (top ${fingerprintA.length} frames)`)
        }
    }

    const langMatch = sigA.languageTerms.some(term => textB.includes(term))
    if (langMatch) {
        score += 0.3
    }

    if (sigA.hardError && textB.includes(sigA.hardError.toLowerCase())) {
        score += 0.4
        reasons.push(`Shared Error: ${sigA.hardError}`)
    }

    sigA.symptomPhrases.forEach(phrase => {
        if (textB.includes(phrase)) {
            score += 0.2
            reasons.push(`Shared Symptom: "${phrase}"`)
        }
    })

    let termMatches = 0
    sigA.apiTerms.forEach(term => {
        if (textB.includes(term)) termMatches++
    })

    if (termMatches >= 2) {
        score += 0.2
        reasons.push(`${termMatches} shared technical terms`)
    }

    const tagsA = (bugA.tags || []).map((t: string) => t.toLowerCase())
    const sharedTags = tagsA.filter((t: string) => textB.includes(t))
    if (sharedTags.length > 0) {
        score += 0.1 * sharedTags.length
        reasons.push(`Shared Tags: ${sharedTags.join(", ")}`)
    }

    return { score: Math.min(score, 1), reasons }
}
