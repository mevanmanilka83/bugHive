"use client"

import Link from "next/link"
import { Info } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HomeHeaderStatsDialog } from "@/components/home/HomeHeaderStatsDialog"
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
      {/* Fire icon: community stats and quick links */}
      <HomeHeaderStatsDialog />
      {/* Info icon: opens dialog with user/account details */}
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="border-2 border-icon-orange p-1.5 text-icon-orange hover:bg-icon-orange/10 hover:text-icon-orange/90 focus:outline-none focus:ring-2 focus:ring-icon-orange focus:ring-offset-2 transition-colors relative group/btn"
            aria-label="Account details"
          >
            {/* Add brackets manually */}
            <div className="absolute -left-[1px] -top-[1px] z-10 font-[system-ui]">
              <div className="relative">
                <div className="bg-[#8B5E3C] w-[1px] h-[4px] absolute top-0" />
                <div className="bg-[#8B5E3C] w-[4px] h-[1px] absolute left-0" />
              </div>
            </div>
            <div className="absolute -right-[0px] -top-[1px] z-10 font-[system-ui]">
              <div className="relative">
                <div className="bg-[#8B5E3C] w-[1px] h-[4px] absolute top-0" />
                <div className="bg-[#8B5E3C] w-[4px] h-[1px] absolute -left-[3.5px]" />
              </div>
            </div>
            <div className="absolute -left-[1px] -bottom-[0px] z-10 font-[system-ui]">
              <div className="relative">
                <div className="bg-[#8B5E3C] w-[1px] h-[4px] absolute -top-[3.5px]" />
                <div className="bg-[#8B5E3C] w-[4px] h-[1px] absolute left-0" />
              </div>
            </div>
            <div className="absolute -right-[0px] -bottom-[0px] z-10 font-[system-ui]">
              <div className="relative">
                <div className="bg-[#8B5E3C] w-[1px] h-[4px] absolute -top-[3.5px]" />
                <div className="bg-[#8B5E3C] w-[4px] h-[1px] absolute -left-[3.5px]" />
              </div>
            </div>
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
      {/* Mobile: avatar dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="sm:hidden">
          <button type="button" className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={image} alt={name} priority />
              <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-2 border-b">
            <p className="text-sm font-medium truncate">{name}</p>
            {email && (
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            )}
          </div>
          <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* Desktop: full pill */}
      <div className="hidden sm:flex items-center gap-3 rounded-none border border-border/60 bg-background px-3 py-1.5 relative group/pill">
        {/* Brackets for profile pill */}
        <div className="absolute -left-[1px] -top-[1px] z-10 font-[system-ui]">
          <div className="relative">
            <div className="bg-[#8B5E3C] w-[1px] h-[5px] absolute top-0" />
            <div className="bg-[#8B5E3C] w-[5px] h-[1px] absolute left-0" />
          </div>
        </div>
        <div className="absolute -right-[0px] -top-[1px] z-10 font-[system-ui]">
          <div className="relative">
            <div className="bg-[#8B5E3C] w-[1px] h-[5px] absolute top-0" />
            <div className="bg-[#8B5E3C] w-[5px] h-[1px] absolute -left-[4.5px]" />
          </div>
        </div>
        <div className="absolute -left-[1px] -bottom-[0px] z-10 font-[system-ui]">
          <div className="relative">
            <div className="bg-[#8B5E3C] w-[1px] h-[5px] absolute -top-[4.5px]" />
            <div className="bg-[#8B5E3C] w-[5px] h-[1px] absolute left-0" />
          </div>
        </div>
        <div className="absolute -right-[0px] -bottom-[0px] z-10 font-[system-ui]">
          <div className="relative">
            <div className="bg-[#8B5E3C] w-[1px] h-[5px] absolute -top-[4.5px]" />
            <div className="bg-[#8B5E3C] w-[5px] h-[1px] absolute -left-[4.5px]" />
          </div>
        </div>

        <Avatar className="h-7 w-7">
          <AvatarImage src={image} alt={name} priority />
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-xs font-medium leading-tight">{name}</span>
          {email && (
            <span className="text-[11px] text-muted-foreground leading-tight truncate max-w-[120px]">
              {email}
            </span>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          className="h-6 px-2 text-[11px] bg-muted/30 hover:bg-muted text-foreground border-0 shadow-none"
          onClick={handleLogout}
        >
          Log out
        </Button>
      </div>
    </div>
  )
}

