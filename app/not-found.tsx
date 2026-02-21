import Link from "next/link"
import { auth } from "@/lib"
import { PublicPageLayout } from "@/components/PublicPageLayout"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export const metadata = {
  title: "404 | BugHive",
  description: "Page not found",
}

export default async function NotFound() {
  const session = await auth()

  return (
    <PublicPageLayout session={session} sidebarActive="public" useAuthFallback>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="rounded-xl bg-muted p-4 mb-6">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight mb-2">404</h1>
        <p className="text-muted-foreground mb-6 max-w-sm">
          This page could not be found. The bug or resource may have been removed or the link is incorrect.
        </p>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </PublicPageLayout>
  )
}
