import type { Session } from "next-auth"
import { AppFooter } from "@/components/AppFooter"
import { AppHeader } from "@/components/AppHeader"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { SidebarPublicNav } from "@/components/SidebarPublicNav"

type NavActive =
  | "home"
  | "public"
  | "mybugs"
  | "tags"
  | "clusters"
  | "notifications"
  | "saved"
  | "activity"
  | "settings"

interface PublicPageLayoutProps {
  children: React.ReactNode
  session: Session | null
  /** Sidebar active item; matches SidebarPublicNav `active` prop */
  sidebarActive: NavActive
  /** Use auth fallback for sidebar (e.g. show sign-in for protected links) */
  useAuthFallback?: boolean
  /** Optional right column (e.g. RelatedBugsPanel) */
  aside?: React.ReactNode
  /** Extra class for main content section */
  sectionClassName?: string
}

/**
 * Shared layout for public-facing pages: header, sidebar, main content, optional aside, footer, mobile nav.
 * Use this to keep layout consistent and avoid duplicating the same markup across pages.
 */
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
        <AppHeader session={session} />

        <div className="flex flex-1 gap-6 py-6">
          <SidebarPublicNav
            active={sidebarActive}
            isAuthenticated={isAuthenticated}
            useAuthFallback={useAuthFallback}
            className="hidden md:flex md:shrink-0"
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
