import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const requireAuth = vi.fn()
  const getAuthenticatedUserId = vi.fn()
  const select = vi.fn()
  const from = vi.fn(() => ({ select }))
  const handleSupabaseError = vi.fn((error: unknown, fallback: string) => ({
    success: false,
    error: (error as Error)?.message ?? fallback,
  }))
  const createErrorResponse = vi.fn((error: unknown) => ({
    success: false,
    error: (error as Error)?.message ?? "Unknown error",
  }))

  return {
    requireAuth,
    getAuthenticatedUserId,
    from,
    select,
    handleSupabaseError,
    createErrorResponse,
  }
})

vi.mock("@/lib", () => ({
  supabase: { from: mocks.from },
  requireAuth: mocks.requireAuth,
  getAuthenticatedUserId: mocks.getAuthenticatedUserId,
  createErrorResponse: mocks.createErrorResponse,
  handleSupabaseError: mocks.handleSupabaseError,
}))

import { getClusters } from "@/app/actions/cluster/getClusters"

describe("getClusters action", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns only owned/member clusters", async () => {
    mocks.requireAuth.mockResolvedValue({ success: true, session: { user: { id: "u1" } } })
    mocks.getAuthenticatedUserId.mockResolvedValue("u1")
    mocks.select.mockResolvedValue({
      data: [
        { id: "c1", owner_id: "u1", members: [] },
        { id: "c2", owner_id: "u2", members: ["u1"] },
        { id: "c3", owner_id: "u2", members: ["u3"] },
      ],
      error: null,
    })

    const result = await getClusters()
    expect(result.success).toBe(true)
    expect(result.clusters).toHaveLength(2)
    expect(result.clusters.map((c: { id: string }) => c.id)).toEqual(["c1", "c2"])
  })

  it("returns auth error when user is not authenticated", async () => {
    mocks.requireAuth.mockResolvedValue({ success: false, error: "Not authenticated" })
    const result = await getClusters()
    expect(result.success).toBe(false)
    expect(result.error).toBe("Not authenticated")
    expect(result.clusters).toEqual([])
  })
})
