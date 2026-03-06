import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | BugHive",
  description:
    "Terms of service for BugHive – collaborative bug tracking and solutions.",
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return (
    <article className="max-w-4xl mx-auto py-8 px-4 sm:px-6 bg-background">
      <header>
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <Separator className="mb-6" />
        <p className="mb-6 text-base text-muted-foreground">
          By using BugHive to report, track, and discuss bugs, you agree to these
          terms. Please read them carefully.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Use of the Service</h2>
          <div className="space-y-4">
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                Bug Reports &amp; Content
              </h3>
              <p className="text-base text-muted-foreground">
                You may create bug reports, add descriptions, steps to reproduce,
                attachments, and participate in clusters and discussions. You are
                responsible for the accuracy and legality of the content you
                submit. Do not post confidential data, malware, or content that
                infringes others&apos; rights.
              </p>
            </div>
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                Visibility &amp; Clusters
              </h3>
              <p className="text-base text-muted-foreground">
                Bug reports can be set to public or private. Clusters allow
                teams to group related bugs and collaborate. You must respect
                cluster membership and visibility settings. Do not share
                private or invite-only content without permission.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4">Content &amp; Rights</h2>
          <div className="space-y-4">
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                Content Ownership
              </h3>
              <p className="text-base text-muted-foreground">
                You retain ownership of your original content. By posting bug
                reports, solutions, and comments, you grant BugHive a
                non-exclusive license to store, display, and use that content to
                operate and improve the service.
              </p>
            </div>
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                Acceptable Use
              </h3>
              <p className="text-base text-muted-foreground">
                Do not use BugHive to harass others, spread misinformation, or
                violate laws. You may not scrape, automate bulk access, or
                circumvent access controls without permission.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Data &amp; Processing</h2>
          <div className="space-y-4">
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                Stored Data
              </h3>
              <p className="text-base text-muted-foreground">
                Bug reports, solutions, attachments, and account data are stored
                to provide the service. We use industry-standard security
                measures. For details on collection and use, see our{" "}
                <Link href="/privacy" className="text-primary underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                Related Bugs &amp; External Links
              </h3>
              <p className="text-base text-muted-foreground">
                BugHive may surface related issues from GitHub or Stack Overflow
                when configured. Those services have their own terms. We do not
                control external content or APIs.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4">
            Limitations &amp; Liability
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                Service &quot;As Is&quot;
              </h3>
              <p className="text-base text-muted-foreground">
                BugHive is provided as is. We do not guarantee uninterrupted
                service, accuracy of suggested related bugs, or that solutions
                will resolve your issues.
              </p>
            </div>
            <div>
              <h3 className="block mb-2 text-base font-semibold">
                Limitation of Liability
              </h3>
              <p className="text-base text-muted-foreground">
                To the extent permitted by law, BugHive and its operators are
                not liable for any indirect, incidental, or consequential
                damages arising from your use of the service or reliance on
                content posted by others.
              </p>
            </div>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4">Changes to Terms</h2>
          <p className="mb-4 text-base text-muted-foreground">
            We may update these terms from time to time. Material changes will
            be posted on this page. Continued use of BugHive after changes
            constitutes acceptance of the updated terms.
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
