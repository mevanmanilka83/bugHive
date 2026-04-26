import type { Session } from "next-auth"
import type { AuthenticatedSession } from "@/lib/auth/helpers"
import { AppFooter } from "@/components/layout/app/AppFooter"
import { AppHeader } from "@/components/layout/app/AppHeader"
import { PublicSidebarNav } from "@/components/layout/public/PublicSidebarNav"
import { MobileBottomNav } from "@/components/layout/mobile/MobileBottomNav"

type NavActive =
  | "home"
  | "public"
  | "mybugs"
  | "tags"
  | "clusters"
  | "notifications"
  | "saved"
  | "workspaces"
  | "activity"
  | "settings"

interface PublicPageLayoutProps {
  children: React.ReactNode
  session: Session | AuthenticatedSession | null
  sidebarActive: NavActive
  useAuthFallback?: boolean
  aside?: React.ReactNode
  sectionClassName?: string
}

export function PublicPageLayout({
  children,
  session,
  sidebarActive,
  useAuthFallback = false,
  aside,
  sectionClassName,
}: PublicPageLayoutProps) {
  const isAuthenticated = !!session

  return (
    <main className="min-h-screen bg-muted/20 flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 pb-20 sm:px-4 md:pb-0">
        <AppHeader session={session as Session | null} />

        <div className="flex flex-1 gap-6 py-6">
          <PublicSidebarNav
            active={sidebarActive}
            isAuthenticated={isAuthenticated}
            useAuthFallback={useAuthFallback}
            className="hidden lg:flex lg:shrink-0"
          />

          <section
            className={
              sectionClassName ??
              (aside ? "flex-1 min-w-0 min-h-0 overflow-y-auto" : "flex-1 min-w-0")
            }
          >
            {children}
          </section>

          {aside != null ? (
            <aside className="hidden w-72 shrink-0 md:block">
              <div className="sticky top-6">{aside}</div>
            </aside>
          ) : null}
        </div>

        <AppFooter />
      </div>
      <MobileBottomNav
        active={sidebarActive}
        isAuthenticated={isAuthenticated}
        useAuthFallback={useAuthFallback}
      />
    </main>
  )
}
