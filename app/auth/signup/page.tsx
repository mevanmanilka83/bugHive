import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { SignupForm } from "@/components/features/auth/SignupForm"

export default function SignupPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string }
}) {
  const callbackUrl = searchParams?.callbackUrl || "/"
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href={callbackUrl}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <span>Back</span>
        </Link>
        <a href="/" className="flex items-center gap-2 self-center font-medium">
          <Image
            src="/logo.png"
            alt="BugHive Logo"
            width={24}
            height={24}
            className="rounded-md"
          />
          BugHive
        </a>
        <SignupForm callbackUrl={callbackUrl} />
      </div>
    </div>
  )
}
