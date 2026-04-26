"use client"

import { useEffect, useState } from "react"
import { FAQ } from "@/components/features/faq/faq"
import { FAQSkeleton } from "@/components/features/skeletons/FAQSkeleton"
import type { FaqItem } from "@/components/features/faq/faq"

interface FAQClientProps {
  initialItems: FaqItem[]
}

export function FAQClient({ initialItems }: FAQClientProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <FAQSkeleton />
  }

  return <FAQ faqItems={initialItems} />
}
