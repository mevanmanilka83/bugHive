import { describe, expect, it, vi } from "vitest"
import {
  addRecentlyViewedBug,
  ensureValidUUID,
  extractUsernameFromEmail,
  generateUUIDFromEmailSync,
  getRecentlyViewedBugs,
  isValidUUID,
  stripHtml,
} from "@/lib/utils/client"

describe("client utilities", () => {
  it("creates stable uuid for same email", () => {
    const a = generateUUIDFromEmailSync("User@Example.com")
    const b = generateUUIDFromEmailSync("user@example.com")
    expect(a).toBe(b)
    expect(isValidUUID(a)).toBe(true)
  })

  it("ensureValidUUID keeps valid values and regenerates invalid", () => {
    const valid = "550e8400-e29b-41d4-a716-446655440000"
    expect(ensureValidUUID(valid)).toBe(valid)
    expect(isValidUUID(ensureValidUUID("not-a-uuid"))).toBe(true)
  })

  it("extracts username and strips html safely", () => {
    expect(extractUsernameFromEmail("alice@bughive.dev")).toBe("alice")
    expect(stripHtml("<p>Hello <b>world</b></p>")).toBe("Hello world")
  })

  it("manages recently viewed list with dedupe", () => {
    vi.spyOn(window, "dispatchEvent")
    addRecentlyViewedBug({ id: "1", title: "First" }, { limit: 3 })
    addRecentlyViewedBug({ id: "1", title: "First Updated" }, { limit: 3 })
    addRecentlyViewedBug({ id: "2", title: "Second" }, { limit: 3 })
    const list = getRecentlyViewedBugs(3)
    expect(list).toHaveLength(2)
    expect(list[0].id).toBe("2")
  })
})
