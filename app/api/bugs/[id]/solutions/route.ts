import { NextRequest } from "next/server"
import { createSolutionHandler } from "@/lib/api-handler"

const solutionHandler = createSolutionHandler()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = solutionHandler.GET
export const POST = solutionHandler.POST
export const PATCH = solutionHandler.PATCH
export const DELETE = solutionHandler.DELETE
