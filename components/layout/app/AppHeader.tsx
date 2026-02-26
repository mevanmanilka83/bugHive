import Link from "next/link"
import Image from "next/image"
import { HomeHeaderUser } from "@/components/home/HomeHeaderUser"
import type { Session } from "next-auth"

export function AppHeader({ session }: { session: Session | null }) {
  return (
    <header className="border-b bg-background">
      <div className="flex items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="BugHive logo"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg"
              priority
            />
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
