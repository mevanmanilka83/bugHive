import { describe, expect, it } from "vitest"
import { getBugSolutionSchema } from "@/lib/schemas/zod/bugSolution"

const validPayload = {
  title: "Fix login edge case",
  description: "Handle OAuth redirect race condition.",
  solution_type: "bug_fix",
  priority: "high",
  status: "in_progress",
  assignee: "alice",
  estimated_hours: "3",
  links: "https://example.com",
  attachments: null,
}

describe("bug solution schema", () => {
  it("accepts valid payload", () => {
    const parsed = getBugSolutionSchema().safeParse(validPayload)
    expect(parsed.success).toBe(true)
  })

  it("rejects invalid estimated hours", () => {
    const parsed = getBugSolutionSchema().safeParse({
      ...validPayload,
      estimated_hours: "-2",
    })
    expect(parsed.success).toBe(false)
  })

  it("rejects unsupported status", () => {
    const parsed = getBugSolutionSchema().safeParse({
      ...validPayload,
      status: "done",
    })
    expect(parsed.success).toBe(false)
  })
})
