import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const json = vi.fn((data: unknown, init?: { status?: number }) => ({ data, status: init?.status ?? 200 }))
  const from = vi.fn()
  const rpc = vi.fn()
  return { json, from, rpc }
})

vi.mock("next/server", () => ({
  NextResponse: {
    json: mocks.json,
  },
}))

vi.mock("@/lib", () => ({
  supabase: { from: mocks.from, rpc: mocks.rpc },
}))

import { GET } from "@/app/api/stats/route"

describe("GET /api/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns aggregated stats payload", async () => {
    mocks.from.mockImplementation((table: string) => ({
      select: () => {
        if (table === "bug_votes") {
          return { eq: () => Promise.resolve({ count: 7 }) }
        }
        if (table === "solution_votes") {
          return { eq: () => Promise.resolve({ count: 11 }) }
        }
        if (table === "bugs") return Promise.resolve({ count: 5 })
        if (table === "bug_solution_details") return Promise.resolve({ count: 9 })
        if (table === "clusters") return Promise.resolve({ count: 3 })
        return Promise.resolve({ count: 0 })
      },
    }))
    mocks.rpc.mockResolvedValue({ data: 2 })

    await GET()
    const call = mocks.json.mock.calls[0][0] as Record<string, unknown>
    expect(call.questions).toBe(5)
    expect(call.answers).toBe(9)
    expect(call.upvotes).toBe(18)
    expect(call.unanswered).toBe(2)
  })

  it("returns 500 json on exception", async () => {
    mocks.from.mockImplementation(() => {
      throw new Error("db down")
    })
    await GET()
    const [, init] = mocks.json.mock.calls[0]
    expect(init.status).toBe(500)
  })
})
