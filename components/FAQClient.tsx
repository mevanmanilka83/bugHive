"use client"

import { useEffect, useState } from "react"
import { FAQ } from "@/components/faq"
import { FAQSkeleton } from "@/components/skeletons/FAQSkeleton"
import type { FaqItem } from "@/components/faq"

interface FAQClientProps {
  initialItems: FaqItem[]
}

export function FAQClient({ initialItems }: FAQClientProps) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading delay for skeleton visibility
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
