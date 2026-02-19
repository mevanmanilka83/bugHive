import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | BugHive",
  description:
    "Privacy policy for BugHive – how we collect, use, and protect your information.",
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <article className="max-w-4xl mx-auto py-8 px-4 sm:px-6 bg-background">
      <header>
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <Separator className="mb-6" />
        <p className="mb-6 text-base text-muted-foreground">
          At BugHive, we take your privacy seriously. This policy explains how we
          collect, use, and protect your information when you use our bug
          tracking and collaboration platform.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">
            Information We Collect
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                Account Information
              </h3>
              <p className="text-base text-muted-foreground">
                When you sign up, we collect your email, name (if provided), and
                profile image from your authentication provider (e.g. GitHub or
                email). We use this to identify you and manage your account.
              </p>
            </div>
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                Bug Reports &amp; Content
              </h3>
              <p className="text-base text-muted-foreground">
                Bug reports, descriptions, steps to reproduce, attachments,
                solutions, and comments you submit are stored to provide the
                service. Visibility (public or private) is under your control
                where applicable.
              </p>
            </div>
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                Usage &amp; Logs
              </h3>
              <p className="text-base text-muted-foreground">
                We may collect usage data such as pages visited, actions taken,
                and technical logs (e.g. IP, browser) to operate, secure, and
                improve BugHive. We keep logs only as long as necessary.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4">
            How We Use Your Information
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                Providing the Service
              </h3>
              <p className="text-base text-muted-foreground">
                We use your account and content to let you create and manage bug
                reports, join clusters, post solutions, and use features like
                related bugs and the knowledge graph.
              </p>
            </div>
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                Security &amp; Support
              </h3>
              <p className="text-base text-muted-foreground">
                We use data to detect abuse, enforce our{" "}
                <Link href="/terms" className="text-primary underline">
                  Terms of Service
                </Link>
                , and respond to support requests. We do not sell your personal
                information.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Sharing &amp; Third Parties</h2>
          <div className="space-y-4">
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                Public Content
              </h3>
              <p className="text-base text-muted-foreground">
                Bug reports and solutions you mark as public can be seen by other
                users and may be indexed by search engines. Private and
                cluster-restricted content is only visible according to your
                settings.
              </p>
            </div>
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                Service Providers
              </h3>
              <p className="text-base text-muted-foreground">
                We use trusted providers for hosting, databases, authentication,
                and storage. They process data only to provide these services to
                us and under contractual obligations.
              </p>
            </div>
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                External Integrations
              </h3>
              <p className="text-base text-muted-foreground">
                When you connect or when we surface related content from
                GitHub, Jira, Stack Overflow, or Bugzilla, those platforms have
                their own privacy policies. We do not control their data
                practices.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4">Your Rights</h2>
          <div className="space-y-4">
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                Access &amp; Correction
              </h3>
              <p className="text-base text-muted-foreground">
                You can view and edit your profile and most of your content
                in-app. You may request a copy of your data or deletion by
                contacting us.
              </p>
            </div>
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                Cookies &amp; Preferences
              </h3>
              <p className="text-base text-muted-foreground">
                We use essential cookies for authentication and session
                management. You can control optional preferences in your
                browser or account settings.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4">Updates</h2>
          <p className="mb-4 text-base text-muted-foreground">
            We may update this Privacy Policy from time to time. Significant
            changes will be posted on this page. Continued use of BugHive after
            updates means you accept the revised policy.
          </p>
        </section>
      </div>

      <footer className="mt-8 pt-6 border-t text-sm text-center text-muted-foreground">
        <p>Last updated February 2025</p>
        <p className="mt-2">
          <Link href="/" className="text-primary hover:underline">
            Back to BugHive
          </Link>
        </p>
      </footer>
    </article>
  )
}
