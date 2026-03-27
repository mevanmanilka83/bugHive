"use client"

import Link from "next/link"
import { Info } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HomeHeaderStatsDialog } from "@/components/home/HomeHeaderStatsDialog"
import { LeaderboardDialog } from "@/components/leaderboard/LeaderboardDialog"
import { HunterLevelProgress } from "@/components/home/HunterLevelProgress"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu"
import { signOut } from "next-auth/react"
import { cn } from "@/lib"

interface HomeHeaderUserProps {
  session:
  | {
    user?: {
      name?: string | null
      email?: string | null
      image?: string | null
    } | null
  }
  | null
}

export function HomeHeaderUser({ session }: HomeHeaderUserProps) {
  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <HomeHeaderStatsDialog />
        <LeaderboardDialog period="week" limit={10} headerStyle />
        <Button asChild size="sm" className="px-4">
          <Link href="/auth/signup">Sign up</Link>
        </Button>
      </div>
    )
  }

  const name = session.user?.name || session.user?.email || "User"
  const email = session.user?.email || ""
  const image = session.user?.image || ""

  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  return (
    <div className="flex items-center gap-2">
      <HomeHeaderStatsDialog />
      <LeaderboardDialog period="week" limit={10} headerStyle />
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-md",
              "border border-border/60 bg-background text-[var(--icon-orange)]",
              "hover:bg-muted/40 hover:text-[var(--icon-orange)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--icon-orange)]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "transition-colors"
            )}
            aria-label="Account details"
          >
            <Info className="h-4 w-4" />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account details</DialogTitle>
            <DialogDescription>
              Your profile and session information.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={image} alt={name} priority />
                <AvatarFallback className="text-lg">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{name}</span>
                {email && (
                  <span className="text-sm text-muted-foreground">{email}</span>
                )}
              </div>
            </div>
            <dl className="grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Display name</dt>
                <dd className="font-medium">{name}</dd>
              </div>
              {email && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium truncate max-w-[200px]">{email}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Profile image</dt>
                <dd className="font-medium">
                  {image ? "Set" : "Not set"}
                </dd>
              </div>
            </dl>
          </div>
        </DialogContent>
      </Dialog>
      {/* User menu (single, consistent trigger across breakpoints) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 rounded-md",
              "border border-border/60 bg-background px-2.5 py-1.5",
              "hover:bg-muted/40 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
            aria-label="User menu"
          >
            <HunterLevelProgress size={28} className="shrink-0" />
            <Avatar className="h-7 w-7">
              <AvatarImage src={image} alt={name} priority />
              <AvatarFallback className="bg-muted/60 text-foreground">{name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col min-w-0">
              <span className="text-xs font-medium leading-tight truncate max-w-[140px]">{name}</span>
              {email && (
                <span className="text-[11px] text-muted-foreground leading-tight truncate max-w-[140px]">
                  {email}
                </span>
              )}
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-2 py-2 border-b">
            <p className="text-sm font-medium truncate">{name}</p>
            {email && <p className="text-xs text-muted-foreground truncate">{email}</p>}
          </div>
          <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

