import type { FaqItem } from "@/components/faq"

/** FAQ entries for the dedicated FAQ settings page. */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is BugHive?",
    answer:
      "BugHive is a place to report, share, and solve real-world bugs with your team and the community.",
  },
  {
    question: "How do I report a bug?",
    answer:
      'Click "Report Bug" on the home page or in the header. Fill in title, description, and optional steps to reproduce.',
  },
  {
    question: "What are clusters?",
    answer:
      "Clusters are teams or groups. You can create one and invite others to collaborate on bugs in a shared space.",
  },
  {
    question: "How do votes work?",
    answer:
      "You can upvote or downvote bugs and solutions. Votes help surface the most useful content.",
  },
  {
    question: "Who can see my bugs?",
    answer:
      "Public bugs are visible to everyone. Bugs in a cluster follow that cluster's visibility. You can change profile and activity visibility in Settings.",
  },
  {
    question: "How do I create a cluster or team?",
    answer:
      "Go to Teams & clusters from the sidebar, then click Create cluster. Name it and choose visibility (public or private). You can then invite members by email.",
  },
  {
    question: "What are tags and how do I use them?",
    answer:
      "Tags help you categorize and filter bugs (e.g. by feature, browser, or priority). Add tags when reporting a bug or from the Tags section in the dashboard.",
  },
  {
    question: "How do I save or bookmark a bug?",
    answer:
      "Open a bug and use the save/bookmark option, or go to Saved in the sidebar to see bugs you've saved for later.",
  },
  {
    question: "Can I edit or delete my bug report?",
    answer:
      "You can edit your own bug reports and solutions. Delete options depend on whether the bug has solutions or is linked to a cluster; check the bug page for available actions.",
  },
  {
    question: "How do notifications work?",
    answer:
      "You get in-app notifications for cluster invites, join requests, mentions, and bug updates. Manage email and in-app preferences under Settings → Notification preferences.",
  },
  {
    question: "Is BugHive free to use?",
    answer:
      "BugHive offers core features for reporting and solving bugs with your team. Some advanced or team features may vary; check the app for your current plan.",
  },
]
