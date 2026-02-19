import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"
import { HomeHeaderUser } from "@/components/HomeHeaderUser"
import type { Session } from "next-auth"

export function AppHeader({ session }: { session: Session | null }) {
  return (
    <header className="border-b bg-background">
      <div className="flex items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold leading-tight">BugHive</span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <HomeHeaderUser session={session} />
        </div>
      </div>
    </header>
  )
}
