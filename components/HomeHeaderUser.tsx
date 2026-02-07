"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
      <>
        <Button asChild size="sm" className="rounded-full px-4">
          <Link href="/auth/signup">Sign up</Link>
        </Button>
      </>
    )
  }

  const name = session.user?.name || session.user?.email || "User"
  const email = session.user?.email || ""
  const image = session.user?.image || ""

  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-3 rounded-full border bg-background px-3 py-1.5">
        <Avatar className="h-7 w-7">
          <AvatarImage src={image} alt={name} />
          <AvatarFallback>
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-xs font-medium leading-tight">{name}</span>
          {email && (
            <span className="text-[11px] text-muted-foreground leading-tight">
              {email}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 rounded-full px-2 text-[11px]"
          onClick={handleLogout}
        >
          Log out
        </Button>
      </div>
    </div>
  )
}

