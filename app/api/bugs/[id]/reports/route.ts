import { NextRequest } from "next/server"
import { createBugHandler } from "@/lib"

const bugHandler = createBugHandler()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = bugHandler.GET
export const PATCH = bugHandler.PATCH
export const DELETE = bugHandler.DELETE