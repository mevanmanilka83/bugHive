import { createBugHandler } from "@/lib/api-handlers"

const bugHandler = createBugHandler()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = bugHandler.GET
export const POST = bugHandler.POST
