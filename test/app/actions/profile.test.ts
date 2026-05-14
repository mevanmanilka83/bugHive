import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const mockAuth = vi.fn()
  const mockSafeParseUpdate = vi.fn()
  const mockSafeParsePassword = vi.fn()
  const mockVerifyPassword = vi.fn()
  const mockHashPassword = vi.fn()

  const updateEq = vi.fn()
  const update = vi.fn(() => ({ eq: updateEq }))
  const selectSingle = vi.fn()
  const selectEq = vi.fn(() => ({ single: selectSingle }))
  const select = vi.fn(() => ({ eq: selectEq }))
  const from = vi.fn(() => ({ update, select }))

  const adminUpdateEq = vi.fn()
  const adminUpdate = vi.fn(() => ({ eq: adminUpdateEq }))
  const adminSelectSingle = vi.fn()
  const adminSelectEq = vi.fn(() => ({ single: adminSelectSingle }))
  const adminSelect = vi.fn(() => ({ eq: adminSelectEq }))
  const adminFrom = vi.fn(() => ({ update: adminUpdate, select: adminSelect }))

  return {
    mockAuth,
    mockSafeParseUpdate,
    mockSafeParsePassword,
    mockVerifyPassword,
    mockHashPassword,
    updateEq,
    selectSingle,
    adminSelectSingle,
    adminUpdateEq,
    from,
    adminFrom,
  }
})

vi.mock("@/lib", () => ({
  supabase: { from: mocks.from },
  getSupabaseAdmin: vi.fn(() => ({ from: mocks.adminFrom })),
  generateUUIDFromEmailSync: vi.fn(() => "fixed-uuid"),
  uploadAvatarFile: vi.fn(async () => "https://cdn.example.com/avatar.png"),
  getUpdateProfileValidationSchema: vi.fn(() => ({ safeParse: mocks.mockSafeParseUpdate })),
  getChangePasswordValidationSchema: vi.fn(() => ({ safeParse: mocks.mockSafeParsePassword })),
}))

vi.mock("@/lib/auth/config", () => ({
  auth: mocks.mockAuth,
}))

vi.mock("@/lib/password", () => ({
  verifyPassword: mocks.mockVerifyPassword,
  hashPassword: mocks.mockHashPassword,
}))

import { changePassword, updateProfile, uploadAvatar } from "@/app/actions/profile"

describe("profile actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockAuth.mockResolvedValue({ user: { id: "u1", email: "user@bughive.dev" } })
    mocks.mockSafeParseUpdate.mockReturnValue({ success: true, data: { name: "Alice", email: "user@bughive.dev" } })
    mocks.mockSafeParsePassword.mockReturnValue({
      success: true,
      data: { currentPassword: "old", newPassword: "new-pass-123" },
    })
    mocks.updateEq.mockResolvedValue({ error: null })
    mocks.selectSingle.mockResolvedValue({ data: null, error: null })
    mocks.adminSelectSingle.mockResolvedValue({ data: { password_hash: "hash" }, error: null })
    mocks.adminUpdateEq.mockResolvedValue({ error: null })
    mocks.mockVerifyPassword.mockResolvedValue(true)
    mocks.mockHashPassword.mockResolvedValue("new-hash")
  })

  it("updates profile name when email unchanged", async () => {
    const form = new FormData()
    form.set("name", "Alice")
    form.set("email", "user@bughive.dev")
    const res = await updateProfile(form)
    expect(res.success).toBe(true)
  })

  it("uploads avatar with valid file", async () => {
    const form = new FormData()
    form.set("avatar", new File(["a"], "a.png", { type: "image/png" }))
    const res = await uploadAvatar(form)
    expect(res.success).toBe(true)
    expect(res.imageUrl).toContain("https://cdn.example.com")
  })

  it("changes password for email/password account", async () => {
    const form = new FormData()
    form.set("currentPassword", "old")
    form.set("newPassword", "new-pass-123")
    form.set("confirmPassword", "new-pass-123")
    const res = await changePassword(form)
    expect(res.success).toBe(true)
  })
})
