import { checkAuth, supabase } from "@/lib"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const authResult = await checkAuth()
  if (authResult instanceof NextResponse) return authResult

  const { user } = authResult
  const { data: dbUser } = await supabase
    .from("users")
    .select("points, current_rank, badges")
    .eq("id", user.id)
    .single()

  const points = dbUser?.points ?? 0
  const currentRank = dbUser?.current_rank ?? "larva"
  const badges = Array.isArray(dbUser?.badges) ? dbUser.badges : []

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      points,
      currentRank,
      badges,
    },
  })
}
