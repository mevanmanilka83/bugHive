import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const requireAuth = vi.fn()
  const ensureValidUUID = vi.fn((id: string) => id)
  const from = vi.fn()
  return { requireAuth, ensureValidUUID, from }
})

vi.mock("@/lib", () => ({
  requireAuth: mocks.requireAuth,
  ensureValidUUID: mocks.ensureValidUUID,
  supabase: { from: mocks.from },
}))

import { getActivitySummary, getActivityTrend } from "@/app/actions/activity"

describe("activity actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireAuth.mockResolvedValue({ success: true, session: { user: { id: "u1" } } })
  })

  it("returns auth error in summary when user not authenticated", async () => {
    mocks.requireAuth.mockResolvedValueOnce({ success: false, error: "Not authenticated" })
    const result = await getActivitySummary()
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("Not authenticated")
  })

  it("builds trend points for minimum bounded range", async () => {
    const today = new Date().toISOString().slice(0, 10)
    mocks.from.mockImplementation((table: string) => ({
      select: () => ({
        eq: () => ({
          gte: () =>
            Promise.resolve({
              data:
                table === "bugs"
                  ? [{ created_at: `${today}T10:00:00.000Z` }]
                  : [{ created_at: `${today}T12:00:00.000Z` }],
            }),
        }),
      }),
    }))

    const result = await getActivityTrend(3)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.length).toBe(7)
      const point = result.data.find((d) => d.date === today)
      expect(point?.bugReports).toBe(1)
      expect(point?.solutions).toBe(1)
    }
  })
})
