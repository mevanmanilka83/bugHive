import { describe, expect, it } from "vitest"

const MODULES: string[] = [
  "@/lib/faq",
  "@/lib/password",
  "@/lib/auth/auth.config",
  "@/lib/config/environment",
  "@/lib/config/supabaseClient",
  "@/lib/utils/index",
  "@/lib/utils/client",
  "@/lib/utils/server",
  "@/lib/validation/formValidation",
  "@/lib/errors/httpResponses",
  "@/lib/api/parseForms",
  "@/lib/realtime/supabaseBrowser",
  "@/lib/ai/llm",
  "@/lib/graph/relationshipTypes",
  "@/lib/workspaces/viewTypes",
  "@/lib/gamification/badgesRanks",
  "@/lib/schemas/index",
  "@/lib/schemas/zod/index",
  "@/lib/schemas/zod/shared",
  "@/lib/schemas/zod/bugSolution",
  "@/lib/schemas/zod/bugReport",
  "@/lib/schemas/zod/createCluster",
  "@/lib/schemas/zod/privacy",
  "@/lib/schemas/zod/login",
  "@/lib/schemas/zod/signup",
  "@/lib/schemas/zod/updateProfile",
  "@/lib/schemas/zod/changePassword",
  "@/lib/schemas/zod/acceptInvite",
  "@/lib/schemas/zod/deleteCluster",
  "@/lib/schemas/zod/inviteUser",
  "@/lib/schemas/zod/notification",
  "@/lib/schemas/zod/validation",
  "@/lib/schemas/types/index",
  "@/lib/schemas/types/cluster",
  "@/lib/schemas/types/privacy",
  "@/lib/schemas/types/notification",
  "@/lib/schemas/types/bugSolution",
  "@/lib/schemas/types/bugReport",
  "@/app/api/stats/route",
  "@/app/api/search/route",
  "@/app/api/validate-link/route",
  "@/app/api/users/batch/route",
  "@/app/api/tags/route",
  "@/app/api/saved/route",
  "@/app/api/overview/route",
  "@/app/api/leaderboard/route",
  "@/app/api/clusters/route",
  "@/app/api/bugs/route",
  "@/app/api/graph/route",
  "@/app/api/workspaces/route",
]

describe("module smoke imports", () => {
  it("targets roughly 50 source files", () => {
    expect(MODULES.length).toBe(50)
  })

  it.each(MODULES)("imports %s", async (modulePath) => {
    const mod = await import(modulePath)
    expect(mod).toBeTruthy()
  })
})
