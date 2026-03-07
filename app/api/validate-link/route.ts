import { NextRequest, NextResponse } from "next/server"
import { isValidUrl } from "@/lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TIMEOUT_MS = 8000

/**
 * GET /api/validate-link?url=...
 * Returns { valid: boolean } - true if URL returns 2xx (HEAD or GET), false otherwise.
 * Only allows http/https URLs.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  if (!url || typeof url !== "string" || !url.trim()) {
    return NextResponse.json({ error: "url is required" }, { status: 400 })
  }
  const trimmed = url.trim()
  if (!isValidUrl(trimmed)) {
    return NextResponse.json({ valid: false, error: "Only http/https URLs allowed" })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(trimmed, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "BugHive-LinkValidator/1.0" },
    })
    clearTimeout(timeout)
    const valid = res.status >= 200 && res.status < 300
    return NextResponse.json({ valid, status: res.status })
  } catch {
    try {
      clearTimeout(timeout)
      const controller2 = new AbortController()
      const timeout2 = setTimeout(() => controller2.abort(), TIMEOUT_MS)
      const res = await fetch(trimmed, {
        method: "GET",
        signal: controller2.signal,
        redirect: "follow",
        headers: { "User-Agent": "BugHive-LinkValidator/1.0" },
      })
      clearTimeout(timeout2)
      const valid = res.status >= 200 && res.status < 300
      return NextResponse.json({ valid, status: res.status })
    } catch {
      return NextResponse.json({ valid: false })
    }
  }
}
