import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth/auth.config"
import { NextResponse } from "next/server"

const ROUTE_PATTERNS = {
  AUTH_PAGES: ['/auth/signin', '/auth/signup'],
  API_AUTH_ROUTES: ['/api/auth/'],
  PUBLIC_ROUTES: ['/', '/api/health', '/api/chat', '/api/ai-refine'],
} as const

function isAuthPage(pathname: string): boolean {
  return ROUTE_PATTERNS.AUTH_PAGES.some(route => pathname.startsWith(route))
}

function isApiAuthRoute(pathname: string): boolean {
  return ROUTE_PATTERNS.API_AUTH_ROUTES.some(route => pathname.startsWith(route))
}

function isPublicRoute(pathname: string): boolean {
  return ROUTE_PATTERNS.PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

export default NextAuth(authConfig).auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const pathname = nextUrl.pathname

  if (isPublicRoute(pathname) || isApiAuthRoute(pathname)) {
    return NextResponse.next()
  }

  if (isAuthPage(pathname)) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn && !isAuthPage(pathname)) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
