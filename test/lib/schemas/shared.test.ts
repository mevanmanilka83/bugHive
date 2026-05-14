import { describe, expect, it } from "vitest"
import {
  ALLOWED_FILE_TYPES,
  MAX_ATTACHMENTS,
  MAX_FILE_SIZE,
  getAttachmentSchema,
  getLinksSchema,
  isValidUrl,
} from "@/lib/schemas/zod/shared"

describe("shared zod schema helpers", () => {
  it("validates supported urls", () => {
    expect(isValidUrl("https://bughive.dev/path")).toBe(true)
    expect(isValidUrl("http://example.com")).toBe(true)
    expect(isValidUrl("ftp://example.com")).toBe(false)
    expect(isValidUrl("example.com")).toBe(false)
  })

  it("accepts comma-separated valid links", () => {
    const schema = getLinksSchema()
    const parsed = schema.safeParse("https://a.com, https://b.com/path")
    expect(parsed.success).toBe(true)
  })

  it("rejects invalid links in links schema", () => {
    const schema = getLinksSchema()
    const parsed = schema.safeParse("https://ok.com, not-a-url")
    expect(parsed.success).toBe(false)
  })

  it("exposes attachment constraints", () => {
    expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024)
    expect(MAX_ATTACHMENTS).toBe(5)
    expect(ALLOWED_FILE_TYPES.length).toBeGreaterThan(0)
  })

  it("accepts null/undefined attachments", () => {
    const schema = getAttachmentSchema()
    expect(schema.safeParse(null).success).toBe(true)
    expect(schema.safeParse(undefined).success).toBe(true)
  })
})
