import { Tag } from "lucide-react"
import { auth } from "@/lib"
import { TagsList } from "@/components/tags/TagsList"
import { PublicPageLayout } from "@/components/PublicPageLayout"

export default async function TagsPage() {
  const session = await auth()

  return (
    <PublicPageLayout session={session} sidebarActive="tags" useAuthFallback>
      <div className="rounded-lg border border-border/40 bg-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Tag className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold sm:text-2xl">All Tags</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Browse all tags used in public bug reports. Click a tag to filter bugs.
        </p>
      </div>
      <TagsList />
    </PublicPageLayout>
  )
}
