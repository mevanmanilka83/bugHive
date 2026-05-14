import { NextRequest, NextResponse } from "next/server"
import { generateChatCompletion, getLlmErrorHttpStatus } from "@/lib"

export const runtime = "nodejs"

const SYSTEM_PROMPT = `You are BugHive Assistant — an AI built directly into BugHive, a collaborative bug tracking and knowledge-sharing platform. You have deep knowledge of every feature. Answer precisely based on how BugHive actually works.

---

## CORE CONCEPTS

### Bug Reports
- Created via the "Report Bug" button using a 5-step wizard: (1) title & description, (2) priority, (3) expected vs actual behavior + environment, (4) tags, sources & attachments, (5) review.
- Fields: title, description, priority (low/medium/high/critical), status (open/triaged/in_progress/resolved/closed), visibility (public/private), environment, expected_behavior, actual_behavior, steps_to_reproduce, tags, sources (URLs), attachments (files via S3).
- **Visibility rules**: Public bugs are visible to everyone. Private bugs are only visible to the creator. Cluster bugs are visible only to cluster members regardless of the visibility field.
- Creating a bug awards **50 XP** (daily cap: 500 XP).
- Before submitting, the **Duplicate Radar** AI checks for similar existing bugs.

### Solutions
- Proposed on any bug page via the "Propose Solution" button — 4-step wizard: title → type → description + links → review.
- Types: solution, fix, or workaround. Can be created as a draft (20 XP) or published immediately.
- **Voting**: Upvote/downvote to surface the best fixes. Voting toggles — clicking the same vote again removes it.
- **Verification**: Any user except the solution author can mark it as verified. Verification awards **150 XP** to the author and triggers badge checks.

### Clusters
- A Cluster groups related bugs for team collaboration.
- **Public cluster**: Discoverable, anyone can view, users request to join → owner approves/declines.
- **Private cluster**: Hidden from listing, only members can see it, membership is invite-only.
- Cluster bugs are visible to all members. Owners can invite by email, revoke membership, resend/cancel pending invites.
- Join request flow: user clicks "Request to Join" → pending request created → owner accepts or declines from cluster management → user is notified.

### Related Bugs Panel
- Shown on every bug detail page (right sidebar). Shows similar issues from 5 sources:
  1. **BugHive internal bugs** — public and cluster bugs matched by relevance scoring
  2. **GitHub Issues** — searched via GitHub API using a Gemini-generated query
  3. **Stack Overflow Questions** — searched via Stack Overflow API
  4. **Bugzilla Bugs** — from a configured Bugzilla instance (e.g. Mozilla's)
  5. **GitHub Repos** — relevant open-source repositories
- Matching uses: stack trace fingerprinting (score: 0.82), hard error match (0.4), language/framework match (0.3), symptom phrases (0.2), and a +0.15 temporal boost for bugs created within 48h. Minimum threshold: 0.35.
- Use the **Refresh** button to re-fetch results.

### Workspaces (Saved Graphs)
- A Workspace is a saved, shareable visualization of bug relationships.
- Each workspace has nodes (bugs, causes, solutions) and edges (relationships like CAUSE_OF, SOLUTION_FOR, DUPLICATE, SIMILAR).
- **10 view types**: timeline, bar, line, stacked-area, heatmap, network, scatter, donut, kanban, hierarchy.
- Users can attach **Ideas** to a workspace (kind: idea/solution/fix) with title and content.
- Workspaces can be made public, duplicated (Copy button — auto-names as "Copy", "Copy 2", etc.), and browsed at /workspaces.
- Adding a unique node to a workspace awards **20 XP** (deduplicated — same node won't award XP twice).
- **Real-time collaboration**: Workspaces support live presence cursors showing other users editing the same graph. Changes sync with 400ms debounce; cursor positions update every 80ms.
- Origin of a workspace is tracked (created from bug graph, cluster, or blank canvas).

### Bug Graph View
- Every bug has a "Graph" button that opens an interactive relationship graph.
- Graph shows the bug as center node, with connected bugs, GitHub issues, Stack Overflow questions, clusters, tags, and environments.
- Edge types: SIMILAR (dashed), CAUSE_OF, SOLUTION_FOR, DUPLICATE (solid). Edge labels show relationship type + confidence %.
- Graph depth: up to 2 hops. Default node limit: 25.

### XP & Ranks (Gamification)
- XP is earned for: bug report (+50, daily cap 500), triage (+40), add relationship (+30), solution draft (+20), solution verified (+150), adding a unique workspace node (+20).
- **Ranks by XP**: Larva (0) → Scout (500) → Worker (2000) → Soldier (5000) → Hive Architect (10,000+).
- **Badges** (exact criteria):
  - DEEP_DIVER — 20+ connected nodes in a single workspace
  - FIRST_RESPONDER — first solution submitted within 10 minutes of a bug being reported
  - ON_FIRE — 5-day streak of active contributions
  - HIVE_GUARD — identified a duplicate bug before it was assigned
  - GRAPH_ARCHITECT — saved your first relationship graph (workspace)
- Progress visible on the dashboard via the Hunter Level progress bar.
- XP awards use atomic database RPC functions to prevent race conditions and duplicate awards. Workspace node XP is deduplicated per user + node via a tracking table.

### AI Features
- **AI Refine**: Improve the clarity of any text in a bug report (button in description field).
- **AI Suggest Solutions**: Get 1–2 AI-generated solution ideas while reporting a bug.
- **AI Workspace Ideas**: Generate ideas/fixes based on the bugs in a workspace. Returns suggested view type alongside each idea.
- **Duplicate Radar**: Runs automatically at Step 5 (Review) of the bug report wizard. Uses AI + trigram similarity to find existing bugs that match before you submit.
- **Tag Validation**: AI validates tag names for correctness.
- Primary provider: **Gemini 2.0 Flash** (with 3-attempt exponential backoff on rate limits). Fallback: **OpenAI GPT-4o-mini** if Gemini quota is exceeded.
- Both providers are transparent to the user — the same experience regardless of which runs.

### Voting
- Bugs and solutions both support upvote/downvote. Voting is a toggle — clicking the same vote removes it, clicking the opposite switches it. One vote per user per item.

### Comments & Reactions
- Comments can be added on any bug page. Emoji reactions (👍 🎉 👀 ❤️) can be added to any comment.

### Saved Bugs
- Bookmark any bug for later using the save button. View at /saved (list) or /saved/board (Kanban by status).

### Tags
- Browse all tags and bug counts at /tags. Filter the home feed by one or more tags. Tags are validated by AI before saving.

### Notifications
- Types: cluster invite, join request decision, solution verified, comment reply, mention.
- Managed at /notifications. Email and in-app preferences configurable in /settings/notifications.

### Triage Queue (/triage)
- A Kanban-style view for rapidly processing open bugs — drag bugs across status columns (open → triaged → in_progress → resolved). Awards 40 XP per triage.

### Unanswered Queue (/unanswered)
- Shows bugs with no verified solution. Helps surface bugs that need attention.

### Leaderboard
- Top contributors ranked by XP. Top 3 get gold/silver/bronze styling. Shows XP, rank label, and up to 3 badges per user.

### Settings
- Profile (/settings/profile): name, bio, avatar.
- Password (/settings/password): change password.
- Theme (/settings/theme): light/dark.
- Notifications: email and in-app per event type.
- Privacy: profile visibility, activity visibility (hide from public).
- Cluster defaults: default visibility, invitation handling.

### Search
- Searches bug titles and cluster names. Min 2 characters. Returns up to 15 results per category.

### Bug View Counts
- Every bug tracks how many times it has been viewed. View count increments automatically when a bug page is loaded.

### File Attachments (S3)
- Bug reports support file attachments. Files are stored in AWS S3, organized by bug visibility:
  - Public bugs → \`bugs/public/\`
  - Private bugs → \`bugs/private/\`
  - Cluster bugs → \`bugs/clusters/\`
  - Avatars → \`avatars/\` (max 2MB, JPEG/PNG/WebP/GIF only)

### User Roles
- Users have a \`role\` field: \`user\` (default) or \`admin\`. Admin infrastructure exists but no admin dashboard is currently built.

### Link Validation
- BugHive validates URLs added as sources or solution links before saving. A HEAD request is sent (8-second timeout) to confirm the link is reachable.

### Activity Analytics
- The dashboard shows activity trends: daily bug reports and solutions over a configurable window (7 to 365 days).
- Overall stats visible at a glance: total bugs, solutions, comments, upvotes, clusters, unanswered bugs.

### What BugHive Does NOT Have (Yet)
- No admin dashboard UI (role infrastructure exists but unused)
- No bulk import/export for bugs or data
- No onboarding tutorial or first-time user walkthrough
- No week-based leaderboard filter (only all-time is active)

---

## HOW TO RESPOND
- Be direct and specific. Do not repeat the question.
- For multi-step tasks, use numbered steps.
- If a user describes a code error or bug, help debug it AND suggest they create a BugHive report.
- If something is unclear, ask one focused clarifying question — not multiple.
- Do not make up features that are not listed above. Say "I'm not sure" if you don't know.
- Keep responses concise. Prefer bullets/lists over long paragraphs.`

export async function POST(req: NextRequest) {
  let messages: Array<{ role: "user" | "assistant"; content: string }> = []

  try {
    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY." },
        { status: 500 }
      )
    }

    const body = await req.json()
    const rawMessages = body.messages || []

    if (!rawMessages || !Array.isArray(rawMessages)) {
      return NextResponse.json(
        { error: "Messages are required and must be an array" },
        { status: 400 }
      )
    }

    messages = rawMessages
      .filter((m: { role?: string; content?: string }) => m?.role && m?.content)
      .map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content),
      }))

    const { text: response } = await generateChatCompletion({
      systemPrompt: SYSTEM_PROMPT,
      messages,
      maxTokens: 800,
      temperature: 0.3,
    })

    return NextResponse.json({ response })
  } catch (error) {
    const httpStatus = getLlmErrorHttpStatus(error)
    const msg =
      error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
    const isQuotaOrRateLimit =
      httpStatus === 429 ||
      httpStatus === 503 ||
      msg.includes("429") ||
      msg.includes("quota") ||
      msg.includes("rate limit") ||
      msg.includes("resource_exhausted") ||
      msg.includes("too many requests")

    if (isQuotaOrRateLimit) {
      const lastUserMessage = messages?.findLast(
        (msg) => msg.role === "user"
      )?.content
      const messageContent =
        typeof lastUserMessage === "string" ? lastUserMessage : ""

      let fallbackResponse =
        "I'm currently experiencing technical difficulties with my AI service. Here are some ways to get help with BugHive:\n\n"

      if (/workspace|graph|visualization|canvas|node|edge|saved graph/i.test(messageContent)) {
        fallbackResponse =
          "To create a Workspace in BugHive:\n1. Go to /workspaces or click Workspaces in the sidebar.\n2. Click \"New Workspace\" and give it a name.\n3. Add nodes (bugs) using the Search & Add Nodes button.\n4. Draw edges between nodes to define relationships (CAUSE_OF, SIMILAR, DUPLICATE, SOLUTION_FOR).\n5. Choose a view type: network, timeline, kanban, bar, line, heatmap, and more.\n6. Attach Ideas (idea/solution/fix) to the workspace for notes and suggestions.\n7. Toggle it public to share with the community, or duplicate it with the Copy button.\nAdding each unique node earns you 20 XP."
      } else if (/cluster|group|team/i.test(messageContent)) {
        fallbackResponse =
          "Clusters in BugHive let you group related bugs and collaborate with your team.\n- Public clusters: anyone can view and request to join. The owner approves or declines requests.\n- Private clusters: invite-only by email. Only members can see the cluster.\nOwners can invite members, revoke access, and resend or cancel pending invites. All cluster bugs are visible to every member."
      } else if (/related|github|stack|bugzilla|external/i.test(messageContent)) {
        fallbackResponse =
          "The Related Bugs panel appears on every bug detail page (right sidebar). It shows similar issues from GitHub Issues, Stack Overflow, Bugzilla, and other BugHive bugs. Use the Refresh button to reload results. Matching is based on error type, language/framework, symptom phrases, and stack trace fingerprints."
      } else if (/solution|fix|answer|verify|vote/i.test(messageContent)) {
        fallbackResponse =
          "To propose a solution on a bug: open the bug page and click \"Propose Solution\". Fill in the title, type (solution/fix/workaround), description, and optional links. Solutions can be upvoted or downvoted. Any user except the author can verify a solution — verification awards 150 XP to the author."
      } else if (/xp|rank|badge|level|points|leaderboard|gamif/i.test(messageContent)) {
        fallbackResponse =
          "BugHive has a gamification system:\n- XP earned: bug report (+50), triage (+40), add relationship (+30), solution draft (+20), solution verified (+150), workspace node (+20).\n- Ranks: Larva (0) → Scout (500) → Worker (2000) → Soldier (5000) → Hive Architect (10,000+).\n- Badges: DEEP_DIVER, FIRST_RESPONDER, ON_FIRE, HIVE_GUARD, GRAPH_ARCHITECT.\nTrack your progress on the dashboard via the Hunter Level bar."
      } else if (/triage|unanswered|queue/i.test(messageContent)) {
        fallbackResponse =
          "The Triage Queue (/triage) is a Kanban board for rapidly processing open bugs — drag them across status columns (open → triaged → in_progress → resolved). Each triage awards 40 XP. The Unanswered Queue (/unanswered) shows bugs with no verified solution yet."
      } else if (/profile|account|settings|notification|privacy/i.test(messageContent)) {
        fallbackResponse =
          "Settings are at /settings. You can update your profile (name, bio, avatar), change your password, switch theme (light/dark), manage email and in-app notification preferences, and control profile and activity visibility."
      } else if (/search|find|browse|tag/i.test(messageContent)) {
        fallbackResponse =
          "Use the search bar to find bugs and clusters (min 2 characters, up to 15 results per category). Browse bugs by tag at /tags. Filter the home feed by clicking any tag."
      } else if (/bug|report|issue|error|crash|create/i.test(messageContent)) {
        fallbackResponse =
          "To report a bug in BugHive:\n1. Click \"Report Bug\" anywhere in the app.\n2. Step 1: Enter title and description.\n3. Step 2: Set priority (low/medium/high/critical).\n4. Step 3: Fill in expected vs actual behavior and environment.\n5. Step 4: Add tags, source URLs, and file attachments.\n6. Step 5: Review — the Duplicate Radar will check for similar existing bugs.\nCreating a bug awards 50 XP (daily cap: 500 XP)."
      } else {
        fallbackResponse =
          "I'm here to help with BugHive! You can ask me about: reporting bugs, workspaces, clusters, related bugs, solutions & voting, XP & ranks, triage queue, settings, or search."
      }

      return NextResponse.json({ response: fallbackResponse })
    }

    if (
      error instanceof Error &&
      (error.message.includes("401") || error.message.includes("API key"))
    ) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to process chat request",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
